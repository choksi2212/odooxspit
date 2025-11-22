import { PrismaClient, OperationType, OperationStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to properly redistribute stock across warehouses
 * This clears existing stock and creates proper distribution
 */
async function main() {
  console.log('🔄 Redistributing stock across warehouses...');

  // Get all users
  const manager = await prisma.user.findFirst({ where: { role: 'INVENTORY_MANAGER' } });
  const staff = await prisma.user.findFirst({ where: { role: 'WAREHOUSE_STAFF' } });

  if (!manager || !staff) {
    console.error('❌ No manager or staff user found.');
    process.exit(1);
  }

  // Step 1: Delete all existing stock movements and operations
  console.log('\n🗑️  Clearing existing stock movements and operations...');
  await prisma.stockMovement.deleteMany();
  await prisma.operationItem.deleteMany();
  await prisma.operation.deleteMany();
  console.log('   ✅ Cleared all stock movements and operations');

  // Step 2: Get all products and warehouses
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });

  console.log(`\n📦 Found ${products.length} products and ${warehouses.length} warehouses`);

  // Define warehouse-specific quantities for each product type
  // These are realistic, diverse quantities that differ per warehouse
  const warehouseQuantities: Record<string, number[]> = {
    // [Main, Secondary, Mumbai, Delhi, Bangalore]
    'ELEC-LAP-001': [15, 8, 35, 25, 20],      // Laptop Computer
    'ELEC-MOU-001': [80, 45, 130, 95, 110],   // Wireless Mouse
    'ELEC-USB-001': [200, 120, 280, 220, 250], // USB-C Cable
    'ELEC-MON-001': [12, 6, 20, 18, 15],      // LED Monitor
    'ELEC-KEY-001': [45, 28, 70, 55, 60],     // Mechanical Keyboard
    'OFF-PAP-001': [100, 60, 150, 120, 140],  // A4 Paper
    'OFF-PEN-001': [80, 50, 110, 90, 100],    // Ballpoint Pens
    'OFF-STA-001': [35, 20, 50, 40, 45],      // Stapler
    'TEX-CTN-001': [600, 400, 1000, 800, 700], // Cotton Fabric
    'TEX-SLK-001': [250, 180, 400, 350, 320],  // Silk Saree Material
    'FOOD-RIC-001': [100, 70, 180, 220, 140],  // Basmati Rice
    'FOOD-TEA-001': [180, 120, 250, 280, 200], // Masala Tea
    'FOOD-TUR-001': [280, 200, 380, 420, 320], // Turmeric Powder
    'PHARM-PAR-001': [500, 350, 700, 850, 600], // Paracetamol
    'PHARM-COU-001': [120, 80, 160, 200, 140],  // Ayurvedic Cough Syrup
    'PHARM-SAN-001': [380, 280, 450, 500, 420], // Hand Sanitizer
  };

  // Step 3: Create receipt operations for each warehouse with diverse stock
  let receiptCounter = 1;
  
  for (let whIdx = 0; whIdx < warehouses.length; whIdx++) {
    const warehouse = warehouses[whIdx];
    console.log(`\n📍 Creating stock for ${warehouse.name}...`);
    
    // Get a location for this warehouse (prefer Storage locations)
    const locations = await prisma.location.findMany({
      where: { warehouseId: warehouse.id },
      orderBy: { name: 'asc' },
    });

    if (locations.length === 0) {
      console.log(`   ⚠️  No locations found, skipping`);
      continue;
    }

    const storageLocation = locations.find(loc => loc.name.includes('Storage')) || locations[0];

    // Create individual receipts for each product in this warehouse
    for (const product of products) {
      const quantities = warehouseQuantities[product.sku];
      
      if (!quantities || whIdx >= quantities.length) {
        console.log(`   ⚠️  No quantity defined for ${product.sku} in warehouse ${whIdx + 1}`);
        continue;
      }

      const qty = quantities[whIdx];

      if (qty > 0) {
        const reference = `WH/IN/${String(receiptCounter).padStart(4, '0')}`;
        
        await prisma.operation.create({
          data: {
            type: OperationType.RECEIPT,
            reference,
            status: OperationStatus.DONE,
            warehouseToId: warehouse.id,
            locationToId: storageLocation.id,
            contactName: 'Initial Stock - Supplier',
            scheduleDate: new Date('2024-01-10'),
            createdByUserId: manager.id,
            responsibleUserId: staff.id,
            items: {
              create: [{ productId: product.id, quantity: qty }],
            },
            stockMovements: {
              create: [{
                productId: product.id,
                locationToId: storageLocation.id,
                quantityDelta: qty,
                movementType: 'RECEIPT',
              }],
            },
          },
        });

        receiptCounter++;
      }
    }

    console.log(`   ✅ Created stock for ${warehouse.name}`);
  }

  // Step 4: Verify stock distribution
  console.log('\n\n📊 Stock Distribution Summary:');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const warehouse of warehouses) {
    console.log(`\n🏢 ${warehouse.name.toUpperCase()}`);
    console.log('─────────────────────────────────────────────────────────');
    
    const locations = await prisma.location.findMany({
      where: { warehouseId: warehouse.id },
      select: { id: true },
    });
    const locationIds = locations.map(l => l.id);

    let warehouseTotal = 0;

    for (const product of products.slice(0, 5)) { // Show first 5 products
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId: product.id,
          OR: [
            { locationToId: { in: locationIds } },
            { locationFromId: { in: locationIds } },
          ],
        },
        select: { quantityDelta: true, locationToId: true, locationFromId: true },
      });

      let productStock = 0;
      const stockByLocation = new Map<string, number>();

      for (const movement of movements) {
        if (movement.locationToId && locationIds.includes(movement.locationToId)) {
          const current = stockByLocation.get(movement.locationToId) || 0;
          stockByLocation.set(movement.locationToId, current + parseFloat(movement.quantityDelta.toString()));
        }
        if (movement.locationFromId && locationIds.includes(movement.locationFromId)) {
          const current = stockByLocation.get(movement.locationFromId) || 0;
          stockByLocation.set(movement.locationFromId, current - parseFloat(movement.quantityDelta.toString()));
        }
      }

      productStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);
      warehouseTotal += productStock;

      console.log(`   ${product.name.padEnd(30)} : ${String(productStock).padStart(6)} ${product.unitOfMeasure}`);
    }
    
    console.log(`   ${'TOTAL (first 5 products)'.padEnd(30)} : ${String(warehouseTotal).padStart(6)} units`);
  }

  console.log('\n\n✨ Stock redistribution completed successfully!');
  console.log(`📊 Created ${receiptCounter - 1} receipt operations`);
  console.log(`\n💡 Each warehouse now has UNIQUE stock levels!`);
  console.log(`   • Try selecting different warehouses in the Stock tab`);
  console.log(`   • Each warehouse will show different quantities`);
  console.log(`   • "All Warehouses" will show the sum of all stock`);
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


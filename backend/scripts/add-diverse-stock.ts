import { PrismaClient, OperationType, OperationStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to add diverse stock across all warehouses
 * This preserves all existing data and only adds new stock movements
 */
async function main() {
  console.log('🎯 Adding diverse stock across all warehouses...');

  // Get all products, warehouses, and locations
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
  const manager = await prisma.user.findFirst({ where: { role: 'INVENTORY_MANAGER' } });
  const staff = await prisma.user.findFirst({ where: { role: 'WAREHOUSE_STAFF' } });

  if (!manager || !staff) {
    console.error('❌ No manager or staff user found. Please ensure users exist.');
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} products and ${warehouses.length} warehouses`);

  // Get the next receipt reference number
  const lastReceipt = await prisma.operation.findFirst({
    where: { type: OperationType.RECEIPT },
    orderBy: { reference: 'desc' },
  });

  let receiptCounter = 1;
  if (lastReceipt && lastReceipt.reference) {
    const match = lastReceipt.reference.match(/\/(\d+)$/);
    if (match) {
      receiptCounter = parseInt(match[1]) + 1;
    }
  }

  // Define base quantities for each product (will be multiplied by warehouse-specific factors)
  const baseQuantities: Record<string, number> = {};
  
  // Calculate current total stock for each product to determine base
  for (const product of products) {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: product.id },
      select: { quantityDelta: true, locationToId: true, locationFromId: true },
    });

    let totalStock = 0;
    const stockByLocation = new Map<string, number>();

    for (const movement of movements) {
      if (movement.locationToId) {
        const current = stockByLocation.get(movement.locationToId) || 0;
        stockByLocation.set(movement.locationToId, current + parseFloat(movement.quantityDelta.toString()));
      }
      if (movement.locationFromId) {
        const current = stockByLocation.get(movement.locationFromId) || 0;
        stockByLocation.set(movement.locationFromId, current - parseFloat(movement.quantityDelta.toString()));
      }
    }

    totalStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);
    
    // If product has no stock, use reorder level as base, otherwise use current stock
    baseQuantities[product.id] = totalStock > 0 ? totalStock : product.reorderLevel * 2;
  }

  // Define warehouse-specific distribution factors
  const warehouseFactors: Record<string, number> = {
    'Main Warehouse': 1.0,
    'Secondary Warehouse': 0.7,
    'Mumbai Distribution Center': 1.5,
    'Delhi Central Warehouse': 1.3,
    'Bangalore Tech Hub': 1.2,
  };

  // Create stock distribution operations for each warehouse
  let operationsCreated = 0;

  for (const warehouse of warehouses) {
    console.log(`\n📍 Processing ${warehouse.name}...`);
    
    // Get locations for this warehouse
    const locations = await prisma.location.findMany({
      where: { warehouseId: warehouse.id },
      orderBy: { createdAt: 'asc' },
    });

    if (locations.length === 0) {
      console.log(`   ⚠️  No locations found, skipping`);
      continue;
    }

    const factor = warehouseFactors[warehouse.name] || 1.0;
    const targetLocation = locations[Math.floor(locations.length / 2)]; // Use middle location

    // Create a bulk receipt operation for this warehouse
    const items = [];
    const movements = [];

    for (const product of products) {
      const baseQty = baseQuantities[product.id] || product.reorderLevel * 2;
      const qty = Math.max(Math.floor(baseQty * factor), 5); // Minimum 5 units

      items.push({ productId: product.id, quantity: qty });
      movements.push({
        productId: product.id,
        locationToId: targetLocation.id,
        quantityDelta: qty,
        movementType: 'RECEIPT',
      });
    }

    const reference = `WH/DIST/${String(receiptCounter).padStart(4, '0')}`;
    
    await prisma.operation.create({
      data: {
        type: OperationType.RECEIPT,
        reference,
        status: OperationStatus.DONE,
        warehouseToId: warehouse.id,
        locationToId: targetLocation.id,
        contactName: 'Stock Distribution - Initial Inventory',
        scheduleDate: new Date('2024-01-10'),
        createdByUserId: manager.id,
        responsibleUserId: staff.id,
        items: { create: items },
        stockMovements: { create: movements },
      },
    });

    console.log(`   ✅ Created operation ${reference} with ${items.length} products`);
    operationsCreated++;
    receiptCounter++;
  }

  console.log(`\n✨ Stock distribution completed successfully!`);
  console.log(`📊 Created ${operationsCreated} receipt operations across ${warehouses.length} warehouses`);
  console.log(`\n💡 Each warehouse now has independent stock levels:`);
  
  for (const warehouse of warehouses) {
    const factor = warehouseFactors[warehouse.name] || 1.0;
    console.log(`   ${warehouse.name}: ${Math.round(factor * 100)}% of base quantities`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


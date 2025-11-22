import { PrismaClient, UserRole, OperationType, OperationStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seed Script for StockMaster
 * Creates initial data for testing and development
 */
async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.stockMovement.deleteMany();
  await prisma.operationItem.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const passwordHash = await argon2.hash('password123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.create({
    data: {
      loginId: 'admin01',
      email: 'admin@stockmaster.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  const manager = await prisma.user.create({
    data: {
      loginId: 'manager01',
      email: 'manager@stockmaster.com',
      name: 'Inventory Manager',
      role: UserRole.INVENTORY_MANAGER,
      passwordHash,
    },
  });

  const staff = await prisma.user.create({
    data: {
      loginId: 'staff01',
      email: 'staff@stockmaster.com',
      name: 'Warehouse Staff',
      role: UserRole.WAREHOUSE_STAFF,
      passwordHash,
    },
  });

  console.log(`✅ Created ${3} users`);

  // Create warehouses
  console.log('Creating warehouses...');
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      shortCode: 'WH',
      address: '123 Main Street, City, State 12345',
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      shortCode: 'WH2',
      address: '456 Secondary Ave, City, State 67890',
    },
  });

  console.log(`✅ Created ${2} warehouses`);

  // Create locations
  console.log('Creating locations...');
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Receiving Area',
        shortCode: 'RCV',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Storage Area A',
        shortCode: 'STA',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Storage Area B',
        shortCode: 'STB',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Shipping Area',
        shortCode: 'SHIP',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: secondaryWarehouse.id,
        name: 'Storage Area 1',
        shortCode: 'ST1',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: secondaryWarehouse.id,
        name: 'Storage Area 2',
        shortCode: 'ST2',
      },
    }),
  ]);

  console.log(`✅ Created ${locations.length} locations`);

  // Create product categories
  console.log('Creating product categories...');
  const categories = await Promise.all([
    prisma.productCategory.create({ data: { name: 'Electronics' } }),
    prisma.productCategory.create({ data: { name: 'Office Supplies' } }),
    prisma.productCategory.create({ data: { name: 'Furniture' } }),
    prisma.productCategory.create({ data: { name: 'Raw Materials' } }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  console.log('Creating products...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Laptop Computer',
        sku: 'ELEC-LAP-001',
        categoryId: categories[0].id,
        unitOfMeasure: 'Units',
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Mouse',
        sku: 'ELEC-MOU-001',
        categoryId: categories[0].id,
        unitOfMeasure: 'Units',
        reorderLevel: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB Cable 2m',
        sku: 'ELEC-CAB-001',
        categoryId: categories[0].id,
        unitOfMeasure: 'Units',
        reorderLevel: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Office Chair',
        sku: 'FURN-CHR-001',
        categoryId: categories[2].id,
        unitOfMeasure: 'Units',
        reorderLevel: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Desk',
        sku: 'FURN-DSK-001',
        categoryId: categories[2].id,
        unitOfMeasure: 'Units',
        reorderLevel: 3,
      },
    }),
    prisma.product.create({
      data: {
        name: 'A4 Paper (500 sheets)',
        sku: 'OFF-PAP-001',
        categoryId: categories[1].id,
        unitOfMeasure: 'Ream',
        reorderLevel: 20,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ballpoint Pen (Blue)',
        sku: 'OFF-PEN-001',
        categoryId: categories[1].id,
        unitOfMeasure: 'Box',
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Steel Sheets',
        sku: 'RAW-STL-001',
        categoryId: categories[3].id,
        unitOfMeasure: 'Sheets',
        reorderLevel: 50,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create sample operations with stock movements
  console.log('Creating sample operations...');

  // Receipt 1: Receiving laptops
  const receipt1 = await prisma.operation.create({
    data: {
      type: OperationType.RECEIPT,
      reference: 'WH/IN/0001',
      status: OperationStatus.DONE,
      warehouseToId: mainWarehouse.id,
      locationToId: locations[1].id, // Storage Area A
      contactName: 'Supplier ABC Inc.',
      scheduleDate: new Date('2024-01-15'),
      createdByUserId: manager.id,
      responsibleUserId: staff.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 25 }, // Laptops
          { productId: products[1].id, quantity: 100 }, // Mice
        ],
      },
      stockMovements: {
        create: [
          {
            productId: products[0].id,
            locationToId: locations[1].id,
            quantityDelta: 25,
            movementType: 'RECEIPT',
          },
          {
            productId: products[1].id,
            locationToId: locations[1].id,
            quantityDelta: 100,
            movementType: 'RECEIPT',
          },
        ],
      },
    },
  });

  // Receipt 2: Receiving office supplies
  const receipt2 = await prisma.operation.create({
    data: {
      type: OperationType.RECEIPT,
      reference: 'WH/IN/0002',
      status: OperationStatus.DONE,
      warehouseToId: mainWarehouse.id,
      locationToId: locations[2].id, // Storage Area B
      contactName: 'Office Supplies Co.',
      scheduleDate: new Date('2024-01-16'),
      createdByUserId: manager.id,
      responsibleUserId: staff.id,
      items: {
        create: [
          { productId: products[5].id, quantity: 50 }, // Paper
          { productId: products[6].id, quantity: 30 }, // Pens
        ],
      },
      stockMovements: {
        create: [
          {
            productId: products[5].id,
            locationToId: locations[2].id,
            quantityDelta: 50,
            movementType: 'RECEIPT',
          },
          {
            productId: products[6].id,
            locationToId: locations[2].id,
            quantityDelta: 30,
            movementType: 'RECEIPT',
          },
        ],
      },
    },
  });

  // Delivery 1: Shipping laptops
  const delivery1 = await prisma.operation.create({
    data: {
      type: OperationType.DELIVERY,
      reference: 'WH/OUT/0001',
      status: OperationStatus.DONE,
      warehouseFromId: mainWarehouse.id,
      locationFromId: locations[1].id,
      contactName: 'Customer XYZ Corp.',
      scheduleDate: new Date('2024-01-20'),
      createdByUserId: manager.id,
      responsibleUserId: staff.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 10 }, // Laptops
          { productId: products[1].id, quantity: 20 }, // Mice
        ],
      },
      stockMovements: {
        create: [
          {
            productId: products[0].id,
            locationFromId: locations[1].id,
            quantityDelta: 10,
            movementType: 'DELIVERY',
          },
          {
            productId: products[1].id,
            locationFromId: locations[1].id,
            quantityDelta: 20,
            movementType: 'DELIVERY',
          },
        ],
      },
    },
  });

  // Transfer: Move items between warehouses
  const transfer1 = await prisma.operation.create({
    data: {
      type: OperationType.TRANSFER,
      reference: 'WH/INT/0001',
      status: OperationStatus.DONE,
      warehouseFromId: mainWarehouse.id,
      locationFromId: locations[1].id,
      warehouseToId: secondaryWarehouse.id,
      locationToId: locations[4].id,
      scheduleDate: new Date('2024-01-22'),
      createdByUserId: manager.id,
      responsibleUserId: staff.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 5 }, // Laptops
        ],
      },
      stockMovements: {
        create: [
          {
            productId: products[0].id,
            locationFromId: locations[1].id,
            locationToId: locations[4].id,
            quantityDelta: 5,
            movementType: 'TRANSFER',
          },
        ],
      },
    },
  });

  // Pending operations
  await prisma.operation.create({
    data: {
      type: OperationType.RECEIPT,
      reference: 'WH/IN/0003',
      status: OperationStatus.READY,
      warehouseToId: mainWarehouse.id,
      locationToId: locations[0].id,
      contactName: 'New Supplier',
      scheduleDate: new Date(),
      createdByUserId: manager.id,
      items: {
        create: [
          { productId: products[2].id, quantity: 200 }, // USB Cables
        ],
      },
    },
  });

  await prisma.operation.create({
    data: {
      type: OperationType.DELIVERY,
      reference: 'WH/OUT/0002',
      status: OperationStatus.WAITING,
      warehouseFromId: mainWarehouse.id,
      locationFromId: locations[2].id,
      contactName: 'Customer ABC',
      scheduleDate: new Date(),
      createdByUserId: manager.id,
      items: {
        create: [
          { productId: products[5].id, quantity: 10 }, // Paper
        ],
      },
    },
  });

  console.log(`✅ Created ${6} operations`);

  console.log('✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: 3 (admin01, manager01, staff01)`);
  console.log(`   Password for all users: password123`);
  console.log(`   Warehouses: 2`);
  console.log(`   Locations: 6`);
  console.log(`   Categories: 4`);
  console.log(`   Products: 8`);
  console.log(`   Operations: 6 (4 completed, 2 pending)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


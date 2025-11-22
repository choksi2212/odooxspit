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

  // Add Indian users
  const rajesh = await prisma.user.create({
    data: {
      loginId: 'rajesh.kumar',
      email: 'rajesh.kumar@stockmaster.com',
      name: 'Rajesh Kumar',
      role: UserRole.INVENTORY_MANAGER,
      passwordHash,
    },
  });

  const priya = await prisma.user.create({
    data: {
      loginId: 'priya.sharma',
      email: 'priya.sharma@stockmaster.com',
      name: 'Priya Sharma',
      role: UserRole.WAREHOUSE_STAFF,
      passwordHash,
    },
  });

  const amit = await prisma.user.create({
    data: {
      loginId: 'amit.patel',
      email: 'amit.patel@stockmaster.com',
      name: 'Amit Patel',
      role: UserRole.WAREHOUSE_STAFF,
      passwordHash,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      loginId: 'sneha.reddy',
      email: 'sneha.reddy@stockmaster.com',
      name: 'Sneha Reddy',
      role: UserRole.INVENTORY_MANAGER,
      passwordHash,
    },
  });

  const vikram = await prisma.user.create({
    data: {
      loginId: 'vikram.singh',
      email: 'vikram.singh@stockmaster.com',
      name: 'Vikram Singh',
      role: UserRole.WAREHOUSE_STAFF,
      passwordHash,
    },
  });

  console.log(`✅ Created ${8} users`);

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

  // Indian warehouses
  const mumbaiWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Mumbai Distribution Center',
      shortCode: 'MDC',
      address: 'Plot No. 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
    },
  });

  const delhiWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Delhi Central Warehouse',
      shortCode: 'DCW',
      address: 'Sector 8, Rohini Industrial Area, Delhi, NCR 110085',
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Bangalore Tech Hub',
      shortCode: 'BTH',
      address: 'Whitefield Industrial Estate, Phase 2, Bangalore, Karnataka 560066',
    },
  });

  console.log(`✅ Created ${5} warehouses`);

  // Create locations
  console.log('Creating locations...');
  const locations = await Promise.all([
    // Main Warehouse locations
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
    // Secondary Warehouse locations
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
    prisma.location.create({
      data: {
        warehouseId: secondaryWarehouse.id,
        name: 'Loading Dock',
        shortCode: 'DOCK',
      },
    }),
    // Mumbai Warehouse locations
    prisma.location.create({
      data: {
        warehouseId: mumbaiWarehouse.id,
        name: 'Receiving Bay',
        shortCode: 'RB',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mumbaiWarehouse.id,
        name: 'Cold Storage',
        shortCode: 'COLD',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mumbaiWarehouse.id,
        name: 'Dry Goods Section',
        shortCode: 'DRY',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: mumbaiWarehouse.id,
        name: 'Dispatch Area',
        shortCode: 'DISP',
      },
    }),
    // Delhi Warehouse locations
    prisma.location.create({
      data: {
        warehouseId: delhiWarehouse.id,
        name: 'Main Storage',
        shortCode: 'MS',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: delhiWarehouse.id,
        name: 'Quality Check Zone',
        shortCode: 'QC',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: delhiWarehouse.id,
        name: 'Packaging Area',
        shortCode: 'PKG',
      },
    }),
    // Bangalore Warehouse locations
    prisma.location.create({
      data: {
        warehouseId: bangaloreWarehouse.id,
        name: 'Tech Products Zone',
        shortCode: 'TECH',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: bangaloreWarehouse.id,
        name: 'Assembly Area',
        shortCode: 'ASM',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: bangaloreWarehouse.id,
        name: 'Testing Lab',
        shortCode: 'LAB',
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: bangaloreWarehouse.id,
        name: 'Shipping Dock',
        shortCode: 'SHIP-BLR',
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
    prisma.productCategory.create({ data: { name: 'Textiles' } }),
    prisma.productCategory.create({ data: { name: 'Food & Beverage' } }),
    prisma.productCategory.create({ data: { name: 'Pharmaceuticals' } }),
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
        costPrice: 45000.00,
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Mouse',
        sku: 'ELEC-MOU-001',
        categoryId: categories[0].id,
        unitOfMeasure: 'Units',
        costPrice: 450.00,
        reorderLevel: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB Cable 2m',
        sku: 'ELEC-CAB-001',
        categoryId: categories[0].id,
        unitOfMeasure: 'Units',
        costPrice: 150.00,
        reorderLevel: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Office Chair',
        sku: 'FURN-CHR-001',
        categoryId: categories[2].id,
        unitOfMeasure: 'Units',
        costPrice: 5500.00,
        reorderLevel: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Desk',
        sku: 'FURN-DSK-001',
        categoryId: categories[2].id,
        unitOfMeasure: 'Units',
        costPrice: 8500.00,
        reorderLevel: 3,
      },
    }),
    prisma.product.create({
      data: {
        name: 'A4 Paper (500 sheets)',
        sku: 'OFF-PAP-001',
        categoryId: categories[1].id,
        unitOfMeasure: 'Ream',
        costPrice: 350.00,
        reorderLevel: 20,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ballpoint Pen (Blue)',
        sku: 'OFF-PEN-001',
        categoryId: categories[1].id,
        unitOfMeasure: 'Box',
        costPrice: 120.00,
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Steel Sheets',
        sku: 'RAW-STL-001',
        categoryId: categories[3].id,
        unitOfMeasure: 'Sheets',
        costPrice: 850.00,
        reorderLevel: 50,
      },
    }),
    // Indian products
    prisma.product.create({
      data: {
        name: 'Cotton Fabric - Khadi',
        sku: 'TEX-CTN-001',
        categoryId: categories[4].id,
        unitOfMeasure: 'Meters',
        costPrice: 280.00,
        reorderLevel: 500,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Silk Saree Material',
        sku: 'TEX-SLK-001',
        categoryId: categories[4].id,
        unitOfMeasure: 'Meters',
        costPrice: 1500.00,
        reorderLevel: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Basmati Rice - 25kg',
        sku: 'FOOD-RIC-001',
        categoryId: categories[5].id,
        unitOfMeasure: 'Bags',
        costPrice: 2200.00,
        reorderLevel: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Masala Tea (CTC)',
        sku: 'FOOD-TEA-001',
        categoryId: categories[5].id,
        unitOfMeasure: 'Kg',
        costPrice: 450.00,
        reorderLevel: 150,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Turmeric Powder - 1kg',
        sku: 'FOOD-TUR-001',
        categoryId: categories[5].id,
        unitOfMeasure: 'Packets',
        costPrice: 180.00,
        reorderLevel: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Paracetamol Tablets (500mg)',
        sku: 'PHARM-PAR-001',
        categoryId: categories[6].id,
        unitOfMeasure: 'Strips',
        costPrice: 25.00,
        reorderLevel: 500,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ayurvedic Cough Syrup',
        sku: 'PHARM-COU-001',
        categoryId: categories[6].id,
        unitOfMeasure: 'Bottles',
        costPrice: 150.00,
        reorderLevel: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hand Sanitizer - 500ml',
        sku: 'PHARM-SAN-001',
        categoryId: categories[6].id,
        unitOfMeasure: 'Bottles',
        costPrice: 95.00,
        reorderLevel: 300,
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
      contactName: 'Tata Electronics Ltd.',
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
      contactName: 'Bajaj Office Solutions',
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

  console.log(`✅ Created ${6} initial operations`);

  // Create diverse stock across all warehouses
  console.log('Creating diverse stock across all warehouses...');
  
  // Define stock distribution for each product across all warehouses
  const stockDistribution = [
    // Laptop Computer
    { productId: products[0].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 1, qty: 15 }, // Storage Area A
      { warehouseId: secondaryWarehouse.id, locationIdx: 4, qty: 5 }, // Storage Area 1 (after transfer)
      { warehouseId: mumbaiWarehouse.id, locationIdx: 8, qty: 30 },
      { warehouseId: delhiWarehouse.id, locationIdx: 12, qty: 20 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 16, qty: 25 },
    ]},
    // Wireless Mouse
    { productId: products[1].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 1, qty: 80 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 5, qty: 50 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 9, qty: 120 },
      { warehouseId: delhiWarehouse.id, locationIdx: 13, qty: 90 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 17, qty: 110 },
    ]},
    // USB-C Cable
    { productId: products[2].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 2, qty: 150 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 6, qty: 100 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 10, qty: 200 },
      { warehouseId: delhiWarehouse.id, locationIdx: 14, qty: 180 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 18, qty: 220 },
    ]},
    // LED Monitor 24"
    { productId: products[3].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 1, qty: 12 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 4, qty: 8 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 8, qty: 18 },
      { warehouseId: delhiWarehouse.id, locationIdx: 12, qty: 15 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 16, qty: 22 },
    ]},
    // Mechanical Keyboard
    { productId: products[4].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 2, qty: 45 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 5, qty: 30 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 9, qty: 60 },
      { warehouseId: delhiWarehouse.id, locationIdx: 13, qty: 50 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 17, qty: 55 },
    ]},
    // A4 Paper (Ream)
    { productId: products[5].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 2, qty: 40 }, // After delivery
      { warehouseId: secondaryWarehouse.id, locationIdx: 6, qty: 80 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 10, qty: 100 },
      { warehouseId: delhiWarehouse.id, locationIdx: 14, qty: 120 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 18, qty: 90 },
    ]},
    // Ballpoint Pens (Box)
    { productId: products[6].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 2, qty: 30 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 6, qty: 45 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 10, qty: 60 },
      { warehouseId: delhiWarehouse.id, locationIdx: 14, qty: 50 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 18, qty: 55 },
    ]},
    // Stapler
    { productId: products[7].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 2, qty: 35 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 5, qty: 25 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 9, qty: 40 },
      { warehouseId: delhiWarehouse.id, locationIdx: 13, qty: 38 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 17, qty: 42 },
    ]},
    // Cotton Fabric - Khadi
    { productId: products[8].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 400 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 350 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 800 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 600 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 500 },
    ]},
    // Silk Saree Material
    { productId: products[9].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 150 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 120 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 300 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 250 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 280 },
    ]},
    // Basmati Rice - 25kg
    { productId: products[10].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 80 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 60 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 150 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 200 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 100 },
    ]},
    // Masala Tea (CTC)
    { productId: products[11].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 120 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 100 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 180 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 220 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 160 },
    ]},
    // Turmeric Powder - 1kg
    { productId: products[12].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 180 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 150 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 250 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 300 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 200 },
    ]},
    // Paracetamol Tablets (500mg)
    { productId: products[13].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 450 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 400 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 600 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 700 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 550 },
    ]},
    // Ayurvedic Cough Syrup
    { productId: products[14].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 90 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 80 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 120 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 150 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 110 },
    ]},
    // Hand Sanitizer - 500ml
    { productId: products[15].id, stocks: [
      { warehouseId: mainWarehouse.id, locationIdx: 3, qty: 280 },
      { warehouseId: secondaryWarehouse.id, locationIdx: 7, qty: 250 },
      { warehouseId: mumbaiWarehouse.id, locationIdx: 11, qty: 350 },
      { warehouseId: delhiWarehouse.id, locationIdx: 15, qty: 400 },
      { warehouseId: bangaloreWarehouse.id, locationIdx: 19, qty: 320 },
    ]},
  ];

  // Create receipt operations for each warehouse to establish initial stock
  let receiptCounter = 4;
  for (const dist of stockDistribution) {
    for (const stock of dist.stocks) {
      await prisma.operation.create({
        data: {
          type: OperationType.RECEIPT,
          reference: `WH/IN/${String(receiptCounter).padStart(4, '0')}`,
          status: OperationStatus.DONE,
          warehouseToId: stock.warehouseId,
          locationToId: locations[stock.locationIdx].id,
          contactName: 'Initial Stock - Various Suppliers',
          scheduleDate: new Date('2024-01-10'),
          createdByUserId: manager.id,
          responsibleUserId: staff.id,
          items: {
            create: [{ productId: dist.productId, quantity: stock.qty }],
          },
          stockMovements: {
            create: [{
              productId: dist.productId,
              locationToId: locations[stock.locationIdx].id,
              quantityDelta: stock.qty,
              movementType: 'RECEIPT',
            }],
          },
        },
      });
      receiptCounter++;
    }
  }

  console.log(`✅ Created diverse stock across all ${5} warehouses for ${products.length} products`);

  console.log('✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: 8 (admin01, manager01, staff01, plus 5 Indian users)`);
  console.log(`   Password for all users: password123`);
  console.log(`   Warehouses: 5 (Main, Secondary, Mumbai, Delhi, Bangalore)`);
  console.log(`   Locations: ${locations.length} across all warehouses`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Operations: ${receiptCounter - 1} (all completed with stock movements)`);
  console.log('\n💡 Stock Distribution:');
  console.log(`   Each product has different stock levels in each warehouse`);
  console.log(`   Main Warehouse: Various quantities`);
  console.log(`   Secondary Warehouse: Various quantities`);
  console.log(`   Mumbai DC: Generally higher quantities`);
  console.log(`   Delhi Central: Generally higher quantities`);
  console.log(`   Bangalore Tech Hub: Moderate quantities`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


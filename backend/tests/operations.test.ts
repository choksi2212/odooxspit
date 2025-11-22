import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';
import prisma from '../src/db/client.js';

/**
 * Operations Tests
 * Tests receipt, delivery, transfer, and adjustment operations
 */
describe('Operations', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let userId: string;
  let warehouseId: string;
  let locationId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create test user
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: {
        loginId: 'optest01',
        email: 'optest@example.com',
        password: 'password123',
        name: 'Operation Test User',
        role: 'INVENTORY_MANAGER',
      },
    });

    const signupBody = JSON.parse(signupResponse.body);
    accessToken = signupBody.accessToken;
    userId = signupBody.user.id;

    // Create test warehouse and location
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Test Warehouse',
        shortCode: 'TEST',
      },
    });
    warehouseId = warehouse.id;

    const location = await prisma.location.create({
      data: {
        warehouseId: warehouse.id,
        name: 'Test Location',
        shortCode: 'TST',
      },
    });
    locationId = location.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        sku: 'TEST-001',
        unitOfMeasure: 'Units',
        reorderLevel: 10,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.operationItem.deleteMany({});
    await prisma.operation.deleteMany({});
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.location.deleteMany({ where: { id: locationId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    
    await app.close();
  });

  it('should create a receipt operation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/operations/receipts',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        locationToId: locationId,
        contactName: 'Supplier ABC',
        items: [
          {
            productId,
            quantity: 100,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.operation).toBeDefined();
    expect(body.operation.type).toBe('RECEIPT');
    expect(body.operation.status).toBe('DRAFT');
    expect(body.operation.reference).toMatch(/WH\/IN\/\d+/);
  });

  it('should transition receipt to DONE and create stock movements', async () => {
    // Create receipt
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/operations/receipts',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        locationToId: locationId,
        items: [{ productId, quantity: 50 }],
      },
    });

    const operation = JSON.parse(createResponse.body).operation;

    // Transition to DONE
    const transitionResponse = await app.inject({
      method: 'POST',
      url: `/api/operations/${operation.id}/transition`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        action: 'mark_done',
      },
    });

    expect(transitionResponse.statusCode).toBe(200);
    const updatedOperation = JSON.parse(transitionResponse.body).operation;
    expect(updatedOperation.status).toBe('DONE');

    // Verify stock movement was created
    const movements = await prisma.stockMovement.findMany({
      where: { operationId: operation.id },
    });

    expect(movements.length).toBe(1);
    expect(movements[0].movementType).toBe('RECEIPT');
    expect(parseFloat(movements[0].quantityDelta.toString())).toBe(50);
  });

  it('should create a delivery operation', async () => {
    // First, create stock with a receipt
    await app.inject({
      method: 'POST',
      url: '/api/operations/receipts',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        locationToId: locationId,
        items: [{ productId, quantity: 100 }],
      },
    });

    // Then create delivery
    const response = await app.inject({
      method: 'POST',
      url: '/api/operations/deliveries',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        locationFromId: locationId,
        contactName: 'Customer XYZ',
        items: [{ productId, quantity: 25 }],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.operation.type).toBe('DELIVERY');
    expect(body.operation.reference).toMatch(/WH\/OUT\/\d+/);
  });

  it('should not allow invalid status transitions', async () => {
    // Create a receipt
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/operations/receipts',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        locationToId: locationId,
        items: [{ productId, quantity: 10 }],
      },
    });

    const operation = JSON.parse(createResponse.body).operation;

    // Transition to DONE
    await app.inject({
      method: 'POST',
      url: `/api/operations/${operation.id}/transition`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: { action: 'mark_done' },
    });

    // Try to cancel a DONE operation (should fail)
    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/api/operations/${operation.id}/transition`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: { action: 'cancel' },
    });

    expect(cancelResponse.statusCode).toBe(400);
  });
});


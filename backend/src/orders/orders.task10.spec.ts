import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { jest } from '@jest/globals';

describe('concurrent stock reservation', () => {
  it('rejects the competing order when only one unit remains', async () => {
    let reservations = 0;
    const tx = {
      coupon: { findUnique: jest.fn().mockResolvedValue(null) },
      product: {
        updateMany: jest.fn().mockImplementation(() => {
          reservations += 1;
          return Promise.resolve({ count: reservations === 1 ? 1 : 0 });
        }),
      },
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-1', code: 'ORD-1', userId: 'user-1', status: 'PENDING',
          totalAmount: 25000, createdAt: new Date(), updatedAt: new Date(), items: [],
        }),
      },
    };
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: 'coffee-den', name: 'Coffee', price: 25000, isAvailable: true, stock: 1 }]) },
      $transaction: jest.fn().mockImplementation((callback: (value: typeof tx) => unknown) => callback(tx)),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    const input = { items: [{ productId: 'coffee-den', size: 'M' as const, toppings: [], quantity: 1 }] };

    const results = await Promise.allSettled([service.create('user-1', input), service.create('user-2', input)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: expect.any(ConflictException) });
    expect(tx.product.updateMany).toHaveBeenCalledTimes(2);
  });
});

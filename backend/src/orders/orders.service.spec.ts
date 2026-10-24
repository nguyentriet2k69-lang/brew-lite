import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { jest } from '@jest/globals';

describe('OrdersService pricing validation', () => {
  const prismaMock = {
    product: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: OrdersService;

  const orderInput = (toppings: string[]) => ({
    items: [{ productId: 'coffee-den', size: 'M' as const, toppings, quantity: 1 }],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'coffee-den', name: 'Cà phê đen', price: 30000 },
    ]);
    service = new OrdersService(prismaMock as unknown as PrismaService);
  });

  it('rejects topping names that are not in the server allowlist', async () => {
    await expect(service.create('user-1', orderInput(['Topping lạ']))).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate toppings instead of charging them more than once', async () => {
    await expect(
      service.create('user-1', orderInput(['Trân châu', 'Trân châu'])),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

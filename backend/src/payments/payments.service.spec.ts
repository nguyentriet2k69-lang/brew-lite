import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsService } from './payments.service';
import { jest } from '@jest/globals';

const makeOrder = (status = OrderStatus.PENDING) => ({
  id: 'order-123',
  code: 'ORD-20261022-ABC123',
  status,
  totalAmount: new Prisma.Decimal('123000'),
});

describe('PaymentsService', () => {
  const prismaMock = {
    order: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const txMock = {
    order: { findFirst: jest.fn(), updateMany: jest.fn() },
    payment: { create: jest.fn() },
  };
  const gatewayMock = { execute: jest.fn() };
  let service: PaymentsService;

  const dto = (method: PaymentMethod = PaymentMethod.WALLET): CreatePaymentDto => ({
    orderId: 'order-123',
    method,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const order = makeOrder();
    prismaMock.order.findFirst.mockResolvedValue(order);
    txMock.order.findFirst.mockResolvedValue(order);
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    txMock.payment.create.mockResolvedValue({
      id: 'payment-123',
      orderId: order.id,
      amount: order.totalAmount,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.SUCCEEDED,
      createdAt: new Date('2026-10-22T12:00:00.000Z'),
    });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );
    gatewayMock.execute.mockReturnValue(PaymentStatus.SUCCEEDED);
    service = new PaymentsService(
      prismaMock as unknown as PrismaService,
      gatewayMock as unknown as MockPaymentGateway,
    );
  });

  it('succeeds with WALLET and uses the amount stored on the order', async () => {
    const result = await service.create('user-1', dto(PaymentMethod.WALLET));

    expect(prismaMock.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-123', userId: 'user-1' },
      select: { id: true, code: true, status: true, totalAmount: true },
    });
    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-123', userId: 'user-1', status: OrderStatus.PENDING },
      data: { status: OrderStatus.PAID },
    });
    expect(txMock.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-123',
        amount: makeOrder().totalAmount,
        method: PaymentMethod.WALLET,
        status: PaymentStatus.SUCCEEDED,
      },
    });
    expect(result).toMatchObject({
      orderId: 'order-123',
      orderCode: 'ORD-20261022-ABC123',
      amount: 123000,
      status: PaymentStatus.SUCCEEDED,
      orderStatus: OrderStatus.PAID,
    });
  });

  it('supports CARD as a successful payment method', async () => {
    txMock.payment.create.mockResolvedValue({
      id: 'payment-card',
      orderId: 'order-123',
      amount: makeOrder().totalAmount,
      method: PaymentMethod.CARD,
      status: PaymentStatus.SUCCEEDED,
      createdAt: new Date(),
    });

    const result = await service.create('user-1', dto(PaymentMethod.CARD));

    expect(txMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ method: PaymentMethod.CARD }),
    });
    expect(result.method).toBe(PaymentMethod.CARD);
    expect(result.orderStatus).toBe(OrderStatus.PAID);
  });

  it('moves an order to PAYMENT_FAILED on a simulated failed attempt', async () => {
    gatewayMock.execute.mockReturnValue(PaymentStatus.FAILED);
    txMock.payment.create.mockResolvedValue({
      id: 'payment-failed',
      orderId: 'order-123',
      amount: makeOrder().totalAmount,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.FAILED,
      createdAt: new Date(),
    });

    const result = await service.create('user-1', dto());

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-123', userId: 'user-1', status: OrderStatus.PENDING },
      data: { status: OrderStatus.PAYMENT_FAILED },
    });
    expect(result).toMatchObject({
      status: PaymentStatus.FAILED,
      orderStatus: OrderStatus.PAYMENT_FAILED,
    });
  });

  it('allows a retry from PAYMENT_FAILED', async () => {
    const failedOrder = makeOrder(OrderStatus.PAYMENT_FAILED);
    prismaMock.order.findFirst.mockResolvedValue(failedOrder);
    txMock.order.findFirst.mockResolvedValue(failedOrder);

    const result = await service.create('user-1', dto());

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-123', userId: 'user-1', status: OrderStatus.PAYMENT_FAILED },
      data: { status: OrderStatus.PAID },
    });
    expect(result.orderStatus).toBe(OrderStatus.PAID);
  });

  it('rejects missing orders and orders owned by another user', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);
    await expect(service.create('other-user', dto())).rejects.toThrow(NotFoundException);
  });

  it.each([OrderStatus.PAID, OrderStatus.CANCELLED])(
    'rejects an order in terminal state %s',
    async (status) => {
      prismaMock.order.findFirst.mockResolvedValue(makeOrder(status));
      await expect(service.create('user-1', dto())).rejects.toThrow(BadRequestException);
      expect(gatewayMock.execute).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    },
  );

  it('does not return success when the transaction fails', async () => {
    txMock.payment.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.create('user-1', dto())).rejects.toThrow('database unavailable');
  });

  it('rejects when the order status changes before the transaction', async () => {
    txMock.order.findFirst.mockResolvedValue(makeOrder(OrderStatus.PAID));

    await expect(service.create('user-1', dto())).rejects.toThrow(BadRequestException);
    expect(txMock.payment.create).not.toHaveBeenCalled();
  });

  it('rejects a lost conditional update instead of creating a payment', async () => {
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.create('user-1', dto())).rejects.toThrow(ConflictException);
    expect(txMock.payment.create).not.toHaveBeenCalled();
  });
});

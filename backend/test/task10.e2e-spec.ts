import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsService } from '../src/payments/payments.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Task 10 PostgreSQL integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orders: OrdersService;
  let payments: PaymentsService;
  const ids = { user: '', product: '', stockProduct: '', order: '' };
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    orders = app.get(OrdersService);
    payments = app.get(PaymentsService);

    const user = await prisma.user.create({
      data: {
        email: `task10-${Date.now()}@example.com`,
        name: 'Task 10 Integration',
        password: await bcrypt.hash('Password123!', 4),
      },
    });
    ids.user = user.id;
  });

  afterAll(async () => {
    const orderIds = (await prisma.order.findMany({ where: { userId: ids.user }, select: { id: true } })).map((order) => order.id);
    if (orderIds.length) await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { userId: ids.user } });
    for (const productId of createdProductIds) {
      await prisma.product.delete({ where: { id: productId } }).catch(() => undefined);
    }
    if (ids.user) await prisma.user.delete({ where: { id: ids.user } });
    await app.close();
  });

  it('rejects invalid state transitions against the real database', async () => {
    const product = await prisma.product.create({
      data: { name: 'Task10 state product', price: 25000, imageUrl: '/test.png', category: 'test', stock: 2 },
    });
    ids.product = product.id;
    createdProductIds.push(product.id);
    const order = await orders.create(ids.user, { items: [{ productId: product.id, size: 'M', toppings: [], quantity: 1 }] });
    await expect(orders.updateStatus(order.id, OrderStatus.COMPLETED)).rejects.toThrow();
    await expect(orders.updateStatus(order.id, OrderStatus.CANCELLED)).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
  });

  it('allows only one of two concurrent orders to reserve the last stock unit', async () => {
    const product = await prisma.product.create({
      data: { name: 'Task10 stock product', price: 25000, imageUrl: '/test.png', category: 'test', stock: 1 },
    });
    ids.stockProduct = product.id;
    createdProductIds.push(product.id);
    const input = { items: [{ productId: product.id, size: 'M' as const, toppings: [], quantity: 1 }] };
    const results = await Promise.allSettled([orders.create(ids.user, input), orders.create(ids.user, input)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(prisma.product.findUniqueOrThrow({ where: { id: product.id } })).resolves.toMatchObject({ stock: 0 });
  });

  it('returns one committed payment for concurrent requests with the same key', async () => {
    const product = await prisma.product.create({
      data: { name: 'Task10 payment product', price: 25000, imageUrl: '/test.png', category: 'test', stock: 2 },
    });
    createdProductIds.push(product.id);
    const order = await orders.create(ids.user, { items: [{ productId: product.id, size: 'M', toppings: [], quantity: 1 }] });
    ids.order = order.id;
    process.env.MOCK_PAYMENT_RESULT = 'success';
    const input = { orderId: order.id, method: PaymentMethod.WALLET, idempotencyKey: `task10-${Date.now()}` };
    const results = await Promise.all([payments.create(ids.user, input), payments.create(ids.user, input)]);
    expect(results[0]).toMatchObject({ id: results[1].id, orderStatus: OrderStatus.PAID, status: 'SUCCEEDED' });
    await expect(prisma.payment.count({ where: { orderId: order.id } })).resolves.toBe(1);
  });

  it('applies a coupon and credits loyalty points exactly once', async () => {
    const product = await prisma.product.create({
      data: { name: 'Task10 loyalty product', price: 50000, imageUrl: '/test.png', category: 'test', stock: 1 },
    });
    createdProductIds.push(product.id);
    const order = await orders.create(ids.user, { items: [{ productId: product.id, size: 'M', toppings: [], quantity: 1 }], couponCode: 'WELCOME10' });
    expect(order.totalAmount).toBe(45000);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: ids.user }, select: { loyaltyPoints: true } });
    await payments.create(ids.user, { orderId: order.id, method: PaymentMethod.WALLET, idempotencyKey: `loyalty-${Date.now()}` });
    const after = await prisma.user.findUniqueOrThrow({ where: { id: ids.user }, select: { loyaltyPoints: true } });
    expect(after.loyaltyPoints - before.loyaltyPoints).toBe(4);
  });
});


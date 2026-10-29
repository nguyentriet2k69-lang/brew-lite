import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth and order protection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let productId: string;
  let orderId: string;
  const runId = Date.now();
  const originalMockPaymentResult = process.env.MOCK_PAYMENT_RESULT;
  const email = `auth-e2e-${runId}@example.com`;
  const whitespaceNameEmail = `auth-e2e-whitespace-${runId}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const userOrders = await prisma.order.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      await prisma.payment.deleteMany({
        where: { orderId: { in: userOrders.map((order) => order.id) } },
      });
      await prisma.order.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    if (originalMockPaymentResult === undefined) delete process.env.MOCK_PAYMENT_RESULT;
    else process.env.MOCK_PAYMENT_RESULT = originalMockPaymentResult;
    if (productId) {
      await prisma.product.delete({ where: { id: productId } });
    }
    await prisma.user.deleteMany({ where: { email: whitespaceNameEmail } });
    await app.close();
  });

  it('rejects a whitespace-only display name', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: whitespaceNameEmail, password, name: '   ' })
      .expect(400);
  });

  it('registers a user, hashes the password, and returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: '  Test User  ' })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.accessToken.split('.')).toHaveLength(3);
    expect(response.body.user).toMatchObject({
      email,
      name: 'Test User',
      role: 'USER',
    });

    accessToken = response.body.accessToken as string;
    userId = response.body.user.id as string;

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(storedUser.password).not.toBe(password);
    expect(storedUser.password).toMatch(/^\$2[aby]\$/);
    expect(bcrypt.getRounds(storedUser.password)).toBe(12);
    await expect(bcrypt.compare(password, storedUser.password)).resolves.toBe(
      true,
    );
  });

  it('rejects duplicate registration and an incorrect password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'Test User' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('logs in with valid credentials and returns a usable JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: email.toUpperCase(), password })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.id).toBe(userId);
    accessToken = response.body.accessToken as string;
  });

  it('protects order and payment routes from missing and tampered tokens', async () => {
    await request(app.getHttpServer()).post('/orders').send({}).expect(401);
    await request(app.getHttpServer()).post('/payments').send({}).expect(401);

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}tampered`)
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}tampered`)
      .send({})
      .expect(401);
  });

  it('creates an order for the user identified by a valid JWT', async () => {
    const product = await prisma.product.create({
      data: {
        name: `Auth e2e product ${runId}`,
        price: 30000,
        imageUrl: 'https://example.com/auth-e2e-product.png',
        category: 'test',
        stock: 10,
      },
    });
    productId = product.id;

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          {
            productId,
            size: 'M',
            toppings: [],
            quantity: 1,
          },
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({ userId, status: 'PENDING' });
    expect(response.body.items).toHaveLength(1);
    orderId = response.body.id as string;
  });

  it('validates method and rejects a client-supplied amount', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId, method: 'WALLET', amount: 1 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId, method: 'CRYPTO' })
      .expect(400);
  });

  it('creates a wallet payment using the stored order total and marks the order PAID', async () => {
    process.env.MOCK_PAYMENT_RESULT = 'success';
    const orderBeforePayment = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId, method: 'WALLET' })
      .expect(201);

    expect(response.body).toMatchObject({
      orderId,
      orderCode: orderBeforePayment.code,
      amount: Number(orderBeforePayment.totalAmount),
      method: 'WALLET',
      status: 'SUCCEEDED',
      orderStatus: 'PAID',
    });
    const orderAfterPayment = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    expect(orderAfterPayment.status).toBe('PAID');

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId } });
    expect(Number(payment.amount)).toBe(Number(orderBeforePayment.totalAmount));
  });

  it('rejects a new payment attempt for an already paid order', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId, method: 'CARD' })
      .expect(400);
  });

  it('records a failed CARD attempt and permits retry on the same order', async () => {
    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId, size: 'M', toppings: [], quantity: 1 }] })
      .expect(201);
    const retryOrderId = orderResponse.body.id as string;

    process.env.MOCK_PAYMENT_RESULT = 'failure';
    const failedResponse = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId: retryOrderId, method: 'CARD' })
      .expect(201);

    expect(failedResponse.body).toMatchObject({
      orderId: retryOrderId,
      method: 'CARD',
      status: 'FAILED',
      orderStatus: 'PAYMENT_FAILED',
    });
    const failedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: retryOrderId },
    });
    expect(failedOrder.status).toBe('PAYMENT_FAILED');

    process.env.MOCK_PAYMENT_RESULT = 'success';
    const retriedResponse = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId: retryOrderId, method: 'CARD' })
      .expect(201);
    expect(retriedResponse.body).toMatchObject({
      orderId: retryOrderId,
      method: 'CARD',
      status: 'SUCCEEDED',
      orderStatus: 'PAID',
    });
  });
});

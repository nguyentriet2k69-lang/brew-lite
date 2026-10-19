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
  const runId = Date.now();
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
      await prisma.order.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
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

  it('protects order creation from missing and tampered tokens', async () => {
    await request(app.getHttpServer()).post('/orders').send({}).expect(401);

    await request(app.getHttpServer())
      .post('/orders')
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
  });
});

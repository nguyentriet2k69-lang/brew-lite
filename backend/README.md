# BrewLite backend

NestJS API with Prisma and PostgreSQL. For the complete setup and end-to-end workflow, see the [project README](../README.md).

## Local development

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
npm --prefix backend install
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm --prefix backend run start:dev
```

If `backend/.env` already exists, preserve its secrets and set `DATABASE_URL=postgresql://brewlite:brewlite@127.0.0.1:5433/brewlite?schema=public`. Compose publishes its PostgreSQL at port 5433 to avoid collisions with a host PostgreSQL installation. The API listens on port 3000 by default. `GET /health` checks both the API and its database connection. Set `JWT_SECRET` to a private random value of at least 32 characters and configure `ADMIN_EMAIL`/`ADMIN_PASSWORD` before seeding.

## Checks

```powershell
npm --prefix backend run build
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e -- --runInBand
```

The integration tests use the PostgreSQL database configured by `DATABASE_URL`; apply migrations before running them. Do not point them at a database containing data you need to preserve, since test cases create and remove their own fixtures.

## Core API

- `GET /products`, `GET /products/:id`
- `POST /auth/register`, `POST /auth/login`
- `POST /orders`, `GET /orders/me`
- `POST /payments` with `Idempotency-Key`

Order creation recalculates prices server-side and reserves stock transactionally. Payment is simulated locally using `MOCK_PAYMENT_RESULT=success|failure`.

# BrewLite – Task 10 traceability matrix

| Requirement / use case | Backend implementation | Verification |
|---|---|---|
| Register/login/me with JWT | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | `test/auth.e2e-spec.ts` |
| Browse menu and options | `GET /products`, `GET /products/:id`, `GET /products/:id/options` | Products module |
| Create order from cart | `POST /orders`, server-side pricing and availability validation in a Prisma transaction | `src/orders/*.spec.ts` |
| Order history/detail | `GET /orders`, `GET /orders/me`, `GET /orders/:id` | Orders controller |
| Staff/admin status tracking | `PATCH /orders/:id/status` with `STAFF`/`ADMIN` roles | UpdateOrderStatusDto |
| Simulated payment | `POST /payments`, `GET /payments/:id`, `WALLET`/`CARD`, mock success/failure | `src/payments/*.spec.ts` |
| Payment idempotency | `idempotencyKey` body or `Idempotency-Key` header, unique database constraint | Payment schema |
| Order state machine | `assertTransition`, `PENDING → PAID → PREPARING → READY → COMPLETED`, failure/cancel branches | `src/orders/state-machine.spec.ts` |
| Concurrent stock reservation | Transactional conditional stock decrement with `stock` and `version` | `src/orders/orders.task10.spec.ts` |
| Promotion and loyalty | `Coupon`, `WELCOME10`, discount calculation, points credited after successful payment | Orders/payment services |
| Service health | `GET /health` with database probe | Health module |
| Consistent validation errors | Global `ValidationPipe` and `HttpExceptionFilter` | `src/main.ts` |

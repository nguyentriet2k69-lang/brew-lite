import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { assertTransition } from './state-machine';

describe('order state machine', () => {
  it('allows the happy path', () => {
    expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toThrow(BadRequestException);
    expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PAID)).toThrow(BadRequestException);
    expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING)).toThrow(BadRequestException);
  });
});

import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (from === to) return;
  if (!transitions[from]?.includes(to)) {
    throw new BadRequestException(`Không thể chuyển trạng thái từ ${from} sang ${to}`);
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentGateway } from './mock-payment.gateway';
import { assertTransition } from '../orders/state-machine';

type PayableOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  totalAmount: Prisma.Decimal;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockPaymentGateway: MockPaymentGateway,
  ) {}

  async create(userId: string, dto: CreatePaymentDto) {
    if (dto.idempotencyKey) {
      const previous = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey }, include: { order: true },
      });
      if (previous) {
        if (previous.order.userId !== userId || previous.method !== dto.method) {
          throw new ConflictException('Idempotency key đã được dùng cho giao dịch khác');
        }
        return this.serialize(previous, previous.order.status);
      }
    }
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      select: { id: true, code: true, status: true, totalAmount: true },
    });
    this.assertPayableOrder(order);

    // The mock gateway has no external side effects. Its deterministic result
    // is selected by backend configuration rather than by the client.
    const paymentStatus = this.mockPaymentGateway.execute();
    const nextOrderStatus =
      paymentStatus === PaymentStatus.SUCCEEDED
        ? OrderStatus.PAID
        : OrderStatus.PAYMENT_FAILED;

    return this.prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findFirst({
        where: { id: dto.orderId, userId },
        select: { id: true, code: true, status: true, totalAmount: true },
      });
      if (
        dto.idempotencyKey &&
        currentOrder &&
        currentOrder.status !== OrderStatus.PENDING &&
        currentOrder.status !== OrderStatus.PAYMENT_FAILED
      ) {
        const previous = await this.prisma.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { order: true },
        });
        if (previous) {
          if (previous.order.userId !== userId || previous.method !== dto.method) {
            throw new ConflictException('Idempotency key đã được dùng cho giao dịch khác');
          }
          return this.serialize(previous, previous.order.status);
        }
      }
      this.assertPayableOrder(currentOrder);

      // Reject a state change between the pre-check and transaction. Full
      // idempotency/concurrency handling remains in Task 10.
      if (currentOrder.status !== order.status) {
        throw new ConflictException(
          'Trạng thái đơn hàng đã thay đổi; vui lòng tải lại đơn hàng',
        );
      }

      const updated = await tx.order.updateMany({
        where: {
          id: currentOrder.id,
          userId,
          status: currentOrder.status,
        },
        data: { status: nextOrderStatus },
      });
      if (updated.count !== 1) {
        // A concurrent request with the same idempotency key may have
        // completed the payment while this transaction was waiting on the
        // order row. Return that committed result instead of turning a safe
        // retry into a 409 response.
        if (dto.idempotencyKey) {
          const previous = await this.prisma.payment.findUnique({
            where: { idempotencyKey: dto.idempotencyKey },
            include: { order: true },
          });
          if (previous) {
            if (previous.order.userId !== userId || previous.method !== dto.method) {
              throw new ConflictException('Idempotency key đã được dùng cho giao dịch khác');
            }
            return this.serialize(previous, previous.order.status);
          }
        }
        throw new ConflictException(
          'Đơn hàng đã được xử lý bởi một yêu cầu khác; vui lòng tải lại đơn hàng',
        );
      }

      assertTransition(currentOrder.status, nextOrderStatus);

      const payment = await tx.payment.create({
        data: {
          orderId: currentOrder.id,
          amount: currentOrder.totalAmount,
          method: dto.method,
          status: paymentStatus,
          idempotencyKey: dto.idempotencyKey,
        },
      });
      if (paymentStatus === PaymentStatus.SUCCEEDED) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: Math.floor(Number(currentOrder.totalAmount) / 10000) } },
        });
      }
      return this.serialize(payment, nextOrderStatus, currentOrder.code, currentOrder.totalAmount);
    }).catch(async (error: unknown) => {
      if (dto.idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const previous = await this.prisma.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey }, include: { order: true },
        });
        if (previous && previous.order.userId === userId && previous.method === dto.method) {
          return this.serialize(previous, previous.order.status);
        }
        throw new ConflictException('Idempotency key đã được dùng cho giao dịch khác');
      }
      throw error;
    });
  }

  async findOne(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, order: { userId } }, include: { order: true },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch');
    return this.serialize(payment, payment.order.status);
  }

  private serialize(payment: any, orderStatus: OrderStatus, orderCode?: string, orderAmount?: Prisma.Decimal) {
    return {
      id: payment.id, orderId: payment.orderId, orderCode: orderCode ?? payment.order?.code,
      amount: Number(orderAmount ?? payment.amount), method: payment.method, status: payment.status,
      orderStatus, provider: payment.provider ?? 'mock', transactionId: payment.transactionId ?? null,
      createdAt: payment.createdAt,
    };
  }

  private assertPayableOrder(
    order: PayableOrder | null,
  ): asserts order is PayableOrder {
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng đã được thanh toán');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Không thể thanh toán đơn hàng đã bị hủy');
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAYMENT_FAILED
    ) {
      throw new BadRequestException(
        'Trạng thái đơn hàng không cho phép thanh toán',
      );
    }
  }
}

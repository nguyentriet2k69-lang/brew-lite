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
        throw new ConflictException(
          'Đơn hàng đã được xử lý bởi một yêu cầu khác; vui lòng tải lại đơn hàng',
        );
      }

      const payment = await tx.payment.create({
        data: {
          orderId: currentOrder.id,
          amount: currentOrder.totalAmount,
          method: dto.method,
          status: paymentStatus,
        },
      });

      return {
        id: payment.id,
        orderId: currentOrder.id,
        orderCode: currentOrder.code,
        amount: Number(currentOrder.totalAmount),
        method: payment.method,
        status: payment.status,
        orderStatus: nextOrderStatus,
        createdAt: payment.createdAt,
      };
    });
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

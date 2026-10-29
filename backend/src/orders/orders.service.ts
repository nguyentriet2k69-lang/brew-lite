import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calcUnitPrice, isToppingName, type ToppingName } from './pricing';
import { assertTransition } from './state-machine';

function generateOrderCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Lấy tất cả sản phẩm trong đơn
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { options: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Không tìm thấy sản phẩm: ${missing.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Tính giá từng item + tổng
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.isAvailable === false) {
        throw new BadRequestException(`Sản phẩm tạm hết: ${product.name}`);
      }
      const duplicateToppings =
        new Set(item.toppings).size !== item.toppings.length;
      if (duplicateToppings) {
        throw new BadRequestException('Không được chọn topping trùng lặp');
      }

      const toppings: ToppingName[] = item.toppings.map((topping) => {
        if (!isToppingName(topping)) {
          throw new BadRequestException(`Topping không hợp lệ: ${topping}`);
        }
        return topping;
      });
      const unitPrice = calcUnitPrice(
        Number(product.price),
        item.size,
        toppings,
        (product.options ?? []).map((option) => ({
          type: option.type,
          name: option.name,
          price: Number(option.price),
          isActive: option.isActive,
        })),
      );
      const subtotal = unitPrice * item.quantity;

      return {
        productId: product.id,
        name: product.name,
        size: item.size,
        toppings,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        subtotal: new Prisma.Decimal(subtotal),
      };
    });

    const subtotalAmount = itemsData.reduce(
      (sum, i) => sum + Number(i.subtotal),
      0,
    );

    if (subtotalAmount <= 0) {
      throw new BadRequestException('Tổng tiền đơn hàng không hợp lệ');
    }
    const couponCode = dto.couponCode?.trim().toUpperCase();

    // 3. Tạo order + items trong transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const coupon = couponCode
        ? await tx.coupon.findUnique({ where: { code: couponCode } })
        : null;
      if (couponCode && (!coupon || !coupon.isActive)) {
        throw new BadRequestException('Mã giảm giá không hợp lệ');
      }
      const discountAmount = coupon
        ? Math.floor((subtotalAmount * coupon.discountPercent) / 100)
        : 0;
      const totalAmount = subtotalAmount - discountAmount;

      const requiredStock = new Map<string, number>();
      for (const item of dto.items) {
        requiredStock.set(item.productId, (requiredStock.get(item.productId) ?? 0) + item.quantity);
      }
      for (const [productId, quantity] of requiredStock) {
        const updated = await tx.product.updateMany({
          where: { id: productId, isAvailable: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity }, version: { increment: 1 } },
        });
        if (updated.count !== 1) {
          throw new ConflictException('Sản phẩm không đủ tồn kho');
        }
      }

      return tx.order.create({
        data: {
          code: generateOrderCode(),
          userId,
          status: 'PENDING',
          totalAmount: new Prisma.Decimal(totalAmount),
          discountAmount: new Prisma.Decimal(discountAmount),
          couponCode,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return this.serialize(order);
  }

  async findMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return orders.map((o) => this.serialize(o));
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return this.serialize(order);
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!current) throw new NotFoundException('Không tìm thấy đơn hàng');
        assertTransition(current.status, status);
        if (status === OrderStatus.CANCELLED) {
          const quantities = new Map<string, number>();
          for (const item of current.items) {
            quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
          }
          for (const [productId, quantity] of quantities) {
            await tx.product.update({
              where: { id: productId },
              data: { stock: { increment: quantity }, version: { increment: 1 } },
            });
          }
        }
        return tx.order.update({ where: { id: orderId }, data: { status }, include: { items: true } });
      });
      return this.serialize(order);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      throw error;
    }
  }

  private serialize(order: {
    id: string;
    code: string;
    userId: string;
    status: string;
    totalAmount: Prisma.Decimal;
    discountAmount?: Prisma.Decimal;
    couponCode?: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      name: string;
      size: string;
      toppings: string[];
      quantity: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>;
  }) {
    return {
      id: order.id,
      code: order.code,
      userId: order.userId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount ?? 0),
      couponCode: order.couponCode ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        size: i.size,
        toppings: i.toppings,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    };
  }
}

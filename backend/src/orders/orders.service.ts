import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calcUnitPrice, type Size } from './pricing';

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
      const basePrice = Number(product.price);
      const unitPrice = calcUnitPrice(
        basePrice,
        item.size as Size,
        item.toppings.length,
      );
      const subtotal = unitPrice * item.quantity;

      return {
        productId: product.id,
        name: product.name,
        size: item.size,
        toppings: item.toppings,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        subtotal: new Prisma.Decimal(subtotal),
      };
    });

    const totalAmount = itemsData.reduce(
      (sum, i) => sum + Number(i.subtotal),
      0,
    );

    if (totalAmount <= 0) {
      throw new BadRequestException('Tổng tiền đơn hàng không hợp lệ');
    }

    // 3. Tạo order + items trong transaction
    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          code: generateOrderCode(),
          userId,
          status: 'PENDING',
          totalAmount: new Prisma.Decimal(totalAmount),
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

  private serialize(order: {
    id: string;
    code: string;
    userId: string;
    status: string;
    totalAmount: Prisma.Decimal;
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
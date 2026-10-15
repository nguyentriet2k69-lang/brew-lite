import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

interface ProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  imageUrl: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products: ProductRecord[] = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((product: ProductRecord) => this.toResponse(product));
  }

  async findOne(id: string) {
    const product: ProductRecord | null = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponse(product);
  }

  async create(dto: CreateProductDto) {
    const product: ProductRecord = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        price: dto.price,
        imageUrl: dto.imageUrl.trim(),
        category: dto.category.trim(),
      },
    });
    return this.toResponse(product);
  }

  private toResponse(product: ProductRecord) {
    return { ...product, price: Number(product.price) };
  }
}
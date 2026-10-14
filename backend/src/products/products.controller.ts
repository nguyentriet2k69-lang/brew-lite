import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service'; // Đường dẫn trỏ tới service của bạn

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // API lấy toàn bộ danh sách sản phẩm: GET /products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // API lấy chi tiết 1 sản phẩm theo ID: GET /products/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    const product = this.productsService.findOne(Number(id));
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID là ${id}`);
    }
    return product;
  }
}
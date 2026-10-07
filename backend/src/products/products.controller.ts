import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Lấy toàn bộ danh sách đồ uống: GET /products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Lấy chi tiết 1 đồ uống theo ID: GET /products/1
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }
}
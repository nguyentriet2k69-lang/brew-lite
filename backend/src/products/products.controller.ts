import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { USER_ROLES } from '../auth/user-role';
import { ProductsService } from './products.service'; // Đường dẫn trỏ tới service của bạn
import { CreateProductDto } from './dto/create-product.dto';

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
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
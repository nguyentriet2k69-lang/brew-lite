import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';


@Injectable()
export class ProductsService {
  // Dữ liệu mẫu đồ uống (hard-code)
  private products: Product[] = [
    {
      id: 1,
      name: 'Cà phê đen',
      price: 25000,
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      name: 'Trà đào cam sả',
      price: 35000,
      imageUrl: 'https://via.placeholder.com/150',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
  return this.products.find((product) => product.id === id);
  }
}
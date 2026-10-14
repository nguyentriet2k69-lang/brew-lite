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
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=900&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Trà đào cam sả',
      price: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&auto=format&fit=crop&q=80',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
  return this.products.find((product) => product.id === id);
  }
}
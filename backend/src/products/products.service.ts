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
      imageUrl: '/images/ca_phe_den.png',
    },
    {
      id: 2,
      name: 'Bac xỉu',
      price: 29000,
      imageUrl: '/images/bac_xiu.png',
    },
    {
      id: 3,
      name: 'Trà đào cam sả',
      price: 35000,
      imageUrl: '/images/tra_dao_cam_sa.png',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
  return this.products.find((product) => product.id === id);
  }
}
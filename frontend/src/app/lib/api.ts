import { Product } from '../types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Lấy chi tiết sản phẩm theo ID
 * Gọi API backend NestJS: GET /products/:id
 */
export async function getProductById(id: string | number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Không tìm thấy sản phẩm');
  }

  return res.json();
}

/**
 * Dữ liệu mẫu dùng khi backend chưa sẵn sàng (dev / demo)
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600',
    description: 'Cà phê sữa đá truyền thống, đậm đà.',
    stock: 50,
  },
  {
    id: 2,
    name: 'Americano',
    price: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    description: 'Espresso pha loãng với nước nóng.',
    stock: 40,
  },
  {
    id: 3,
    name: 'Cappuccino',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
    description: 'Espresso, sữa nóng và foam mịn.',
    stock: 35,
  },
  {
    id: 4,
    name: 'Trà đào',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
    description: 'Trà đen kết hợp đào tươi mát lạnh.',
    stock: 45,
  },
];

export function getMockProductById(id: string | number): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === Number(id));
}

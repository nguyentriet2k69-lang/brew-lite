export interface Product {
  id: string | number;
  name: string;
  price: number; // giá gốc (size M)
  imageUrl: string;
  description?: string;
  stock?: number;
}

export type Size = 'S' | 'M' | 'L';

export interface Topping {
  id: string | number;
  name: string;
  price: number;
}

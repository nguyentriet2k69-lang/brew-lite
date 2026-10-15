export interface Product {
  id: string | number;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  stock?: number;
}

export type Size = 'S' | 'M' | 'L';

export interface Topping {
  id: string | number;
  name: string;
  price: number;
}

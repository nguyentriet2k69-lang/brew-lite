import Link from 'next/link';
import type { Product } from '@/app/types/product';
import ProductImage from './ProductImage';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <Link href={`/products/${product.id}`} className="group">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="mb-3 h-40 w-full rounded-md object-cover transition group-hover:opacity-90"
        />
        <h3 className="text-lg font-bold text-gray-800 transition group-hover:text-emerald-700">
          {product.name}
        </h3>
        <p className="mt-1 font-semibold text-emerald-700">
          {product.price.toLocaleString('vi-VN')} đ
        </p>
      </Link>
      <Link
        href={`/products/${product.id}`}
        className="mt-4 rounded-md bg-emerald-700 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Chọn
      </Link>
    </article>
  );
}

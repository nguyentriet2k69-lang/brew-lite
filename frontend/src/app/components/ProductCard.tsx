import Link from 'next/link'; // 1. Import Link từ next/link
import { Product } from '@/app/types/product';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="relative bg-white rounded-lg shadow p-4 flex flex-col justify-between border border-gray-100 overflow-hidden">
      <Link href={`/${product.id}`} className="group cursor-pointer">
        <div>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-40 object-cover rounded-md mb-3 group-hover:opacity-90 transition"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400 text-sm">
              Không có ảnh
            </div>
          )}
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-emerald-600 transition">
            {product.name}
          </h3>
          <p className="text-emerald-600 font-semibold mt-1">
            {product.price.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </Link>

      <Link
        href={`/${product.id}`}
        className="mt-4 bg-emerald-600 text-white py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition text-center"
      >
        Chọn
      </Link>
    </div>
  );
}
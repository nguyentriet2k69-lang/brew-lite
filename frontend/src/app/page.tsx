'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/app/types/product';
import { ProductCard } from '@/app/components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Gọi API lấy danh sách sản phẩm từ backend
    fetch('http://localhost:3000/products')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Không thể tải danh sách sản phẩm');
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-6 border-b">
        <h1 className="text-2xl font-bold text-emerald-700">BrewLite</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium">
          Xem giỏ hàng
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách đồ uống</h2>

        {/* 1. Trạng thái Đang tải dữ liệu */}
        {loading && (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        )}

        {/* 2. Trạng thái Bị lỗi */}
        {error && (
          <div className="text-center py-10 text-red-500">
            Lỗi: {error}. Vui lòng kiểm tra xem Backend NestJS đã bật chưa!
          </div>
        )}

        {/* 3. Trạng thái Chưa có sản phẩm */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-10 text-gray-500">Hiện chưa có sản phẩm nào.</div>
        )}

        {/* 4. Hiển thị Lưới sản phẩm (2 cột) */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
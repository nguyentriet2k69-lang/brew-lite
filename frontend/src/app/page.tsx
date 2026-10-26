'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/app/components/ProductCard';
import { getProducts } from '@/app/lib/api';
import { Product } from '@/app/types/product';
import { useCartStore } from '@/app/store/useCartStore';
import { useAuthStore } from '@/app/store/useAuthStore';

const subscribeToCart = (onStoreChange: () => void) => useCartStore.subscribe(onStoreChange);
const getCartQuantity = () =>
  useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0);
const getServerCartQuantity = () => 0;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const cartQuantity = useSyncExternalStore(
    subscribeToCart,
    getCartQuantity,
    getServerCartQuantity,
  );

  useEffect(() => {
    const controller = new AbortController();

    getProducts(controller.signal)
      .then(setProducts)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải sản phẩm');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
            <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-6 border-b">
        <h1 className="text-2xl font-bold text-emerald-700">BrewLite</h1>
        
        {/* GOM GIỎ HÀNG VÀ THÔNG TIN USER VỀ BÊN PHẢI */}
        <div className="flex items-center gap-4">
          
          {/* CHỈ HIỆN NÚT GIỎ HÀNG KHI ĐÃ ĐĂNG NHẬP (user khác null) */}
          {user && (
            <>
              <Link
                href="/orders"
                className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition"
              >
                Lịch sử đơn
              </Link>
              <Link
                href="/cart"
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
              >
                Giỏ hàng
                {cartQuantity > 0 && (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {cartQuantity}
                  </span>
                )}
              </Link>
            </>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Xin chào, {user.name}</span>
                <button
                  type="button"
                  onClick={clearSession}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-emerald-700">
                  Đăng nhập
                </Link>
                <Link href="/register" className="text-sm font-medium text-emerald-700 hover:underline">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách đồ uống</h2>

        {loading ? (
          <p className="text-center py-10 text-gray-500">Đang tải sản phẩm...</p>
        ) : error ? (
          <p className="py-10 text-center text-red-600" role="alert">
            {error}. Hãy kiểm tra API và kết nối database.
          </p>
        ) : products.length === 0 ? (
          <p className="text-center py-10 text-gray-500">Hiện chưa có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

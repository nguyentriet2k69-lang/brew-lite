'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/app/components/ProductCard';
import { getProducts, MOCK_PRODUCTS } from '@/app/lib/api';
import { Product } from '@/app/types/product';
import { useCartStore } from '@/app/store/useCartStore';

const subscribeToCart = (onStoreChange: () => void) => useCartStore.subscribe(onStoreChange);
const getCartQuantity = () =>
  useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0);
const getServerCartQuantity = () => 0;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const cartQuantity = useSyncExternalStore(
    subscribeToCart,
    getCartQuantity,
    getServerCartQuantity,
  );

  useEffect(() => {
    const controller = new AbortController();

    getProducts(controller.signal)
      .then(setProducts)
      .catch(() => {
        if (controller.signal.aborted) return;
        setProducts(MOCK_PRODUCTS);
        setUsingMockData(true);
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
        <Link
          href="/cart"
          className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
        >
          Xem giỏ hàng
          {cartQuantity > 0 && (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {cartQuantity}
            </span>
          )}
        </Link>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách đồ uống</h2>

        {usingMockData && (
          <p className="mb-4 text-sm text-amber-700" role="status">
            Backend chưa kết nối; đang hiển thị sản phẩm mẫu.
          </p>
        )}

        {loading ? (
          <p className="text-center py-10 text-gray-500">Đang tải sản phẩm...</p>
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

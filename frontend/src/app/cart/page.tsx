'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createOrder } from '@/app/lib/api';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useCartStore } from '@/app/store/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [loaded, setLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckingOut(true);

    try {
      await useAuthStore.persist.rehydrate();
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        router.push('/login?returnTo=%2Fcart');
        return;
      }

      // KIỂM TRA XEM CÓ ĐƠN HÀNG ĐANG DỞ NÀO KHÔNG
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      if (pendingOrderId) {
        // Nếu có, chuyển thẳng đến trang thanh toán của đơn đó, KHÔNG tạo đơn mới
        router.push(`/checkout/${encodeURIComponent(pendingOrderId)}`);
        return;
      }

      const order = await createOrder(
        {
          items: items.map((item) => ({
            productId: String(item.id),
            size: item.size,
            toppings: item.toppings.map((topping) => topping.name),
            quantity: item.quantity,
          })),
        },
        accessToken,
      );

      // LƯU LẠI MÃ ĐƠN VÀO BỘ NHỚ TRÌNH DUYỆT
      localStorage.setItem('pendingOrderId', order.id);
      
      router.push(`/checkout/${encodeURIComponent(order.id)}`);
    } catch (requestError) {
      setCheckoutError(
        requestError instanceof Error ? requestError.message : 'Không thể tạo đơn hàng. Vui lòng thử lại.',
      );
    } finally {
      setCheckingOut(false);
    }
  };

  if (!loaded) {
    return <main className="p-6 text-center text-gray-500">Đang tải giỏ hàng...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <h1 className="text-2xl font-bold text-gray-800">Giỏ hàng đang trống</h1>
        <Link href="/" className="rounded-md bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800">
          Quay lại chọn món
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-emerald-800">Giỏ hàng · {totalQuantity} món</h1>
          <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
            Chọn thêm món
          </Link>
        </header>

        <div className="divide-y divide-gray-200 rounded-lg bg-white px-5 shadow-sm">
          {items.map((item) => (
            <article key={item.cartId} className="flex items-center justify-between gap-4 py-5">
              <div>
                <h2 className="font-semibold text-gray-900">{item.name}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Size {item.size}
                  {item.toppings.length > 0 && ` · ${item.toppings.map((topping) => topping.name).join(', ')}`}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {item.unitPrice.toLocaleString('vi-VN')} đ / món
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  aria-label={`Giảm số lượng ${item.name}`}
                  onClick={() => decreaseQuantity(item.cartId)}
                  disabled={checkingOut}
                  className="h-8 w-8 rounded border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-5 text-center">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Tăng số lượng ${item.name}`}
                  onClick={() => increaseQuantity(item.cartId)}
                  disabled={checkingOut}
                  className="h-8 w-8 rounded border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.cartId)}
                  disabled={checkingOut}
                  className="ml-2 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5">
          <div>
            <p className="text-gray-600">Tổng cộng</p>
            <strong className="text-xl text-emerald-800">{totalPrice.toLocaleString('vi-VN')} đ</strong>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={checkingOut}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Xóa tất cả
          </button>
        </footer>

        {checkoutError && <p className="mt-4 text-sm text-red-600" role="alert">{checkoutError}</p>}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingOut || items.length === 0}
          className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
        >
          {checkingOut ? 'Đang tạo đơn hàng...' : `Tiến hành thanh toán · ${totalPrice.toLocaleString('vi-VN')} đ`}
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Số tiền cuối cùng được xác nhận từ đơn hàng do máy chủ tạo.
        </p>
      </section>
    </main>
  );
}

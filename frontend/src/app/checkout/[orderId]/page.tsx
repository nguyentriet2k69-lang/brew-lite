'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createOrder,
  createPayment,
  getOrderById,
  type OrderResponse,
  type PaymentMethod,
} from '@/app/lib/api';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useCartStore } from '@/app/store/useCartStore';

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const cartItems = useCartStore((state) => state.items);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => {
        if (cancelled) return null;

        setLoadingOrder(true);
        setError(null);
        setNotice(null);
        setOrder(null);

        const accessToken = useAuthStore.getState().accessToken;
        const user = useAuthStore.getState().user;
        const pendingOrderKey = user ? `pendingOrderId:${user.id}` : null;

        if (!accessToken) {
          router.replace(
            `/login?returnTo=${encodeURIComponent(`/checkout/${orderId}`)}`,
          );
          return null;
        }

        return getOrderById(orderId, accessToken);
      })
      .then((foundOrder) => {
        if (cancelled || !foundOrder) return;

        setOrder(foundOrder);
        const user = useAuthStore.getState().user;
        const pendingOrderKey = user ? `pendingOrderId:${user.id}` : null;

        if (foundOrder.status === 'PAID') {
          if (pendingOrderKey && localStorage.getItem(pendingOrderKey) === foundOrder.id) {
            localStorage.removeItem(pendingOrderKey);
          }
          setNotice(
            'Đơn hàng này đã được thanh toán. Không thể tạo thêm lần thanh toán mới.',
          );
        } else if (foundOrder.status === 'CANCELLED') {
          setError('Đơn hàng đã bị hủy nên không thể thanh toán.');
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          const message = requestError instanceof Error ? requestError.message : '';
          const user = useAuthStore.getState().user;
          const pendingOrderKey = user ? `pendingOrderId:${user.id}` : null;
          if (message === 'Không tìm thấy đơn hàng') {
            if (pendingOrderKey && localStorage.getItem(pendingOrderKey) === orderId) {
              localStorage.removeItem(pendingOrderKey);
            }
            const accessToken = useAuthStore.getState().accessToken;
            if (accessToken && user && cartItems.length > 0) {
              void createOrder(
                {
                  items: cartItems.map((item) => ({
                    productId: String(item.id),
                    size: item.size,
                    toppings: item.toppings.map((topping) => topping.name),
                    quantity: item.quantity,
                  })),
                },
                accessToken,
              ).then((replacementOrder) => {
                if (cancelled) return;
                localStorage.setItem(`pendingOrderId:${user.id}`, replacementOrder.id);
                router.replace(`/checkout/${encodeURIComponent(replacementOrder.id)}`);
              }).catch((createError: unknown) => {
                if (!cancelled) {
                  setError(createError instanceof Error ? createError.message : 'Không thể tạo lại đơn hàng. Vui lòng quay lại giỏ hàng.');
                  setLoadingOrder(false);
                }
              });
              return;
            }
            setError('Đơn hàng này không còn tồn tại. Hãy quay lại giỏ hàng để tạo đơn mới.');
            setLoadingOrder(false);
            return;
          }
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Không thể tải đơn hàng.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cartItems, orderId, router]);

  const handlePayment = async () => {
    if (!order || submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await useAuthStore.persist.rehydrate();
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        router.replace(`/login?returnTo=${encodeURIComponent(`/checkout/${orderId}`)}`);
        return;
      }

      const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${order.id}-${Date.now()}`;
      const payment = await createPayment({ orderId: order.id, method, idempotencyKey }, accessToken);
      const responseMatchesOrder =
        payment.orderId === order.id &&
        payment.orderCode === order.code &&
        payment.amount === order.totalAmount &&
        payment.method === method;

      if (
        responseMatchesOrder &&
        payment.status === 'SUCCEEDED' &&
        payment.orderStatus === 'PAID'
      ) {
        const user = useAuthStore.getState().user;
        if (user) {
          const pendingOrderKey = `pendingOrderId:${user.id}`;
          if (localStorage.getItem(pendingOrderKey) === order.id) {
            localStorage.removeItem(pendingOrderKey);
          }
        }
        clearCart();
        router.replace(`/confirmation/${encodeURIComponent(order.id)}`);
        return;
      }

      if (
        responseMatchesOrder &&
        payment.status === 'FAILED' &&
        payment.orderStatus === 'PAYMENT_FAILED'
      ) {
        setOrder((current) => current ? { ...current, status: 'PAYMENT_FAILED' } : current);
        setError('Thanh toán thất bại. Giỏ hàng vẫn được giữ nguyên; bạn có thể thử lại đơn hàng này.');
        return;
      }

      setError('Không thể xác minh kết quả thanh toán. Giỏ hàng được giữ nguyên; hãy tải lại đơn hàng trước khi thử lại.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? `${requestError.message}. Giỏ hàng vẫn được giữ nguyên.`
          : 'Không thể kết nối dịch vụ thanh toán. Giỏ hàng vẫn được giữ nguyên.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canPay = order?.status === 'PENDING' || order?.status === 'PAYMENT_FAILED';

  if (loadingOrder) {
    return <main className="mx-auto max-w-2xl p-6 text-center text-gray-500">Đang tải thông tin đơn hàng...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/cart" className="text-sm font-medium text-emerald-700 hover:underline">← Quay lại giỏ hàng</Link>
        <h1 className="mt-5 text-2xl font-bold text-gray-900">Thanh toán đơn hàng</h1>

        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        {notice && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800" role="status">{notice}</p>}

        {order && (
          <>
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-gray-600">Mã đơn hàng</span>
                <strong className="text-gray-900">{order.code}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-600">Trạng thái</span>
                <strong className="text-gray-900">{order.status}</strong>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-200 pt-4">
                <span className="text-gray-600">Tổng tiền từ máy chủ</span>
                <strong className="text-xl text-emerald-800">{formatMoney(order.totalAmount)}</strong>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-gray-900">Chọn phương thức thanh toán</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={method === 'WALLET'}
                  disabled={submitting}
                  onClick={() => setMethod('WALLET')}
                  className={`rounded-lg border p-4 text-left transition ${method === 'WALLET' ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-gray-200 hover:border-emerald-500'}`}
                >
                  <span className="block font-semibold text-gray-900">Ví điện tử</span>
                  <span className="mt-1 block text-sm text-gray-600">Mock payment · WALLET</span>
                </button>
                <button
                  type="button"
                  aria-pressed={method === 'CARD'}
                  disabled={submitting}
                  onClick={() => setMethod('CARD')}
                  className={`rounded-lg border p-4 text-left transition ${method === 'CARD' ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-gray-200 hover:border-emerald-500'}`}
                >
                  <span className="block font-semibold text-gray-900">Thẻ ngân hàng</span>
                  <span className="mt-1 block text-sm text-gray-600">Mock payment · CARD</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">Đây là giao dịch mô phỏng. Không nhập hoặc gửi thông tin thẻ thật.</p>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={!canPay || submitting}
              className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang xử lý thanh toán...' : `Xác nhận thanh toán · ${formatMoney(order.totalAmount)}`}
            </button>
            {order.status === 'PAID' && (
              <Link href={`/confirmation/${encodeURIComponent(order.id)}`} className="mt-4 block text-center font-medium text-emerald-700 hover:underline">
                Xem xác nhận đơn hàng
              </Link>
            )}
          </>
        )}
      </section>
    </main>
  );
}

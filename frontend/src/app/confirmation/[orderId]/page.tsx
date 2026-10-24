'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrderById, type OrderResponse } from '@/app/lib/api';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => {
        if (cancelled) return null;

        setLoading(true);
        setError(null);
        setOrder(null);

        const accessToken = useAuthStore.getState().accessToken;

        if (!accessToken) {
          router.replace(
            `/login?returnTo=${encodeURIComponent(`/confirmation/${orderId}`)}`,
          );
          return null;
        }

        return getOrderById(orderId, accessToken);
      })
      .then((foundOrder) => {
        if (cancelled || !foundOrder) return;

        setOrder(foundOrder);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Không thể tải xác nhận đơn hàng.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (loading) {
    return <main className="p-6 text-center text-gray-500">Đang xác minh đơn hàng...</main>;
  }

  const paid = order?.status === 'PAID';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <p className="text-sm text-red-700" role="alert">{error}</p>
        ) : order ? (
          <>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`} aria-hidden="true">
              {paid ? '✓' : '!'}
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              {paid ? 'Thanh toán thành công' : 'Đơn hàng chưa được thanh toán thành công'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {paid ? 'BrewLite đã xác nhận trạng thái đơn hàng từ máy chủ.' : 'Trạng thái dưới đây được lấy từ máy chủ; vui lòng quay lại thanh toán nếu đơn vẫn cho phép.'}
            </p>
            <dl className="mt-6 space-y-3 rounded-lg bg-gray-50 p-4 text-left">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-600">Mã đơn hàng</dt>
                <dd className="font-semibold text-gray-900">{order.code}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-600">Trạng thái</dt>
                <dd className="font-semibold text-gray-900">{order.status}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-600">Tổng tiền</dt>
                <dd className="font-semibold text-emerald-800">{order.totalAmount.toLocaleString('vi-VN')} đ</dd>
              </div>
            </dl>
            {paid ? (
              <Link href="/" className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
                Tiếp tục chọn món
              </Link>
            ) : (
              <Link href={`/checkout/${encodeURIComponent(order.id)}`} className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
                Quay lại thanh toán
              </Link>
            )}
          </>
        ) : null}
        {error && <Link href="/cart" className="mt-5 inline-block font-medium text-emerald-700 hover:underline">Quay lại giỏ hàng</Link>}
      </section>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyOrders, OrderResponse } from '@/app/lib/api';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    getMyOrders(accessToken)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'PAYMENT_FAILED': return 'text-red-600 bg-red-50';
      case 'CANCELLED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-6 border-b">
        <Link href="/" className="text-2xl font-bold text-emerald-700 hover:underline">
          ← Về trang chủ
        </Link>
        <h1 className="text-xl font-semibold text-gray-700">Lịch sử đơn hàng</h1>
      </header>

      <main className="max-w-4xl mx-auto">
        {!accessToken ? (
          <div className="text-center py-10">
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem lịch sử đơn hàng.</p>
            <Link href="/login" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
              Đăng nhập ngay
            </Link>
          </div>
        ) : loading ? (
          <p className="text-center py-10 text-gray-500">Đang tải lịch sử đơn hàng...</p>
        ) : error ? (
          <p className="text-center py-10 text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link href="/" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-bold text-gray-800 text-lg">Mã đơn: {order.code}</p>
                  <p className="text-sm text-gray-500">
                    Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Số món: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-semibold text-emerald-600 text-lg">
                    {order.totalAmount.toLocaleString('vi-VN')} đ
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
'use client';

import { useCartStore } from '@/app/store/useCartStore';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();

  // Tự động tính tổng tiền đơn hàng
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Tính tổng số lượng món cho Badge ở tiêu đề
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Giỏ hàng của bạn đang trống</h1>
        <Link href="/" className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium hover:bg-emerald-700">
          Quay lại trang chủ mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        
        {/* Tiêu đề tích hợp Badge số lượng */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-emerald-700 flex items-center gap-3">
            <span>Giỏ hàng của bạn</span>
            <span className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {totalQuantity} món
            </span>
          </h1>
          <Link href="/" className="text-sm text-emerald-600 hover:underline">
            &larr; Chọn thêm món
          </Link>
        </div>

        {/* Danh sách sản phẩm trong giỏ */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="py-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-emerald-600 font-medium">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ 
                  <span className="text-gray-400 text-xs ml-1">({item.price.toLocaleString('vi-VN')} đ/món)</span>
                </p>
              </div>

              {/* Cụm điều chỉnh số lượng & xóa */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => decreaseQuantity(item.id)}
                  className="bg-gray-200 w-7 h-7 rounded text-gray-700 font-bold hover:bg-gray-300 flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-medium w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => increaseQuantity(item.id)}
                  className="bg-gray-200 w-7 h-7 rounded text-gray-700 font-bold hover:bg-gray-300 flex items-center justify-center"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 text-sm font-medium ml-4 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tổng tiền và thao tác */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-gray-600">Tổng cộng: </span>
            <span className="text-xl font-bold text-emerald-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="space-x-3">
            <button
              onClick={clearCart}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Xóa tất cả
            </button>
            <button
              onClick={() => alert('Chuyển sang trang thanh toán (Task 6 & Task 8)')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium hover:bg-emerald-700"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Product } from '@/app/store/useCartStore';
import { useCartStore } from '@/app/store/useCartStore';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  
  // State quản lý hiển thị thông báo popup nhỏ (Toast)
  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    
    // Hiển thị thông báo
    setShowToast(true);
    
    // Tự động ẩn thông báo sau 2 giây
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <div className="relative bg-white rounded-lg shadow p-4 flex flex-col justify-between border border-gray-100 overflow-hidden">
      
      {/* Toast thông báo trượt ra thực tế như các web thương mại điện tử */}
      <div 
        className={`absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 z-10 flex items-center gap-1.5 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <span>✅ Đã thêm vào giỏ!</span>
      </div>

      <div>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-40 object-cover rounded-md mb-3" 
          />
        ) : (
          <div className="w-full h-40 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400 text-sm">
            Không có ảnh
          </div>
        )}
        <h3 className="font-bold text-gray-800 text-lg">{product.name}</h3>
        <p className="text-emerald-600 font-semibold mt-1">
          {product.price.toLocaleString('vi-VN')} đ
        </p>
      </div>

      <button
        onClick={handleAddToCart}
        className="mt-4 bg-emerald-600 text-white py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition"
      >
        Thêm vào giỏ
      </button>
    </div>
  );
}
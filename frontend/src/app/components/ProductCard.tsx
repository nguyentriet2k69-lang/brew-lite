import React from 'react';
import { Product } from '@/app/types/product';

// Định nghĩa props: Component này nhận vào 1 đối tượng 'product' có kiểu là Product
interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
      <div>
        {/* Khung chứa hình ảnh */}
        <div className="w-full h-40 bg-gray-200 rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-gray-400 text-sm">Chưa có ảnh</span>
          )}
        </div>

        {/* Tên sản phẩm */}
        <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>

        {/* Mô tả sản phẩm (nếu có) */}
        {product.description && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        )}
      </div>
      
      {/* Giá tiền và nút Thêm */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold text-emerald-600 text-base">
          {product.price.toLocaleString('vi-VN')} đ
        </span>
        <button 
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-emerald-700 transition-colors"
          onClick={() => alert(`Đã thêm ${product.name} vào giỏ!`)}
        >
          Thêm
        </button>
      </div>
    </div>
  );
};
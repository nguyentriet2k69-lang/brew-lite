'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, Size, Topping } from '../types/product';
import SizeSelector from './SizeSelector';
import ToppingSelector from './ToppingSelector';
import { useCartStore } from '../store/useCartStore';

// Topping mẫu (có thể chuyển sang API sau)
const AVAILABLE_TOPPINGS: Topping[] = [
  { id: 1, name: 'Trân châu', price: 10000 },
  { id: 2, name: 'Kem cheese', price: 15000 },
  { id: 3, name: 'Thạch trái cây', price: 8000 },
  { id: 4, name: 'Pudding', price: 12000 },
];

// Hệ số giá theo size
const SIZE_MULTIPLIER: Record<Size, number> = {
  S: 0.8, // giảm 20%
  M: 1,   // giá gốc
  L: 1.3, // tăng 30%
};

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState<Size>('M');
  const [selectedToppings, setSelectedToppings] = useState<(string | number)[]>([]);

  // Tính giá động
  const totalPrice = useMemo(() => {
    const basePrice = product.price * SIZE_MULTIPLIER[selectedSize];
    const toppingPrice = selectedToppings.reduce((sum: number, id) => {
    const topping = AVAILABLE_TOPPINGS.find((t) => t.id === id);
    return sum + (topping?.price || 0);
    }, 0);
    return Math.round(basePrice + toppingPrice);
  }, [product.price, selectedSize, selectedToppings]);

  const toggleTopping = (id: (string | number)) => {
    setSelectedToppings((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const toppings = AVAILABLE_TOPPINGS.filter((topping) =>
      selectedToppings.includes(topping.id)
    );

    addItem(product, selectedSize, toppings, totalPrice);
    router.push('/');
  };

  const isOutOfStock = (product.stock ?? 1) <= 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Nút quay lại */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-amber-700 mb-6 transition"
      >
        ← Quay lại menu
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Hình ảnh */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
          <Image
            src={product.imageUrl || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Thông tin + tùy chọn */}
        <div className="flex flex-col gap-6">
          {/* Tên + mô tả */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-gray-500 mt-2 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Giá động */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-700">
              {totalPrice.toLocaleString('vi-VN')}đ
            </span>
            {selectedSize !== 'M' || selectedToppings.length > 0 ? (
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
            ) : null}
          </div>

          {/* Size */}
          <SizeSelector selectedSize={selectedSize} onChange={setSelectedSize} />

          {/* Topping */}
          <ToppingSelector
            toppings={AVAILABLE_TOPPINGS}
            selectedIds={selectedToppings}
            onToggle={toggleTopping}
          />

          {/* Nút thêm vào giỏ */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg transition-all
              ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              }
            `}
          >
            {isOutOfStock
              ? 'Hết hàng'
              : `Thêm vào giỏ – ${totalPrice.toLocaleString('vi-VN')}đ`}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product, Size, Topping } from '@/app/types/product';
import { useCartStore } from '@/app/store/useCartStore';
import ProductImage from './ProductImage';

const AVAILABLE_TOPPINGS: Topping[] = [
  { id: 1, name: 'Trân châu', price: 10000 },
  { id: 2, name: 'Kem cheese', price: 15000 },
  { id: 3, name: 'Thạch trái cây', price: 8000 },
  { id: 4, name: 'Pudding', price: 12000 },
];

const SIZE_MULTIPLIER: Record<Size, number> = { S: 0.8, M: 1, L: 1.3 };
const SIZES: Size[] = ['S', 'M', 'L'];

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState<Size>('M');
  const [selectedToppingIds, setSelectedToppingIds] = useState<(string | number)[]>([]);
  const selectedToppings = AVAILABLE_TOPPINGS.filter((topping) =>
    selectedToppingIds.includes(topping.id),
  );
  const totalPrice = useMemo(
    () =>
      Math.round(
        product.price * SIZE_MULTIPLIER[selectedSize] +
          selectedToppings.reduce((sum, topping) => sum + topping.price, 0),
      ),
    [product.price, selectedSize, selectedToppings],
  );
  const isOutOfStock = (product.stock ?? 1) <= 0;

  const toggleTopping = (id: string | number) => {
    setSelectedToppingIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedToppings, totalPrice);
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-6 inline-flex text-gray-500 transition hover:text-emerald-700">
        ← Quay lại menu
      </Link>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full rounded-xl bg-gray-100 object-cover"
        />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.description && <p className="mt-2 text-gray-600">{product.description}</p>}
          </div>

          <p className="text-3xl font-bold text-emerald-700">
            {totalPrice.toLocaleString('vi-VN')} đ
          </p>

          <fieldset>
            <legend className="mb-3 font-semibold text-gray-800">Chọn size</legend>
            <div className="flex gap-3">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedSize === size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-14 w-14 rounded-full border-2 font-semibold transition ${
                    selectedSize === size
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                      : 'border-gray-300 text-gray-600 hover:border-emerald-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {selectedSize === 'S' ? 'Size S · giảm 20%' : selectedSize === 'L' ? 'Size L · tăng 30%' : 'Size M · giá gốc'}
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-semibold text-gray-800">Chọn topping</legend>
            <div className="space-y-2">
              {AVAILABLE_TOPPINGS.map((topping) => {
                const checked = selectedToppingIds.includes(topping.id);
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                      checked ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTopping(topping.id)}
                        className="h-4 w-4 accent-emerald-700"
                      />
                      <span>{topping.name}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      +{topping.price.toLocaleString('vi-VN')} đ
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full rounded-lg bg-emerald-700 py-4 text-lg font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isOutOfStock ? 'Hết hàng' : `Thêm vào giỏ · ${totalPrice.toLocaleString('vi-VN')} đ`}
          </button>
        </div>
      </div>
    </div>
  );
}

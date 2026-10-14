'use client';

import { Size } from '../types/product';

interface SizeSelectorProps {
  selectedSize: Size;
  onChange: (size: Size) => void;
}

const SIZES: Size[] = ['S', 'M', 'L'];

export default function SizeSelector({ selectedSize, onChange }: SizeSelectorProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">Chọn size</h3>
      <div className="flex gap-3">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`
              w-14 h-14 rounded-full border-2 font-semibold text-lg transition-all
              ${
                selectedSize === size
                  ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border-gray-300 text-gray-600 hover:border-amber-400 hover:bg-amber-50/50'
              }
            `}
          >
            {size}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {selectedSize === 'S' && 'Size S – giảm 20%'}
        {selectedSize === 'M' && 'Size M – giá gốc'}
        {selectedSize === 'L' && 'Size L – tăng 30%'}
      </p>
    </div>
  );
}

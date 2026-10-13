'use client';

import { Topping } from '../types/product';

interface ToppingSelectorProps {
  toppings: Topping[];
  selectedIds:(string | number)[];
  onToggle: (id: (string | number)) => void;
}

export default function ToppingSelector({
  toppings,
  selectedIds,
  onToggle,
}: ToppingSelectorProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">
        Topping <span className="text-gray-400 font-normal">(có thể chọn nhiều)</span>
      </h3>
      <div className="space-y-2">
        {toppings.map((topping) => {
          const isSelected = selectedIds.includes(topping.id);
          return (
            <label
              key={topping.id}
              className={`
                flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(topping.id)}
                  className="w-5 h-5 accent-amber-600 rounded"
                />
                <span className="font-medium text-gray-800">{topping.name}</span>
              </div>
              <span className="text-amber-700 font-medium">
                +{topping.price.toLocaleString('vi-VN')}đ
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

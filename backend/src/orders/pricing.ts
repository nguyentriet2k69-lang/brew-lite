export const SIZES = ['S', 'M', 'L'] as const;
export type Size = (typeof SIZES)[number];

/* Giá cộng thêm theo size (VND).*/
export const SIZE_EXTRA: Record<Size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

/*Giá mỗi topping (VND).*/
export const TOPPING_PRICE = 5000;

export function calcUnitPrice(basePrice: number, size: Size, toppingCount: number): number {
  return basePrice + SIZE_EXTRA[size] + toppingCount * TOPPING_PRICE;
}
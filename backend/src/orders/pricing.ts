export const SIZES = ['S', 'M', 'L'] as const;
export type Size = (typeof SIZES)[number];

/** The price multipliers displayed to customers on ProductDetail. */
export const SIZE_MULTIPLIER: Record<Size, number> = {
  S: 0.8,
  M: 1,
  L: 1.3,
};

/** Allowlisted topping names and prices; never accept prices from the client. */
export const TOPPING_PRICES = {
  'Trân châu': 10000,
  'Kem cheese': 15000,
  'Thạch trái cây': 8000,
  Pudding: 12000,
} as const;

export type ToppingName = keyof typeof TOPPING_PRICES;

export function isToppingName(value: string): value is ToppingName {
  return Object.prototype.hasOwnProperty.call(TOPPING_PRICES, value);
}

export function calcUnitPrice(
  basePrice: number,
  size: Size,
  toppings: readonly ToppingName[],
): number {
  const toppingTotal = toppings.reduce(
    (sum, topping) => sum + TOPPING_PRICES[topping],
    0,
  );
  return Math.round(basePrice * SIZE_MULTIPLIER[size] + toppingTotal);
}

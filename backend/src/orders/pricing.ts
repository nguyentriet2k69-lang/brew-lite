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

export interface PricingOption {
  type: string;
  name: string;
  price: number;
  isActive?: boolean;
}

export function isToppingName(value: string): value is ToppingName {
  return Object.prototype.hasOwnProperty.call(TOPPING_PRICES, value);
}

export function calcUnitPrice(
  basePrice: number,
  size: Size,
  toppings: readonly ToppingName[],
  options?: readonly PricingOption[],
): number {
  const activeOptions = options?.filter((option) => option.isActive !== false) ?? [];
  const sizeOption = activeOptions.find((option) => option.type === 'SIZE' && option.name === size);
  const sizePrice = sizeOption ? basePrice + sizeOption.price : basePrice * SIZE_MULTIPLIER[size];
  const toppingTotal = toppings.reduce((sum, topping) => {
    const option = activeOptions.find((candidate) => candidate.type === 'TOPPING' && candidate.name === topping);
    return sum + (option?.price ?? TOPPING_PRICES[topping]);
  }, 0);
  return Math.round(sizePrice + toppingTotal);
}

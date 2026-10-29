import { calcUnitPrice, isToppingName } from './pricing';

describe('order pricing', () => {
  it('matches the size multipliers displayed in ProductDetail', () => {
    expect(calcUnitPrice(30000, 'S', [])).toBe(24000);
    expect(calcUnitPrice(30000, 'M', [])).toBe(30000);
    expect(calcUnitPrice(30000, 'L', [])).toBe(39000);
  });

  it('uses active database options when they are available', () => {
    const options = [
      { type: 'SIZE', name: 'S', price: -5000 },
      { type: 'SIZE', name: 'M', price: 0 },
      { type: 'SIZE', name: 'L', price: 10000 },
      { type: 'TOPPING', name: 'Trân châu', price: 9000 },
    ];
    expect(calcUnitPrice(30000, 'S', ['Trân châu'], options)).toBe(34000);
  });

  it('uses the configured price for each allowlisted topping', () => {
    expect(calcUnitPrice(30000, 'M', ['Trân châu'])).toBe(40000);
    expect(calcUnitPrice(30000, 'S', ['Kem cheese', 'Pudding'])).toBe(51000);
    expect(isToppingName('Thạch trái cây')).toBe(true);
  });

  it('does not consider an unknown topping valid', () => {
    expect(isToppingName('Topping do client tự đặt')).toBe(false);
  });
});

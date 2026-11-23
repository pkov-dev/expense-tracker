import { describe, expect, it } from 'vitest';
import { totalsByCurrency } from './expense-totals';

const row = (currency: string, amount: string) => ({ currency, amount });

describe('totalsByCurrency', () => {
  it('is empty without rows', () => {
    expect(totalsByCurrency([])).toEqual([]);
  });

  it('sums per currency and never across currencies', () => {
    expect(
      totalsByCurrency([row('EUR', '100.00'), row('USD', '5.50'), row('EUR', '23.40')]),
    ).toEqual([
      { currency: 'EUR', amount: '123.40' },
      { currency: 'USD', amount: '5.50' },
    ]);
  });

  it('does not drift like floating point would (0.1 + 0.2)', () => {
    expect(totalsByCurrency([row('EUR', '0.10'), row('EUR', '0.20')])).toEqual([
      { currency: 'EUR', amount: '0.30' },
    ]);
  });

  it('carries cents into the whole part and pads them', () => {
    expect(totalsByCurrency([row('EUR', '0.99'), row('EUR', '0.01')])).toEqual([
      { currency: 'EUR', amount: '1.00' },
    ]);
    expect(totalsByCurrency([row('EUR', '1.05')])).toEqual([{ currency: 'EUR', amount: '1.05' }]);
  });

  it('copes with amounts beyond Number precision', () => {
    expect(totalsByCurrency([row('EUR', '9999999999.99'), row('EUR', '9999999999.99')])).toEqual([
      { currency: 'EUR', amount: '19999999999.98' },
    ]);
    expect(totalsByCurrency([row('EUR', '90071992547409.91'), row('EUR', '0.09')])).toEqual([
      { currency: 'EUR', amount: '90071992547410.00' },
    ]);
  });

  it('tolerates amounts without a fraction', () => {
    expect(totalsByCurrency([row('EUR', '115'), row('EUR', '0.5')])).toEqual([
      { currency: 'EUR', amount: '115.50' },
    ]);
  });

  it('orders currencies alphabetically', () => {
    expect(
      totalsByCurrency([row('USD', '1'), row('EUR', '1'), row('GBP', '1')]).map((t) => t.currency),
    ).toEqual(['EUR', 'GBP', 'USD']);
  });
});

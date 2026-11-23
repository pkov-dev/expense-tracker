import { describe, expect, it } from 'vitest';
import {
  createExpenseSchema,
  currencySchema,
  expenseAmountSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from './expense';

const valid = { amount: 12.5, currency: 'USD', date: '2026-11-23' };

describe('createExpenseSchema amount', () => {
  it.each([
    [12.5, 12.5],
    ['12.50', 12.5],
    ['7', 7],
    [' 7.1 ', 7.1],
    [9_999_999_999.99, 9_999_999_999.99],
    [0.01, 0.01],
  ])('accepts %j as %d', (input, expected) => {
    expect(createExpenseSchema.parse({ ...valid, amount: input }).amount).toBe(expected);
  });

  // `z.coerce.number()` used to store `true` as 1, `[]` and `""` as 0, `"1e3"` as 1000.
  it.each([
    true,
    false,
    null,
    undefined,
    [],
    {},
    '',
    ' ',
    '1e3',
    '-5',
    '+5',
    '12,5',
    '.5',
    '0x10',
    'abc',
    0,
    -1,
    0.001,
    12.345,
    10_000_000_000,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects %j', (amount) => {
    expect(createExpenseSchema.safeParse({ ...valid, amount }).success).toBe(false);
  });

  it('is the rule the web form reuses', () => {
    expect(expenseAmountSchema.safeParse(12.5).success).toBe(true);
    expect(expenseAmountSchema.safeParse(12.555).success).toBe(false);
  });
});

describe('currencySchema', () => {
  it.each([
    ['gbp', 'GBP'],
    ['USD', 'USD'],
    ['eUr', 'EUR'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(currencySchema.parse(input)).toBe(expected);
  });

  // Only the ASCII letters A-Z form a currency code: accented letters, symbols and full-width letters don't.
  it.each(['ZZ1', 'U5D', 'EU', 'EURO', '', ' US', 'US ', 'ÜSD', '€UR', 'ＵＳＤ', '12', 'U$D'])(
    'rejects %j',
    (input) => {
      expect(currencySchema.safeParse(input).success).toBe(false);
    },
  );
});

describe('createExpenseSchema', () => {
  it('requires amount, currency and an ISO date', () => {
    expect(createExpenseSchema.safeParse({}).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, date: '23.11.2026' }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false);
  });

  it('allows a missing or null category and description', () => {
    expect(createExpenseSchema.safeParse(valid).success).toBe(true);
    expect(
      createExpenseSchema.safeParse({ ...valid, categoryId: null, description: null }).success,
    ).toBe(true);
  });

  it('rejects a category id that is not a UUID and an over-long description', () => {
    expect(createExpenseSchema.safeParse({ ...valid, categoryId: '1' }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, description: 'x'.repeat(501) }).success).toBe(
      false,
    );
  });
});

describe('updateExpenseSchema', () => {
  it('needs at least one field', () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
  });

  it('lets a category and description be cleared with null', () => {
    expect(updateExpenseSchema.safeParse({ categoryId: null }).success).toBe(true);
    expect(updateExpenseSchema.safeParse({ description: null }).success).toBe(true);
  });

  it('applies the same amount rules', () => {
    expect(updateExpenseSchema.safeParse({ amount: true }).success).toBe(false);
    expect(updateExpenseSchema.parse({ amount: '3.5' })).toEqual({ amount: 3.5 });
  });
});

describe('listExpensesQuerySchema', () => {
  it('applies defaults', () => {
    expect(listExpensesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('coerces numeric query strings', () => {
    expect(listExpensesQuerySchema.parse({ page: '3', pageSize: '25' })).toMatchObject({
      page: 3,
      pageSize: 25,
    });
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'abc' },
    { pageSize: '0' },
    { pageSize: '101' },
  ])('rejects %j', (query) => {
    expect(listExpensesQuerySchema.safeParse(query).success).toBe(false);
  });

  it('rejects a range that ends before it starts, reporting "from"', () => {
    const result = listExpensesQuerySchema.safeParse({ from: '2026-11-10', to: '2026-11-01' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['from']);
  });

  it('accepts equal and open-ended ranges', () => {
    expect(
      listExpensesQuerySchema.safeParse({ from: '2026-11-10', to: '2026-11-10' }).success,
    ).toBe(true);
    expect(listExpensesQuerySchema.safeParse({ from: '2026-11-10' }).success).toBe(true);
    expect(listExpensesQuerySchema.safeParse({ to: '2026-11-10' }).success).toBe(true);
  });
});

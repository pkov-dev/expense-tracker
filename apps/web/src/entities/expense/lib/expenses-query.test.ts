import { describe, expect, it } from 'vitest';
import { toExpensesQueryString } from './expenses-query';

describe('toExpensesQueryString', () => {
  it('is empty when there is nothing to say', () => {
    expect(toExpensesQueryString({})).toBe('');
    expect(toExpensesQueryString({}, 1)).toBe('');
    expect(toExpensesQueryString({ categoryId: undefined, from: '', to: undefined })).toBe('');
  });

  it('omits page 1 but keeps later pages', () => {
    expect(toExpensesQueryString({ from: '2026-11-01' }, 1)).toBe('?from=2026-11-01');
    expect(toExpensesQueryString({}, 3)).toBe('?page=3');
  });

  it('carries all filters in a stable order', () => {
    expect(
      toExpensesQueryString({ to: '2026-11-30', from: '2026-11-01', categoryId: 'abc' }, 2),
    ).toBe('?categoryId=abc&from=2026-11-01&to=2026-11-30&page=2');
  });

  it('encodes values', () => {
    expect(toExpensesQueryString({ categoryId: 'a b&c' })).toBe('?categoryId=a+b%26c');
  });
});

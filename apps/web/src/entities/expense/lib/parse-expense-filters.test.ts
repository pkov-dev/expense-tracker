import { describe, expect, it } from 'vitest';
import { parseExpenseFilters } from './parse-expense-filters';

const CATEGORY = '6f9619ff-8b86-4011-b42d-00c04fc964ff';

describe('parseExpenseFilters', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseExpenseFilters({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('reads every filter', () => {
    expect(
      parseExpenseFilters({
        page: '3',
        categoryId: CATEGORY,
        from: '2026-11-01',
        to: '2026-11-30',
      }),
    ).toEqual({
      page: 3,
      pageSize: 10,
      categoryId: CATEGORY,
      from: '2026-11-01',
      to: '2026-11-30',
    });
  });

  it('takes the first value of a repeated param', () => {
    expect(parseExpenseFilters({ page: ['2', '5'] }).page).toBe(2);
  });

  it('cannot be used to change the page size', () => {
    expect(parseExpenseFilters({ pageSize: '100' }).pageSize).toBe(10);
  });

  it('drops a bad value on its own and keeps the rest', () => {
    const result = parseExpenseFilters({ page: 'abc', categoryId: CATEGORY, from: '2026-11-01' });
    expect(result).toEqual({ page: 1, pageSize: 10, categoryId: CATEGORY, from: '2026-11-01' });
  });

  it.each([{ page: '0' }, { page: '-3' }, { page: '1.5' }])(
    'falls back to page 1 for %j',
    (params) => {
      expect(parseExpenseFilters(params).page).toBe(1);
    },
  );

  it('ignores a category that is not a UUID but keeps the dates', () => {
    const result = parseExpenseFilters({
      categoryId: 'food',
      from: '2026-11-01',
      to: '2026-11-30',
    });
    expect(result.categoryId).toBeUndefined();
    expect(result).toMatchObject({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('drops only the dates when the range is inverted', () => {
    const result = parseExpenseFilters({
      page: '2',
      categoryId: CATEGORY,
      from: '2026-11-30',
      to: '2026-11-01',
    });
    expect(result).toEqual({ page: 2, pageSize: 10, categoryId: CATEGORY });
  });

  it('ignores impossible dates', () => {
    expect(parseExpenseFilters({ from: '2026-02-30' }).from).toBeUndefined();
  });
});

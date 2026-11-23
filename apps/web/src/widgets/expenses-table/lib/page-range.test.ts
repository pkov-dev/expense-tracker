import { describe, expect, it } from 'vitest';
import { getPageItems } from './page-range';

describe('getPageItems', () => {
  it.each([
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [2, 3, [1, 2, 3]],
    // A gap of exactly one page is filled instead of replaced with an ellipsis.
    [4, 12, [1, 2, 3, 4, 5, 'ellipsis-end', 12]],
    [6, 12, [1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 12]],
    [9, 12, [1, 'ellipsis-start', 8, 9, 10, 11, 12]],
    [1, 12, [1, 2, 'ellipsis-end', 12]],
    [12, 12, [1, 'ellipsis-start', 11, 12]],
  ])('page %d of %d', (current, total, expected) => {
    expect(getPageItems(current, total)).toEqual(expected);
  });

  it('never repeats an item, so the items can be used as React keys', () => {
    for (let total = 1; total <= 15; total++) {
      for (let current = 1; current <= total; current++) {
        const items = getPageItems(current, total);
        expect(new Set(items).size).toBe(items.length);
        expect(items).toContain(current);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { currentMonthRange } from './current-month';

describe('currentMonthRange', () => {
  it.each([
    [new Date(2026, 10, 23), { from: '2026-11-01', to: '2026-11-30' }],
    [new Date(2026, 0, 1), { from: '2026-01-01', to: '2026-01-31' }],
    [new Date(2026, 11, 31, 23, 59), { from: '2026-12-01', to: '2026-12-31' }],
    [new Date(2026, 1, 28), { from: '2026-02-01', to: '2026-02-28' }],
    [new Date(2028, 1, 10), { from: '2028-02-01', to: '2028-02-29' }],
  ])('%s', (now, expected) => {
    expect(currentMonthRange(now)).toEqual(expected);
  });
});

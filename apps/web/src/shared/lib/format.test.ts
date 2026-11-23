import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, toIsoDate } from './format';

/** Intl separates thousands and the currency sign with (narrow) no-break spaces. */
const plain = (value: string) => value.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formats euros with the app locale', () => {
    expect(plain(formatMoney('1234.5', 'EUR'))).toBe('1 234,50 €');
  });

  it('formats other currencies', () => {
    expect(plain(formatMoney('10', 'USD'))).toContain('10,00');
    expect(plain(formatMoney('10', 'USD'))).toContain('$');
  });

  it('falls back to "<amount> <code>" for a code Intl rejects', () => {
    expect(formatMoney('12.5', 'ZZ1')).toBe('12.50 ZZ1');
  });
});

describe('formatDate', () => {
  it('formats a calendar date', () => {
    expect(plain(formatDate('2026-11-23'))).toBe('23 нояб. 2026 г.');
  });

  it('is not shifted by the time zone', () => {
    expect(plain(formatDate('2026-01-01'))).toBe('1 янв. 2026 г.');
    expect(plain(formatDate('2026-12-31'))).toBe('31 дек. 2026 г.');
  });

  it('returns what it cannot parse', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
    expect(formatDate('')).toBe('');
  });
});

describe('toIsoDate', () => {
  it('uses the local calendar date and pads', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 10, 23, 23, 59, 59))).toBe('2026-11-23');
  });
});

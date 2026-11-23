import type { ExpenseSummaryDto } from '@expense-tracker/shared';
import type { SummaryRow } from './expenses.repository';

/** Per-currency totals of the summary rows. Amounts of different currencies are never added together. */
export function totalsByCurrency(
  rows: Pick<SummaryRow, 'currency' | 'amount'>[],
): ExpenseSummaryDto['totals'] {
  // Sum in integer cents to avoid float drift.
  const cents = new Map<string, bigint>();
  for (const row of rows) {
    const [whole = '0', fraction = ''] = row.amount.split('.');
    const value = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
    cents.set(row.currency, (cents.get(row.currency) ?? 0n) + value);
  }
  return [...cents.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, total]) => ({
      currency,
      amount: `${total / 100n}.${(total % 100n).toString().padStart(2, '0')}`,
    }));
}

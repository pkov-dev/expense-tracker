import { toIsoDate } from '@/shared/lib/format';

/** First and last day of the month containing `now`, as "YYYY-MM-DD". */
export function currentMonthRange(now = new Date()): { from: string; to: string } {
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

import { type ListExpensesQuery, listExpensesQuerySchema } from '@expense-tracker/shared';

type SearchParams = Record<string, string | string[] | undefined>;

/** URL search params → validated list query. Invalid or hand-edited values fall back to defaults. */
export function parseExpenseFilters(searchParams: SearchParams): ListExpensesQuery {
  const raw: Record<string, string> = {};
  for (const key of ['page', 'categoryId', 'from', 'to']) {
    const value = searchParams[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) raw[key] = first;
  }
  const parsed = listExpensesQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : listExpensesQuerySchema.parse({});
}

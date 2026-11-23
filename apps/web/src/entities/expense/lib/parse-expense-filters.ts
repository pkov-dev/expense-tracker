import { type ListExpensesQuery, listExpensesQuerySchema } from '@expense-tracker/shared';

type SearchParams = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ['page', 'categoryId', 'from', 'to'] as const;

/**
 * URL search params → validated list query. The URL is user-editable, so a bad value is dropped on its
 * own (back to the default) instead of wiping every filter.
 */
export function parseExpenseFilters(searchParams: SearchParams): ListExpensesQuery {
  const shape = listExpensesQuerySchema.shape;
  const raw: Partial<Record<(typeof FILTER_KEYS)[number], string>> = {};
  for (const key of FILTER_KEYS) {
    const value = searchParams[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first && shape[key].safeParse(first).success) raw[key] = first;
  }

  const parsed = listExpensesQuerySchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Every field is valid on its own, so what is left is a range that ends before it starts.
  delete raw.from;
  delete raw.to;
  return listExpensesQuerySchema.parse(raw);
}

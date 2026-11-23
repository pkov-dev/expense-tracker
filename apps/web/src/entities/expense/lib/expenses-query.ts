import type { ListExpensesQuery } from '@expense-tracker/shared';

/**
 * Filters + page → "?categoryId=…&from=…&page=2" (empty string when there is nothing to say).
 * Which route the query belongs to is the caller's business; the page 1 and empty filters are omitted.
 */
export function toExpensesQueryString(
  filters: Pick<ListExpensesQuery, 'categoryId' | 'from' | 'to'>,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

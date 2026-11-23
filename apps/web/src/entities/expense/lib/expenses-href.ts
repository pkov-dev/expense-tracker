import type { ListExpensesQuery } from '@expense-tracker/shared';

/** Link to the transactions list preserving filters; page 1 and empty filters are omitted. */
export function expensesHref(filters: Pick<ListExpensesQuery, 'categoryId' | 'from' | 'to'>, page = 1): string {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

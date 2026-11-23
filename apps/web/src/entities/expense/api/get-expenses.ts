import 'server-only';

import type { ExpenseDto, ListExpensesQuery, PaginatedDto } from '@expense-tracker/shared';
import { authorizedRequest } from '@/shared/api';

export function getExpenses(query: ListExpensesQuery) {
  return authorizedRequest<PaginatedDto<ExpenseDto>>('/api/expenses', { query });
}

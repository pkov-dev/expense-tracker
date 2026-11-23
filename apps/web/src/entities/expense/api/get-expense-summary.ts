import 'server-only';

import type { ExpenseSummaryDto } from '@expense-tracker/shared';
import { authorizedRequest } from '@/shared/api';

export function getExpenseSummary(range: { from: string; to: string }) {
  return authorizedRequest<ExpenseSummaryDto>('/api/expenses/summary', { query: range });
}

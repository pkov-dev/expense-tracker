import type { ExpenseDto } from '@expense-tracker/shared';
import type { Expense } from '../generated/prisma/client';

export function toExpenseDto(expense: Expense): ExpenseDto {
  return {
    id: expense.id,
    amount: expense.amount.toFixed(2),
    currency: expense.currency,
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    categoryId: expense.categoryId,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

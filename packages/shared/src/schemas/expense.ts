import { z } from 'zod';
import { paginationQuerySchema } from './pagination';

/** ISO 4217 currency code, e.g. "USD", "EUR", "RUB". */
export const currencySchema = z
  .string()
  .length(3)
  .transform((value) => value.toUpperCase());

/** Decimal(12,2) in the DB → positive, at most 9 999 999 999.99, 2 decimal places. */
export const expenseAmountSchema = z.number().positive().max(9_999_999_999.99).multipleOf(0.01);

export const createExpenseSchema = z.object({
  /** Accepts numeric strings too (query/form input). */
  amount: z.coerce.number().pipe(expenseAmountSchema),
  currency: currencySchema,
  description: z.string().trim().max(500).nullable().optional(),
  /** Calendar date of the expense, "YYYY-MM-DD". */
  date: z.iso.date(),
  categoryId: z.uuid().nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const dateRangeRefinement = (value: { from?: string | undefined; to?: string | undefined }) =>
  !value.from || !value.to || value.from <= value.to;

export const listExpensesQuerySchema = paginationQuerySchema
  .extend({
    categoryId: z.uuid().optional(),
    /** Inclusive lower bound, "YYYY-MM-DD". */
    from: z.iso.date().optional(),
    /** Inclusive upper bound, "YYYY-MM-DD". */
    to: z.iso.date().optional(),
  })
  .refine(dateRangeRefinement, { message: '"from" must not be after "to"', path: ['from'] });

export const expenseSummaryQuerySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .refine(dateRangeRefinement, { message: '"from" must not be after "to"', path: ['from'] });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExpenseSummaryQuery = z.infer<typeof expenseSummaryQuerySchema>;

export interface ExpenseDto {
  id: string;
  amount: string;
  currency: string;
  description: string | null;
  date: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryDto {
  /** Number of expenses in the period (all currencies). */
  count: number;
  totals: { currency: string; amount: string }[];
  byCategory: { categoryId: string | null; currency: string; amount: string; count: number }[];
}

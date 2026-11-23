import { redirect } from 'next/navigation';
import { getCategories } from '@/entities/category/server';
import { currentMonthRange, expensesHref, parseExpenseFilters } from '@/entities/expense';
import { getExpenses, getExpenseSummary } from '@/entities/expense/server';
import { CreateExpenseButton } from '@/features/expense-form';
import { ExpenseFilters } from '@/features/filter-expenses';
import { ExpenseSummary } from '@/widgets/expense-summary';
import { ExpensesTable } from '@/widgets/expenses-table';

type SearchParams = Record<string, string | string[] | undefined>;

export async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseExpenseFilters(await searchParams);

  const [data, summary, categories] = await Promise.all([
    getExpenses(filters),
    getExpenseSummary(currentMonthRange()),
    getCategories(),
  ]);

  // Stale link (e.g. rows were deleted): jump to the last existing page instead of showing an empty one.
  if (filters.page > data.totalPages) redirect(expensesHref(filters, data.totalPages));

  const periodLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date());
  const { categoryId, from, to } = filters;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Транзакции</h1>
        <CreateExpenseButton categories={categories} />
      </div>

      <ExpenseSummary summary={summary} categories={categories} periodLabel={periodLabel} />
      <ExpenseFilters categories={categories} filters={{ categoryId, from, to }} />
      <ExpensesTable data={data} categories={categories} filters={{ categoryId, from, to }} />
    </div>
  );
}

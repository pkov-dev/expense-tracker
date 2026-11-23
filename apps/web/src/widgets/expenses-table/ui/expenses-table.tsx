import type { CategoryDto, ExpenseDto, PaginatedDto } from '@expense-tracker/shared';
import { CategoryBadge, UncategorizedBadge } from '@/entities/category';
import { CreateExpenseButton } from '@/features/expense-form';
import { formatDate, formatMoney } from '@/shared/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ExpensesPagination } from './expenses-pagination';
import { ExpenseActionsProvider, ExpenseRowActions } from './expense-row-actions';

interface Props {
  data: PaginatedDto<ExpenseDto>;
  categories: CategoryDto[];
  filters: { categoryId?: string | undefined; from?: string | undefined; to?: string | undefined };
}

export function ExpensesTable({ data, categories, filters }: Props) {
  const { items, total, page, pageSize, totalPages } = data;
  const hasFilters = Boolean(filters.categoryId || filters.from || filters.to);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">{hasFilters ? 'Ничего не найдено' : 'Пока нет транзакций'}</p>
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? 'Попробуйте изменить или сбросить фильтры.'
            : 'Добавьте первую трату, чтобы начать вести учёт.'}
        </p>
        {!hasFilters && <CreateExpenseButton categories={categories} />}
      </div>
    );
  }

  const first = (page - 1) * pageSize + 1;
  const last = first + items.length - 1;

  return (
    <ExpenseActionsProvider categories={categories}>
      <div className="grid gap-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-36 md:table-cell">Дата</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="hidden md:table-cell">Категория</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Действия</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((expense) => {
                const category = expense.categoryId
                  ? categoryById.get(expense.categoryId)
                  : undefined;
                const categoryBadge = category ? (
                  <CategoryBadge name={category.name} color={category.color} icon={category.icon} />
                ) : (
                  <UncategorizedBadge />
                );
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="max-w-0 md:max-w-xs">
                      <div className="truncate">{expense.description || '—'}</div>
                      {/* Compact layout: date and category move under the description on narrow screens. */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:hidden">
                        <span>{formatDate(expense.date)}</span>
                        {categoryBadge}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{categoryBadge}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                      {formatMoney(expense.amount, expense.currency)}
                    </TableCell>
                    <TableCell>
                      <ExpenseRowActions expense={expense} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Показано {first}–{last} из {total} · страница {page} из {totalPages}
          </p>
          <ExpensesPagination page={page} totalPages={totalPages} filters={filters} />
        </div>
      </div>
    </ExpenseActionsProvider>
  );
}

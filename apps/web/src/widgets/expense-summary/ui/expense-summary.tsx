import type { CategoryDto, ExpenseSummaryDto } from '@expense-tracker/shared';
import { CategoryBadge, UncategorizedBadge } from '@/entities/category';
import { DEFAULT_CURRENCY } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const TOP_CATEGORIES = 5;

interface Props {
  summary: ExpenseSummaryDto;
  categories: CategoryDto[];
  /** e.g. "ноябрь 2026 г." */
  periodLabel: string;
}

export function ExpenseSummary({ summary, categories, periodLabel }: Props) {
  const totals = summary.totals.length > 0 ? summary.totals : [{ currency: DEFAULT_CURRENCY, amount: '0' }];

  // Shares only make sense within one currency: use the default one if present, else the first.
  const primary = (totals.find((t) => t.currency === DEFAULT_CURRENCY) ?? totals[0])!;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const top = summary.byCategory
    .filter((row) => row.currency === primary.currency)
    .map((row) => ({ ...row, value: Number(row.amount) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_CATEGORIES);
  const primaryTotal = Number(primary.amount);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Расходы за {periodLabel}</CardDescription>
          <CardTitle className="grid gap-1 text-2xl tabular-nums">
            {totals.map((total) => (
              <span key={total.currency}>{formatMoney(total.amount, total.currency)}</span>
            ))}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Транзакций за месяц</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{summary.count}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Топ категорий, {primary.currency}</CardDescription>
        </CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет данных</p>
          ) : (
            <ul className="grid gap-3">
              {top.map((row) => {
                const category = row.categoryId ? categoryById.get(row.categoryId) : undefined;
                const share = primaryTotal > 0 ? (row.value / primaryTotal) * 100 : 0;
                return (
                  <li key={`${row.categoryId ?? 'none'}`} className="grid gap-1">
                    <div className="flex items-center justify-between gap-2">
                      {category ? (
                        <CategoryBadge name={category.name} color={category.color} icon={category.icon} />
                      ) : (
                        <UncategorizedBadge />
                      )}
                      <span className="text-sm tabular-nums">{formatMoney(row.amount, row.currency)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: category?.color ?? '#64748b' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

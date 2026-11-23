'use client';

import type { CategoryDto } from '@expense-tracker/shared';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { CategoryBadge } from '@/entities/category';
import { toExpensesQueryString } from '@/entities/expense';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ALL = 'all';

/** Wait for typing to settle before navigating. */
const DATE_DEBOUNCE_MS = 400;

/**
 * A date input reports every intermediate value while a year is being typed ("0002-…", "0020-…", "0202-…").
 * Only plausible dates are worth a request.
 */
const isApplicable = (value: string) =>
  value === '' || (value >= '1900-01-01' && value <= '2999-12-31');

interface Filters {
  categoryId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

interface Props {
  categories: CategoryDto[];
  filters: Filters;
}

/** Filters live in the URL (shareable, survives reload); every change resets to page 1. */
export function ExpenseFilters({ categories, filters }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // What the user is typing into the date inputs; `null` once the URL has caught up (or nothing was edited).
  const [draft, setDraft] = useState<{ from: string; to: string } | null>(null);
  const from = draft?.from ?? filters.from ?? '';
  const to = draft?.to ?? filters.to ?? '';
  if (draft && draft.from === (filters.from ?? '') && draft.to === (filters.to ?? ''))
    setDraft(null);

  const navigate = (next: Filters) =>
    startTransition(() => router.replace(`${ROUTES.transactions}${toExpensesQueryString(next)}`));

  useEffect(() => {
    if (!draft || !isApplicable(draft.from) || !isApplicable(draft.to)) return;
    if (draft.from && draft.to && draft.from > draft.to) return; // wait until the range makes sense
    const timer = setTimeout(
      () =>
        startTransition(() =>
          router.replace(
            `${ROUTES.transactions}${toExpensesQueryString({
              categoryId: filters.categoryId,
              from: draft.from || undefined,
              to: draft.to || undefined,
            })}`,
          ),
        ),
      DATE_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [draft, filters.categoryId, router]);

  const hasFilters = Boolean(filters.categoryId || from || to);

  return (
    <div className="flex flex-wrap items-end gap-3" aria-busy={isPending}>
      <div className="grid w-full gap-1.5 sm:w-56">
        <Label htmlFor="filter-category">Категория</Label>
        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(value) =>
            navigate({ ...filters, categoryId: value === ALL ? undefined : value })
          }
        >
          <SelectTrigger id="filter-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все категории</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryBadge name={category.name} color={category.color} icon={category.icon} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-from">С</Label>
        <Input
          id="filter-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setDraft({ from: event.target.value, to })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-to">По</Label>
        <Input
          id="filter-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setDraft({ from, to: event.target.value })}
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(null);
            navigate({});
          }}
        >
          <X />
          Сбросить
        </Button>
      )}
    </div>
  );
}

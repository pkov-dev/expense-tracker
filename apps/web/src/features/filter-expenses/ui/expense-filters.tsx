'use client';

import type { CategoryDto } from '@expense-tracker/shared';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CategoryBadge } from '@/entities/category';
import { toExpensesQueryString } from '@/entities/expense';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ALL = 'all';

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

  const apply = (next: Filters) => startTransition(() => router.replace(`${ROUTES.transactions}${toExpensesQueryString(next)}`));
  const hasFilters = Boolean(filters.categoryId || filters.from || filters.to);

  return (
    <div className="flex flex-wrap items-end gap-3" aria-busy={isPending}>
      <div className="grid w-full gap-1.5 sm:w-56">
        <Label htmlFor="filter-category">Категория</Label>
        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(value) => apply({ ...filters, categoryId: value === ALL ? undefined : value })}
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
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => apply({ ...filters, from: event.target.value || undefined })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-to">По</Label>
        <Input
          id="filter-to"
          type="date"
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => apply({ ...filters, to: event.target.value || undefined })}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" onClick={() => apply({})}>
          <X />
          Сбросить
        </Button>
      )}
    </div>
  );
}

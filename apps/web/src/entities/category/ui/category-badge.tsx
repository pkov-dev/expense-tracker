import type { CategoryDto } from '@expense-tracker/shared';
import { cn } from '@/shared/lib/utils';
import { CategoryIcon } from './category-icon';

type Props = Pick<CategoryDto, 'name' | 'color' | 'icon'> & { className?: string };

/** Coloured round icon + name. Pass `null` category data via `UncategorizedBadge`. */
export function CategoryBadge({ name, color, icon, className }: Props) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2 text-sm', className)}>
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26`, color }}
      >
        <CategoryIcon name={icon} className="size-3.5" />
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

export function UncategorizedBadge({ className }: { className?: string }) {
  return <span className={cn('text-sm text-muted-foreground', className)}>Без категории</span>;
}

import type { CategoryDto } from '@expense-tracker/shared';
import { CategoryBadge } from '@/entities/category';
import { CreateCategoryButton } from '@/features/category-form';
import { CategoryRowActions } from './category-row-actions';

export function CategoriesList({ categories }: { categories: CategoryDto[] }) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Категорий пока нет</p>
        <p className="text-sm text-muted-foreground">Создайте категории, чтобы группировать траты.</p>
        <CreateCategoryButton />
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {categories.map((category) => (
        <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <CategoryBadge name={category.name} color={category.color} icon={category.icon} className="text-base" />
          <CategoryRowActions category={category} />
        </li>
      ))}
    </ul>
  );
}

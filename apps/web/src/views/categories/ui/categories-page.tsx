import { getCategories } from '@/entities/category/server';
import { CreateCategoryButton } from '@/features/category-form';
import { CategoriesList } from '@/widgets/categories-list';

export async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Категории</h1>
        {categories.length > 0 && <CreateCategoryButton />}
      </div>
      <CategoriesList categories={categories} />
    </div>
  );
}

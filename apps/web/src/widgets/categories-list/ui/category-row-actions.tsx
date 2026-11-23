'use client';

import type { CategoryDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { EditCategoryDialog } from '@/features/category-form';
import { DeleteCategoryDialog } from '@/features/delete-category';
import { RowActionsMenu } from '@/shared/ui/row-actions-menu';

export function CategoryRowActions({ category }: { category: CategoryDto }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionsMenu
        label={`Действия с категорией «${category.name}»`}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      <EditCategoryDialog open={editOpen} onOpenChange={setEditOpen} category={category} />
      <DeleteCategoryDialog
        categoryId={category.id}
        categoryName={category.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

'use client';

import { ConfirmDeleteDialog } from '@/shared/ui/confirm-delete-dialog';
import { deleteCategoryAction } from '../api/delete-category.action';

interface Props {
  categoryId: string;
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({ categoryId, categoryName, open, onOpenChange }: Props) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Удалить категорию «${categoryName}»?`}
      description="Транзакции этой категории останутся, но станут «Без категории»."
      onConfirm={() => deleteCategoryAction(categoryId)}
    />
  );
}

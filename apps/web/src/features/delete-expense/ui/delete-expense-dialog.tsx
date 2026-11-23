'use client';

import { ConfirmDeleteDialog } from '@/shared/ui/confirm-delete-dialog';
import { deleteExpenseAction } from '../api/delete-expense.action';

interface Props {
  expenseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExpenseDialog({ expenseId, open, onOpenChange }: Props) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Удалить транзакцию?"
      description="Это действие нельзя отменить."
      onConfirm={() => deleteExpenseAction(expenseId)}
    />
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { deleteExpenseAction } from '../api/delete-expense.action';

interface Props {
  expenseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExpenseDialog({ expenseId, open, onOpenChange }: Props) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteExpenseAction(expenseId);
      if (result) setError(result.error);
      else onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
          <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          {/* Plain Button (not AlertDialogAction) so the dialog stays open until the request finishes. */}
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending ? 'Удаляем…' : 'Удалить'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

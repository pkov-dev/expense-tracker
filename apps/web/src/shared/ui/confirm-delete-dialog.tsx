'use client';

import { type ReactNode, useState, useTransition } from 'react';
import type { FormState } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  /** Performs the deletion: `undefined` closes the dialog, `{ error }` keeps it open and shows the message. */
  onConfirm: () => Promise<FormState>;
}

/** Confirmation step shared by every "delete X" feature. */
export function ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm }: Props) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) setError(undefined);
    onOpenChange(next);
  };

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await onConfirm();
      if (result) setError(result.error);
      else onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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

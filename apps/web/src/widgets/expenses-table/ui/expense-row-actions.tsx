'use client';

import type { CategoryDto, ExpenseDto } from '@expense-tracker/shared';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteExpenseDialog } from '@/features/delete-expense';
import { EditExpenseDialog } from '@/features/expense-form';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function ExpenseRowActions({ expense, categories }: { expense: ExpenseDto; categories: CategoryDto[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Действия с транзакцией">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs live outside the menu content, otherwise they unmount when the menu closes. */}
      <EditExpenseDialog open={editOpen} onOpenChange={setEditOpen} categories={categories} expense={expense} />
      <DeleteExpenseDialog expenseId={expense.id} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

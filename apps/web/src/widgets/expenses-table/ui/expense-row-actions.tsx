'use client';

import type { CategoryDto, ExpenseDto } from '@expense-tracker/shared';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { DeleteExpenseDialog } from '@/features/delete-expense';
import { EditExpenseDialog } from '@/features/expense-form';
import { RowActionsMenu } from '@/shared/ui/row-actions-menu';

interface ExpenseActions {
  edit: (expense: ExpenseDto) => void;
  remove: (expense: ExpenseDto) => void;
}

const ExpenseActionsContext = createContext<ExpenseActions | null>(null);

/**
 * Owns the one edit dialog and the one delete dialog of the table. A pair per row would mount 2 × N
 * dialogs and serialize the category list into the page payload once for every row.
 */
export function ExpenseActionsProvider({
  categories,
  children,
}: {
  categories: CategoryDto[];
  children: ReactNode;
}) {
  // The target outlives the dialog: clearing it on close would flip the edit form into "create" mode
  // (and empty the delete dialog) while the closing animation is still running.
  const [editing, setEditing] = useState<ExpenseDto>();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExpenseDto>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const actions = useMemo<ExpenseActions>(
    () => ({
      edit: (expense) => {
        setEditing(expense);
        setEditOpen(true);
      },
      remove: (expense) => {
        setDeleting(expense);
        setDeleteOpen(true);
      },
    }),
    [],
  );

  return (
    <ExpenseActionsContext value={actions}>
      {children}
      {editing && (
        <EditExpenseDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          categories={categories}
          expense={editing}
        />
      )}
      {deleting && (
        <DeleteExpenseDialog
          expenseId={deleting.id}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </ExpenseActionsContext>
  );
}

export function ExpenseRowActions({ expense }: { expense: ExpenseDto }) {
  const actions = useContext(ExpenseActionsContext);
  if (!actions) throw new Error('ExpenseRowActions must be rendered inside ExpenseActionsProvider');

  return (
    <RowActionsMenu
      label="Действия с транзакцией"
      onEdit={() => actions.edit(expense)}
      onDelete={() => actions.remove(expense)}
    />
  );
}

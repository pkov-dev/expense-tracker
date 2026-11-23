'use client';

import type { CategoryDto } from '@expense-tracker/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { ExpenseFormDialog } from './expense-form-dialog';

export function CreateExpenseButton({ categories }: { categories: CategoryDto[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Добавить
      </Button>
      <ExpenseFormDialog open={open} onOpenChange={setOpen} categories={categories} />
    </>
  );
}

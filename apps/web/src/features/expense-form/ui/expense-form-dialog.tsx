'use client';

import {
  type CategoryDto,
  createExpenseSchema,
  type ExpenseDto,
  expenseAmountSchema,
} from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CategoryBadge } from '@/entities/category';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/shared/config';
import { toIsoDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { createExpenseAction, updateExpenseAction } from '../api/expense.actions';

/** Radix Select forbids empty item values, so "no category" gets a sentinel. */
const NO_CATEGORY = 'none';

const formSchema = z.object({
  // Accept "12,50" as well as "12.50", then reuse the API rules (positive, max, 2 decimals).
  amount: z
    .string()
    .trim()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(expenseAmountSchema),
  currency: createExpenseSchema.shape.currency,
  date: createExpenseSchema.shape.date,
  categoryId: z.string(),
  description: z.string().max(500),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDto[];
  /** Present → edit mode, absent → create mode. */
  expense?: ExpenseDto;
}

export function ExpenseFormDialog({ open, onOpenChange, categories, expense }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? 'Редактировать транзакцию' : 'Новая транзакция'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Измените данные и сохраните.' : 'Укажите сумму, дату и категорию расхода.'}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open → the form always starts from fresh defaults. */}
        <ExpenseForm categories={categories} expense={expense} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  categories,
  expense,
  onDone,
}: {
  categories: CategoryDto[];
  expense: ExpenseDto | undefined;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const currencies = expense && !CURRENCIES.some((c) => c === expense.currency)
    ? [...CURRENCIES, expense.currency]
    : CURRENCIES;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense?.amount ?? '',
      currency: expense?.currency ?? DEFAULT_CURRENCY,
      date: expense?.date ?? toIsoDate(new Date()),
      categoryId: expense?.categoryId ?? NO_CATEGORY,
      description: expense?.description ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    const input = {
      amount: values.amount,
      currency: values.currency,
      date: values.date,
      categoryId: values.categoryId === NO_CATEGORY ? null : values.categoryId,
      description: values.description.trim() || null,
    };
    startTransition(async () => {
      const result = expense ? await updateExpenseAction(expense.id, input) : await createExpenseAction(input);
      if (result) setServerError(result.error);
      else onDone();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="expense-amount">Сумма</FieldLabel>
            <Input
              id="expense-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              aria-invalid={!!errors.amount}
              {...register('amount')}
            />
            {errors.amount && <FieldError>Введите положительную сумму, до 2 знаков после запятой</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="expense-currency">Валюта</FieldLabel>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="expense-currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Field data-invalid={!!errors.date}>
          <FieldLabel htmlFor="expense-date">Дата</FieldLabel>
          <Input id="expense-date" type="date" aria-invalid={!!errors.date} {...register('date')} />
          {errors.date && <FieldError>Укажите дату</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="expense-category">Категория</FieldLabel>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Без категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <CategoryBadge name={category.name} color={category.color} icon={category.icon} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="expense-description">Описание</FieldLabel>
          <Input
            id="expense-description"
            autoComplete="off"
            placeholder="Необязательно"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          {errors.description && <FieldError>Не длиннее 500 символов</FieldError>}
        </Field>

        {serverError && <FieldError>{serverError}</FieldError>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

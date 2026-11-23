'use server';

import {
  type CreateExpenseInput,
  createExpenseSchema,
  type UpdateExpenseInput,
  updateExpenseSchema,
} from '@expense-tracker/shared';
import { revalidatePath } from 'next/cache';
import { type FormState, toFormError } from '@/shared/api';
import { authorizedRequest } from '@/shared/api/server';
import { ROUTES } from '@/shared/config';

const SAVE_ERRORS = {
  fallback: 'Не удалось сохранить транзакцию. Попробуйте позже',
  byStatus: {
    400: 'Проверьте данные или выбранную категорию',
    404: 'Транзакция не найдена. Обновите страницу',
  },
};

/** Resolves to `undefined` on success (the dialog closes), or `{ error }`. */
export async function createExpenseAction(input: CreateExpenseInput): Promise<FormState> {
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest('/api/expenses', { method: 'POST', body: parsed.data });
  } catch (error) {
    return toFormError(error, SAVE_ERRORS);
  }
  revalidatePath(ROUTES.transactions);
}

export async function updateExpenseAction(
  id: string,
  input: UpdateExpenseInput,
): Promise<FormState> {
  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (error) {
    return toFormError(error, SAVE_ERRORS);
  }
  revalidatePath(ROUTES.transactions);
}

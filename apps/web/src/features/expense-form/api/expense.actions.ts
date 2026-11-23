'use server';

import {
  type CreateExpenseInput,
  createExpenseSchema,
  type UpdateExpenseInput,
  updateExpenseSchema,
} from '@expense-tracker/shared';
import { revalidatePath } from 'next/cache';
import { ApiError, type FormState } from '@/shared/api';
import { authorizedRequest } from '@/shared/api/server';

function toFormError(error: unknown): FormState {
  // Anything that is not an API error (e.g. the redirect thrown on a dead session) must propagate.
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 400) return { error: 'Проверьте данные или выбранную категорию' };
  if (error.status === 404) return { error: 'Транзакция не найдена. Обновите страницу' };
  return { error: 'Не удалось сохранить транзакцию. Попробуйте позже' };
}

/** Resolves to `undefined` on success (the dialog closes), or `{ error }`. */
export async function createExpenseAction(input: CreateExpenseInput): Promise<FormState> {
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest('/api/expenses', { method: 'POST', body: parsed.data });
  } catch (error) {
    return toFormError(error);
  }
  revalidatePath('/');
}

export async function updateExpenseAction(id: string, input: UpdateExpenseInput): Promise<FormState> {
  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest(`/api/expenses/${encodeURIComponent(id)}`, { method: 'PATCH', body: parsed.data });
  } catch (error) {
    return toFormError(error);
  }
  revalidatePath('/');
}

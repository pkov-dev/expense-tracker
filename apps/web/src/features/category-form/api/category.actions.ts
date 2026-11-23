'use server';

import {
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from '@expense-tracker/shared';
import { revalidatePath } from 'next/cache';
import { ApiError, authorizedRequest, type FormState } from '@/shared/api';

function toFormError(error: unknown): FormState {
  // Anything that is not an API error (e.g. the redirect thrown on a dead session) must propagate.
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 409) return { error: 'Категория с таким названием уже есть' };
  if (error.status === 404) return { error: 'Категория не найдена. Обновите страницу' };
  return { error: 'Не удалось сохранить категорию. Попробуйте позже' };
}

// Categories show up in the sidebar-less pages, the expense list and the form selects → refresh everything.
const refresh = () => revalidatePath('/', 'layout');

export async function createCategoryAction(input: CreateCategoryInput): Promise<FormState> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest('/api/categories', { method: 'POST', body: parsed.data });
  } catch (error) {
    return toFormError(error);
  }
  refresh();
}

export async function updateCategoryAction(id: string, input: UpdateCategoryInput): Promise<FormState> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest(`/api/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: parsed.data });
  } catch (error) {
    return toFormError(error);
  }
  refresh();
}

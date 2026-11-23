'use server';

import {
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from '@expense-tracker/shared';
import { revalidatePath } from 'next/cache';
import { type FormState, toFormError } from '@/shared/api';
import { authorizedRequest } from '@/shared/api/server';

const SAVE_ERRORS = {
  fallback: 'Не удалось сохранить категорию. Попробуйте позже',
  byStatus: {
    404: 'Категория не найдена. Обновите страницу',
    409: 'Категория с таким названием уже есть',
  },
};

// Categories show up in the sidebar-less pages, the expense list and the form selects → refresh everything.
const refresh = () => revalidatePath('/', 'layout');

export async function createCategoryAction(input: CreateCategoryInput): Promise<FormState> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest('/api/categories', { method: 'POST', body: parsed.data });
  } catch (error) {
    return toFormError(error, SAVE_ERRORS);
  }
  refresh();
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput,
): Promise<FormState> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    await authorizedRequest(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (error) {
    return toFormError(error, SAVE_ERRORS);
  }
  refresh();
}

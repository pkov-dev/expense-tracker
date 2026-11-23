'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, type FormState } from '@/shared/api';
import { authorizedRequest } from '@/shared/api/server';

export async function deleteExpenseAction(id: string): Promise<FormState> {
  try {
    await authorizedRequest(`/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    // Already gone → treat as success so the list just refreshes.
    if (error.status !== 404) return { error: 'Не удалось удалить транзакцию. Попробуйте позже' };
  }
  revalidatePath('/');
}

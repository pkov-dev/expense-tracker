'use server';

import { type LoginInput, loginSchema, type AuthResponseDto } from '@expense-tracker/shared';
import { redirect } from 'next/navigation';
import { createSession } from '@/entities/session/server';
import { ApiError, apiRequest, type FormState } from '@/shared/api';

export async function loginAction(input: LoginInput): Promise<FormState> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    const auth = await apiRequest<AuthResponseDto>('/api/auth/login', {
      method: 'POST',
      body: parsed.data,
    });
    await createSession(auth);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: 'Неверный email или пароль' };
    }
    return { error: 'Не удалось выполнить вход. Попробуйте позже' };
  }

  redirect('/');
}

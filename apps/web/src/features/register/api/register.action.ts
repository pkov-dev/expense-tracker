'use server';

import { type AuthResponseDto, type RegisterInput, registerSchema } from '@expense-tracker/shared';
import { redirect } from 'next/navigation';
import { createSession } from '@/entities/session';
import { ApiError, apiRequest, type FormState } from '@/shared/api';

export async function registerAction(input: RegisterInput): Promise<FormState> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: 'Проверьте введённые данные' };

  try {
    const auth = await apiRequest<AuthResponseDto>('/api/auth/register', {
      method: 'POST',
      body: parsed.data,
    });
    await createSession(auth);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { error: 'Пользователь с таким email уже зарегистрирован' };
    }
    return { error: 'Не удалось зарегистрироваться. Попробуйте позже' };
  }

  redirect('/');
}

'use server';

import { redirect } from 'next/navigation';
import { destroySession, getRefreshToken } from '@/entities/session';
import { apiRequest } from '@/shared/api';

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    // Best effort: the local session is destroyed even if the API is unreachable.
    await apiRequest('/api/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
  await destroySession();
  redirect('/auth/login');
}

'use server';

import { redirect } from 'next/navigation';
import { endSession } from '@/entities/session/server';
import { ROUTES } from '@/shared/config';

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect(ROUTES.login);
}

import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_TOKEN_COOKIE } from '@/shared/config';
import { ApiError, apiRequest } from './client';

type RequestParams = Parameters<typeof apiRequest>[1];

/**
 * `apiRequest` with the access token from the httpOnly cookie. The proxy refreshes the token before
 * rendering, so a 401 here means the session is dead: send the user through `/auth/signout`
 * (Server Components can't delete cookies themselves).
 */
export async function authorizedRequest<T>(path: string, options: Omit<NonNullable<RequestParams>, 'accessToken'> = {}): Promise<T> {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect('/auth/signout');

  try {
    return await apiRequest<T>(path, { ...options, accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/auth/signout');
    throw error;
  }
}

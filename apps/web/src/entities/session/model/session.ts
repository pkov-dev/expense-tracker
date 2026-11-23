import 'server-only';

import type { AuthResponseDto } from '@expense-tracker/shared';
import { cookies } from 'next/headers';
import { apiRequest } from '@/shared/api';
import {
  ACCESS_COOKIE_SKEW_SECONDS,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/shared/config';
import { getJwtTtlSeconds } from '../lib/jwt';

const DEFAULT_ACCESS_TTL_SECONDS = 60 * 15;

/** Logout must not hang on a slow API: the local session is destroyed regardless. */
const LOGOUT_TIMEOUT_MS = 3_000;

/** Shared by Server Actions (via `createSession`) and the proxy (via `sessionCookies`). */
export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  } as const;
}

export function sessionCookies({ accessToken, refreshToken }: Pick<AuthResponseDto, 'accessToken' | 'refreshToken'>) {
  const ttl = getJwtTtlSeconds(accessToken) ?? DEFAULT_ACCESS_TTL_SECONDS;
  return [
    {
      name: ACCESS_TOKEN_COOKIE,
      value: accessToken,
      options: { ...cookieOptions(), maxAge: Math.max(1, ttl - ACCESS_COOKIE_SKEW_SECONDS) },
    },
    {
      name: REFRESH_TOKEN_COOKIE,
      value: refreshToken,
      options: { ...cookieOptions(), maxAge: REFRESH_TOKEN_TTL_SECONDS },
    },
  ];
}

/** Stores the API tokens in httpOnly cookies so they are never exposed to client JS. */
export async function createSession(auth: AuthResponseDto): Promise<void> {
  const store = await cookies();
  for (const { name, value, options } of sessionCookies(auth)) store.set(name, value, options);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * Logs the user out: revokes the refresh token in the API (best effort — the cookies are cleared even if
 * the API is unreachable) and deletes the session cookies.
 */
export async function endSession(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      timeoutMs: LOGOUT_TIMEOUT_MS,
    }).catch(() => undefined);
  }
  await destroySession();
}

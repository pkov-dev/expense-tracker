import type { AuthResponseDto } from '@expense-tracker/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { sessionCookies } from '@/entities/session/server';
import { ACCESS_TOKEN_COOKIE, API_URL, REFRESH_TOKEN_COOKIE, ROUTES } from '@/shared/config';

const AUTH_PREFIX = '/auth';
const REFRESH_TIMEOUT_MS = 5_000;

type RefreshResult =
  | { status: 'ok'; auth: AuthResponseDto }
  /** The API says this refresh token is dead (invalid, expired, revoked, reused): the session is over. */
  | { status: 'rejected' }
  /** The API could not answer (down, timeout, 5xx): the token may still be fine, so keep the session. */
  | { status: 'unavailable' };

async function refresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
    if (response.ok) return { status: 'ok', auth: (await response.json()) as AuthResponseDto };
    const rejected = response.status === 400 || response.status === 401 || response.status === 403;
    return { status: rejected ? 'rejected' : 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

/** No side effects: the cookies stay, so a reload after the API is back just works. */
function serviceUnavailable(): NextResponse {
  return new NextResponse('Сервис временно недоступен. Обновите страницу через несколько секунд.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '5' },
  });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (isAuthPage) {
    return refreshToken ? redirectTo(request, ROUTES.transactions) : NextResponse.next();
  }

  if (accessToken) return NextResponse.next();
  if (!refreshToken) return redirectTo(request, ROUTES.login);

  // Access cookie expired, refresh cookie still alive: rotate tokens before the page renders.
  const result = await refresh(refreshToken);
  if (result.status === 'unavailable') return serviceUnavailable();
  if (result.status === 'rejected') {
    const response = redirectTo(request, ROUTES.login);
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const cookies = sessionCookies(result.auth);
  // Make the new tokens visible to Server Components of *this* request...
  for (const { name, value } of cookies) request.cookies.set(name, value);
  const response = NextResponse.next({ request: { headers: request.headers } });
  // ...and persist them in the browser.
  for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
  return response;
}

export const config = {
  matcher: ['/((?!_next/|favicon\\.ico|terms|privacy|auth/signout|.*\\.[a-zA-Z0-9]+$).*)'],
};

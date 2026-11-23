import type { AuthResponseDto } from '@expense-tracker/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { sessionCookies } from '@/entities/session/model/session';
import { ACCESS_TOKEN_COOKIE, API_URL, REFRESH_TOKEN_COOKIE } from '@/shared/config';

const AUTH_PREFIX = '/auth';

async function refresh(refreshToken: string): Promise<AuthResponseDto | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    return response.ok ? ((await response.json()) as AuthResponseDto) : null;
  } catch {
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (isAuthPage) {
    return refreshToken ? redirectTo(request, '/') : NextResponse.next();
  }

  if (!accessToken && !refreshToken) return redirectTo(request, '/auth/login');
  if (accessToken) return NextResponse.next();

  // Access cookie expired, refresh cookie still alive: rotate tokens before the page renders.
  const auth = refreshToken ? await refresh(refreshToken) : null;
  if (!auth) {
    const response = redirectTo(request, '/auth/login');
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const cookies = sessionCookies(auth);
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

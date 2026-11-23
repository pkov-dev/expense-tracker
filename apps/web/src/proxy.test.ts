import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

const ORIGIN = 'http://localhost:3000';

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return new NextRequest(`${ORIGIN}${path}`, cookie ? { headers: { cookie } } : undefined);
}

const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh', user: { id: 'u1' } };

function stubRefresh(impl: () => Promise<Response>) {
  const mock = vi.fn<typeof fetch>(impl);
  vi.stubGlobal('fetch', mock);
  return mock;
}

const location = (response: Response) => response.headers.get('location');
const setCookies = (response: Response) => response.headers.getSetCookie();

afterEach(() => vi.unstubAllGlobals());

describe('proxy: route protection', () => {
  it('sends a visitor without cookies to the login page', async () => {
    const response = await proxy(request('/'));
    expect(location(response)).toBe(`${ORIGIN}/auth/login`);
  });

  it('lets a visitor with an access cookie through without calling the API', async () => {
    const fetchMock = stubRefresh(async () => Response.json(tokens));
    const response = await proxy(request('/categories', { access_token: 'a', refresh_token: 'r' }));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps signed-in users away from the auth pages', async () => {
    const response = await proxy(request('/auth/login', { refresh_token: 'r' }));
    expect(location(response)).toBe(`${ORIGIN}/`);
  });

  it('shows the auth pages to visitors without a session', async () => {
    const response = await proxy(request('/auth/login'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});

describe('proxy: token refresh', () => {
  it('rotates the tokens and stores them in the browser when the access cookie expired', async () => {
    const fetchMock = stubRefresh(async () => Response.json(tokens));
    const response = await proxy(request('/', { refresh_token: 'old-refresh' }));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      refreshToken: 'old-refresh',
    });
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.cookies.get('access_token')?.value).toBe('new-access');
    expect(response.cookies.get('refresh_token')?.value).toBe('new-refresh');
    expect(setCookies(response).every((cookie) => /HttpOnly/i.test(cookie))).toBe(true);
  });

  it.each([400, 401, 403])(
    'ends the session when the API rejects the token with %d',
    async (status) => {
      stubRefresh(async () => Response.json({ message: 'Invalid refresh token' }, { status }));
      const response = await proxy(request('/', { access_token: '', refresh_token: 'dead' }));

      expect(location(response)).toBe(`${ORIGIN}/auth/login`);
      expect(response.cookies.get('access_token')?.value).toBe('');
      expect(response.cookies.get('refresh_token')?.value).toBe('');
    },
  );

  // Regression: any failed refresh used to clear both cookies, so restarting the API logged everybody out.
  it.each([500, 502, 503, 504, 429, 408])(
    'keeps the session when the API answers %d',
    async (status) => {
      stubRefresh(async () => new Response(null, { status }));
      const response = await proxy(request('/', { refresh_token: 'fine' }));

      expect(response.status).toBe(503);
      expect(response.headers.get('retry-after')).toBe('5');
      expect(setCookies(response)).toEqual([]);
      expect(location(response)).toBeNull();
    },
  );

  it('keeps the session when the API is unreachable', async () => {
    stubRefresh(async () => {
      throw new TypeError('fetch failed');
    });
    const response = await proxy(request('/', { refresh_token: 'fine' }));

    expect(response.status).toBe(503);
    expect(setCookies(response)).toEqual([]);
  });

  it('keeps the session when the API times out', async () => {
    stubRefresh(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    const response = await proxy(request('/', { refresh_token: 'fine' }));

    expect(response.status).toBe(503);
    expect(setCookies(response)).toEqual([]);
  });

  it('gives the refresh call a deadline', async () => {
    const fetchMock = stubRefresh(async () => Response.json(tokens));
    await proxy(request('/', { refresh_token: 'r' }));
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});

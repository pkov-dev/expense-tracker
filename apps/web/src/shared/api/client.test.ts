import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';

const stubFetch = (impl: (...args: Parameters<typeof fetch>) => Promise<Response>) => {
  const mock = vi.fn(impl);
  vi.stubGlobal('fetch', mock);
  return mock;
};

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('returns parsed JSON', async () => {
    stubFetch(async () => Response.json({ ok: 1 }));
    await expect(apiRequest('/x')).resolves.toEqual({ ok: 1 });
  });

  it('returns undefined for 204', async () => {
    stubFetch(async () => new Response(null, { status: 204 }));
    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns an error response into an ApiError with the API message', async () => {
    stubFetch(async () =>
      Response.json({ message: 'Category with this name already exists' }, { status: 409 }),
    );
    await expect(apiRequest('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Category with this name already exists',
    });
  });

  it('ignores a non-string message (validation errors come as objects)', async () => {
    stubFetch(async () =>
      Response.json({ message: { fieldErrors: {} } }, { status: 400, statusText: 'Bad Request' }),
    );
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 400, message: 'Bad Request' });
  });

  it('sends the bearer token, the JSON body and drops empty query values', async () => {
    const fetchMock = stubFetch(async () => Response.json({}));
    await apiRequest('/items', {
      method: 'POST',
      body: { a: 1 },
      accessToken: 'tok',
      query: { page: 2, empty: '', none: undefined, nil: null, text: 'a b' },
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/items\?page=2&text=a\+b$/);
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer tok',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"a":1}');
  });

  it('gives every request a timeout signal', async () => {
    const fetchMock = stubFetch(async () => Response.json({}));
    await apiRequest('/x');
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('reports an unreachable API as 503', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed');
    });
    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503 });
  });

  it('reports a timeout as 504', async () => {
    stubFetch(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    await expect(apiRequest('/x')).rejects.toMatchObject({ name: 'ApiError', status: 504 });
  });

  it('lets unrelated errors through untouched', async () => {
    const internal = new Error('NEXT_DYNAMIC_USAGE');
    stubFetch(async () => {
      throw internal;
    });
    await expect(apiRequest('/x')).rejects.toBe(internal);
  });
});

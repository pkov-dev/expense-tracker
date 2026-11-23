import { API_URL } from '@/shared/config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | undefined | null;

/** A hung API must not hang every page render: give up after this long. */
const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  /** Appended as a query string; empty / undefined values are dropped. */
  query?: Record<string, QueryValue>;
  /** Abort the request (→ `ApiError` 504) after this many milliseconds. Defaults to 10 s. */
  timeoutMs?: number;
}

function toQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : '';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, query, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${query ? toQueryString(query) : ''}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // Unreachable API or timeout → an ApiError like any other failure. Everything else (e.g. Next's
    // internal "dynamic usage" signal) must propagate untouched.
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ApiError(504, 'API did not respond in time');
    }
    if (error instanceof TypeError) throw new ApiError(503, 'API is unavailable');
    throw error;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof payload?.message === 'string' ? payload.message : response.statusText;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

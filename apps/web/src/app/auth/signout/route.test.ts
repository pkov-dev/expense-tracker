import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const endSession = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('@/entities/session/server', () => ({ endSession }));

const signout = (headers: Record<string, string> = {}) =>
  GET(new Request('http://localhost:3000/auth/signout', { headers }));

beforeEach(() => endSession.mockClear());

describe('GET /auth/signout', () => {
  it.each([[{}], [{ 'sec-fetch-site': 'same-origin' }], [{ 'sec-fetch-site': 'none' }]])(
    'ends the session and redirects to the login page (%j)',
    async (headers) => {
      const response = await signout(headers);
      expect(endSession).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/login');
    },
  );

  // Regression: a link or <img> on another site could log the user out.
  it.each(['cross-site', 'same-site'])('refuses a request that comes from %s', async (site) => {
    const response = await signout({ 'sec-fetch-site': site });
    expect(response.status).toBe(403);
    expect(endSession).not.toHaveBeenCalled();
  });
});

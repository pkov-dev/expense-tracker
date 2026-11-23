import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import type { JwtService } from '@nestjs/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RefreshToken, User } from '../generated/prisma/client';
import { AuthService, REFRESH_REUSE_GRACE_MS } from './auth.service';
import type { RefreshTokensRepository } from './refresh-tokens.repository';

const user = {
  id: 'user-1',
  email: 'a@example.test',
  name: 'A',
  passwordHash: 'x',
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
} satisfies User;

/** Same semantics as the Prisma repository, minus the database. */
class InMemoryRefreshTokens {
  readonly rows = new Map<string, RefreshToken>();
  readonly revokeAllForUser = vi.fn(async (userId: string) => {
    for (const row of this.rows.values()) {
      if (row.userId !== userId) continue;
      row.revokedAt ??= new Date();
      row.rotatedAt = null;
    }
  });

  async create(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
    const row: RefreshToken = { ...data, revokedAt: null, rotatedAt: null, createdAt: new Date() };
    this.rows.set(row.id, row);
    return { ...row };
  }

  async findById(id: string) {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async revoke(id: string) {
    const row = this.rows.get(id);
    if (!row || row.revokedAt) return false;
    row.revokedAt = new Date();
    return true;
  }

  async rotate(id: string) {
    const row = this.rows.get(id);
    if (!row || row.revokedAt) return false;
    row.revokedAt = row.rotatedAt = new Date();
    return true;
  }
}

let tokens: InMemoryRefreshTokens;
let service: AuthService;

const idOf = (token: string) => token.split('.')[0] ?? '';

async function signIn() {
  const { refreshToken } = await service.register({
    name: user.name,
    email: user.email,
    password: 'password123',
  });
  return refreshToken;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  tokens = new InMemoryRefreshTokens();
  service = new AuthService(
    { execute: vi.fn(async () => user) } as unknown as CommandBus,
    { execute: vi.fn(async () => user) } as unknown as QueryBus,
    { publish: vi.fn() } as unknown as EventBus,
    { signAsync: vi.fn(async () => 'access-token') } as unknown as JwtService,
    { get: (_key: string, fallback: unknown) => fallback } as unknown as ConfigService,
    tokens as unknown as RefreshTokensRepository,
  );
});

afterEach(() => vi.useRealTimers());

describe('AuthService.refresh', () => {
  it('exchanges a refresh token for a new pair and retires the old token', async () => {
    const first = await signIn();
    const next = await service.refresh(first);

    expect(next.accessToken).toBe('access-token');
    expect(next.refreshToken).not.toBe(first);
    expect(tokens.rows.get(idOf(first))).toMatchObject({
      revokedAt: expect.any(Date),
      rotatedAt: expect.any(Date),
    });
    expect(tokens.rows.get(idOf(next.refreshToken))?.revokedAt).toBeNull();
    expect(tokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('keeps the rotated token chain usable', async () => {
    const first = await signIn();
    const second = (await service.refresh(first)).refreshToken;
    await expect(service.refresh(second)).resolves.toMatchObject({ accessToken: 'access-token' });
  });

  describe('replays', () => {
    // Regression: parallel requests after the access cookie expired used to log the user out.
    it('serves two simultaneous refreshes with the same token without revoking anything', async () => {
      const first = await signIn();
      const [a, b] = await Promise.all([service.refresh(first), service.refresh(first)]);

      expect(a.refreshToken).not.toBe(b.refreshToken);
      expect(tokens.revokeAllForUser).not.toHaveBeenCalled();
      // Whichever cookie the browser ends up keeping still works.
      await expect(service.refresh(a.refreshToken)).resolves.toBeDefined();
      await expect(service.refresh(b.refreshToken)).resolves.toBeDefined();
    });

    it('serves a replay right inside the grace window, including its last millisecond', async () => {
      const first = await signIn();
      await service.refresh(first);

      vi.setSystemTime(Date.now() + REFRESH_REUSE_GRACE_MS);
      await expect(service.refresh(first)).resolves.toBeDefined();
      expect(tokens.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('treats a replay after the grace window as theft and ends every session', async () => {
      const first = await signIn();
      const child = (await service.refresh(first)).refreshToken;

      vi.setSystemTime(Date.now() + REFRESH_REUSE_GRACE_MS + 1);
      await expect(service.refresh(first)).rejects.toThrow('Refresh token reuse detected');

      expect(tokens.revokeAllForUser).toHaveBeenCalledWith(user.id);
      await expect(service.refresh(child)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('treats a token revoked by logout as dead even inside the grace window', async () => {
      const first = await signIn();
      await service.logout(first);

      await expect(service.refresh(first)).rejects.toThrow('Refresh token reuse detected');
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith(user.id);
    });
  });

  describe('invalid tokens', () => {
    it('rejects a wrong secret without touching the stored token', async () => {
      const first = await signIn();
      const forged = `${idOf(first)}.not-the-secret`;

      await expect(service.refresh(forged)).rejects.toThrow('Invalid refresh token');
      expect(tokens.rows.get(idOf(first))?.revokedAt).toBeNull();
      expect(tokens.revokeAllForUser).not.toHaveBeenCalled();
    });

    it.each(['', 'no-dot', '.secret', 'id.', '00000000-0000-0000-0000-000000000000.secret'])(
      'rejects malformed or unknown token %j',
      async (token) => {
        await expect(service.refresh(token)).rejects.toThrow('Invalid refresh token');
      },
    );

    it('rejects an expired token', async () => {
      const first = await signIn();
      const row = tokens.rows.get(idOf(first));
      if (row) row.expiresAt = new Date(Date.now() - 1000);

      await expect(service.refresh(first)).rejects.toThrow('Refresh token expired');
    });
  });
});

describe('AuthService.logout', () => {
  it('revokes the token and is idempotent', async () => {
    const first = await signIn();
    await service.logout(first);
    await service.logout(first);
    await service.logout('garbage');

    const row = tokens.rows.get(idOf(first));
    expect(row?.revokedAt).toBeInstanceOf(Date);
    expect(row?.rotatedAt).toBeNull();
  });
});

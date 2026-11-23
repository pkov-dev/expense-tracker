import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AuthResponseDto, LoginInput, RegisterInput } from '@expense-tracker/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserLoggedInEvent, UserRegisteredEvent } from '../common/events';
import type { User } from '../generated/prisma/client';
import { CreateUserCommand, GetUserByEmailQuery, GetUserByIdQuery, toUserDto } from '../users';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import type { JwtPayload } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

const sha256 = (value: string) => createHash('sha256').update(value).digest();

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokensRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const user = await this.commandBus.execute(new CreateUserCommand(input.name, input.email, input.password));
    this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));
    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResponseDto> {
    const user = await this.queryBus.execute(new GetUserByEmailQuery(input.email));
    // Same error for unknown email and wrong password.
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.eventBus.publish(new UserLoggedInEvent(user.id, new Date()));
    return this.issueTokens(user);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    const { id, secret } = this.parseRefreshToken(token);
    const stored = await this.refreshTokens.findById(id);
    if (!stored || !this.secretMatches(secret, stored.tokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke atomically: if it was already revoked, the token is being reused → kill the whole family.
    const revokedNow = await this.refreshTokens.revoke(stored.id);
    if (!revokedNow) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.queryBus.execute(new GetUserByIdQuery(stored.userId));
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return this.issueTokens(user);
  }

  async logout(token: string): Promise<void> {
    let parsed: { id: string; secret: string };
    try {
      parsed = this.parseRefreshToken(token);
    } catch {
      return; // idempotent: nothing to revoke
    }
    const stored = await this.refreshTokens.findById(parsed.id);
    if (stored && this.secretMatches(parsed.secret, stored.tokenHash)) {
      await this.refreshTokens.revoke(stored.id);
    }
  }

  async me(userId: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) throw new UnauthorizedException('User no longer exists');
    return toUserDto(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);

    const id = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    const ttlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
    await this.refreshTokens.create({
      id,
      userId: user.id,
      tokenHash: sha256(secret).toString('hex'),
      expiresAt: new Date(Date.now() + ttlDays * DAY_MS),
    });

    return { accessToken, refreshToken: `${id}.${secret}`, user: toUserDto(user) };
  }

  private parseRefreshToken(token: string): { id: string; secret: string } {
    const separator = token.indexOf('.');
    if (separator <= 0 || separator === token.length - 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { id: token.slice(0, separator), secret: token.slice(separator + 1) };
  }

  private secretMatches(secret: string, storedHashHex: string): boolean {
    const expected = Buffer.from(storedHashHex, 'hex');
    const actual = sha256(secret);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

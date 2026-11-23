import { Injectable } from '@nestjs/common';
import type { RefreshToken } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  /** Revokes a single active token (logout). Returns true only if this call revoked it (atomic). */
  async revoke(id: string): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count > 0;
  }

  /**
   * Revokes an active token because it is being exchanged for a new one, and remembers when.
   * Returns true only if this call did it (atomic) — the loser of a race sees false.
   */
  async rotate(id: string): Promise<boolean> {
    const now = new Date();
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now, rotatedAt: now },
    });
    return count > 0;
  }

  /**
   * Reuse detected → end every session of the user. Also forgets `rotatedAt`, otherwise a token rotated
   * a moment ago would still pass the grace check and bring the killed session back.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, rotatedAt: { not: null } },
        data: { rotatedAt: null },
      }),
    ]);
  }
}

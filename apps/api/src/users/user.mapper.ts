import type { UserDto } from '@expense-tracker/shared';
import type { User } from '../generated/prisma/client';

/** Pure mapper: never exposes `passwordHash`. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

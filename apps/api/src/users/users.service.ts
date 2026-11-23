import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { User } from '../generated/prisma/client';
import { type CreateUserData, UsersRepository } from './users.repository';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async create({ name, email, password }: CreateUserInput): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    if (await this.users.findByEmail(normalizedEmail)) {
      throw new ConflictException('User with this email already exists');
    }

    const data: CreateUserData = {
      name,
      email: normalizedEmail,
      passwordHash: await argon2.hash(password),
    };
    try {
      return await this.users.create(data);
    } catch (error) {
      // Lost a race with a concurrent registration.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email.trim().toLowerCase());
  }

  updateLastLogin(id: string, at: Date): Promise<void> {
    return this.users.updateLastLogin(id, at);
  }
}

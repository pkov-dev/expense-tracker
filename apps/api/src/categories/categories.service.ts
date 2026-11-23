import type { CreateCategoryInput, UpdateCategoryInput } from '@expense-tracker/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Category } from '../generated/prisma/client';
import { CategoriesRepository } from './categories.repository';

const UNIQUE_VIOLATION = 'P2002';
const NOT_FOUND = 'P2025';

function isPrismaError(error: unknown, code: string): boolean {
  return (error as { code?: string }).code === code;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  async create(userId: string, input: CreateCategoryInput): Promise<Category> {
    try {
      return await this.categories.create(userId, input);
    } catch (error) {
      throw this.translate(error);
    }
  }

  findAll(userId: string): Promise<Category[]> {
    return this.categories.findAllByUser(userId);
  }

  async update(userId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
    await this.getOwned(userId, id);
    try {
      return await this.categories.update(id, userId, input);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    try {
      await this.categories.delete(id, userId);
    } catch (error) {
      throw this.translate(error);
    }
  }

  /** Foreign and missing categories are indistinguishable to the caller. */
  private async getOwned(userId: string, id: string): Promise<Category> {
    const category = await this.categories.findByIdForUser(id, userId);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private translate(error: unknown): unknown {
    if (isPrismaError(error, UNIQUE_VIOLATION)) {
      return new ConflictException('Category with this name already exists');
    }
    if (isPrismaError(error, NOT_FOUND)) {
      return new NotFoundException('Category not found');
    }
    return error;
  }
}

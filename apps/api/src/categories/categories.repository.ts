import { Injectable } from '@nestjs/common';
import type { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCategoryData {
  name: string;
  color?: string;
  icon?: string | null;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({ data: { ...data, userId } });
  }

  /** Scoped by owner in the query itself (not only by a prior lookup); throws P2025 if there is no such row. */
  update(id: string, userId: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({ where: { id, userId }, data });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.category.delete({ where: { id, userId } });
  }
}

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

  update(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}

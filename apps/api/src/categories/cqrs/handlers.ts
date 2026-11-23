import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client';
import { CategoriesRepository } from '../categories.repository';
import { GetCategoryByIdQuery } from './get-category-by-id.query';

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(private readonly categories: CategoriesRepository) {}

  execute({ id, userId }: GetCategoryByIdQuery): Promise<Category | null> {
    return this.categories.findByIdForUser(id, userId);
  }
}

export const CategoryCqrsHandlers = [GetCategoryByIdHandler];

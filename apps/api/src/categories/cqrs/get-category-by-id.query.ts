import { Query } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client';

/** Resolves a category only if it belongs to `userId` (foreign and missing ids both give `null`). */
export class GetCategoryByIdQuery extends Query<Category | null> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {
    super();
  }
}

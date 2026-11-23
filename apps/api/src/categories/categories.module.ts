import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { CategoryCqrsHandlers } from './cqrs/handlers';

/** Exports nothing: other modules reach Categories only via CommandBus / QueryBus / EventBus. */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesRepository, CategoriesService, ...CategoryCqrsHandlers],
})
export class CategoriesModule {}

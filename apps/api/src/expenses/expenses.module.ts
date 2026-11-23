import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';

/** Exports nothing: other modules reach Expenses only via CommandBus / QueryBus / EventBus. */
@Module({
  controllers: [ExpensesController],
  providers: [ExpensesRepository, ExpensesService],
})
export class ExpensesModule {}

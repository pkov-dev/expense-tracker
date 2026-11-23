import {
  type CreateExpenseInput,
  createExpenseSchema,
  type ExpenseDto,
  type ExpenseSummaryDto,
  type ExpenseSummaryQuery,
  expenseSummaryQuerySchema,
  type ListExpensesQuery,
  listExpensesQuerySchema,
  type PaginatedDto,
  type UpdateExpenseInput,
  updateExpenseSchema,
} from '@expense-tracker/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { toExpenseDto } from './expense.mapper';
import { ExpensesService } from './expenses.service';

/** Protected by the global JwtAuthGuard (no @Public()). */
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listExpensesQuerySchema)) query: ListExpensesQuery,
  ): Promise<PaginatedDto<ExpenseDto>> {
    return this.expenses.list(user.id, query);
  }

  // Declared before `:id` routes so "summary" is never treated as an id.
  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(expenseSummaryQuerySchema)) query: ExpenseSummaryQuery,
  ): Promise<ExpenseSummaryDto> {
    return this.expenses.summary(user.id, query);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput,
  ): Promise<ExpenseDto> {
    return toExpenseDto(await this.expenses.create(user.id, body));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) body: UpdateExpenseInput,
  ): Promise<ExpenseDto> {
    return toExpenseDto(await this.expenses.update(user.id, id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expenses.remove(user.id, id);
  }
}

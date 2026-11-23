import type {
  CreateExpenseInput,
  ExpenseDto,
  ExpenseSummaryDto,
  ExpenseSummaryQuery,
  ListExpensesQuery,
  PaginatedDto,
  UpdateExpenseInput,
} from '@expense-tracker/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCategoryByIdQuery } from '../categories';
import type { Expense } from '../generated/prisma/client';
import { toExpenseDto } from './expense.mapper';
import { totalsByCurrency } from './expense-totals';
import { ExpensesRepository, type UpdateExpenseData } from './expenses.repository';

const NOT_FOUND = 'P2025';
const FOREIGN_KEY_VIOLATION = 'P2003';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expenses: ExpensesRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async list(userId: string, query: ListExpensesQuery): Promise<PaginatedDto<ExpenseDto>> {
    const { page, pageSize, ...filters } = query;
    const { items, total } = await this.expenses.findPageByUser(userId, filters, (page - 1) * pageSize, pageSize);
    return {
      items: items.map(toExpenseDto),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async summary(userId: string, { from, to }: ExpenseSummaryQuery): Promise<ExpenseSummaryDto> {
    const rows = await this.expenses.summarize(userId, from, to);
    return {
      count: rows.reduce((sum, row) => sum + row.count, 0),
      totals: totalsByCurrency(rows),
      byCategory: rows,
    };
  }

  async create(userId: string, input: CreateExpenseInput): Promise<Expense> {
    await this.assertCategoryAvailable(userId, input.categoryId);
    try {
      return await this.expenses.create(userId, { ...input, date: new Date(input.date) });
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(userId: string, id: string, input: UpdateExpenseInput): Promise<Expense> {
    await this.getOwned(userId, id);
    await this.assertCategoryAvailable(userId, input.categoryId);
    const { date, ...rest } = input;
    const data: UpdateExpenseData = { ...rest, ...(date !== undefined && { date: new Date(date) }) };
    try {
      return await this.expenses.update(id, userId, data);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    try {
      await this.expenses.delete(id, userId);
    } catch (error) {
      throw this.translate(error);
    }
  }

  /** Foreign and missing expenses are indistinguishable to the caller. */
  private async getOwned(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenses.findByIdForUser(id, userId);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private async assertCategoryAvailable(userId: string, categoryId: string | null | undefined): Promise<void> {
    if (!categoryId) return;
    const category = await this.queryBus.execute(new GetCategoryByIdQuery(categoryId, userId));
    if (!category) throw new BadRequestException('Category not found');
  }

  private translate(error: unknown): unknown {
    const code = (error as { code?: string }).code;
    if (code === NOT_FOUND) return new NotFoundException('Expense not found');
    // The category was deleted between the availability check and the write.
    if (code === FOREIGN_KEY_VIOLATION) return new BadRequestException('Category not found');
    return error;
  }
}

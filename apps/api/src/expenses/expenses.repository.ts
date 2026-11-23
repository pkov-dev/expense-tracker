import { Injectable } from '@nestjs/common';
import type { Expense, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ExpenseFilters {
  categoryId?: string | undefined;
  /** Inclusive, "YYYY-MM-DD". */
  from?: string | undefined;
  to?: string | undefined;
}

export interface CreateExpenseData {
  amount: number;
  currency: string;
  description?: string | null | undefined;
  date: Date;
  categoryId?: string | null | undefined;
}

export type UpdateExpenseData = Partial<CreateExpenseData>;

export interface SummaryRow {
  categoryId: string | null;
  currency: string;
  amount: string;
  count: number;
}

const toDate = (value: string) => new Date(value);

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPageByUser(
    userId: string,
    filters: ExpenseFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Expense[]; total: number }> {
    const where = this.buildWhere(userId, filters);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total };
  }

  findByIdForUser(id: string, userId: string): Promise<Expense | null> {
    return this.prisma.expense.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: CreateExpenseData): Promise<Expense> {
    return this.prisma.expense.create({ data: { ...data, userId } });
  }

  /** Scoped by owner in the query itself (not only by a prior lookup); throws P2025 if there is no such row. */
  update(id: string, userId: string, data: UpdateExpenseData): Promise<Expense> {
    return this.prisma.expense.update({ where: { id, userId }, data });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id, userId } });
  }

  /** Per-category/currency sums for the period; currency totals are derived from these rows by the caller. */
  async summarize(userId: string, from: string, to: string): Promise<SummaryRow[]> {
    const rows = await this.prisma.expense.groupBy({
      by: ['categoryId', 'currency'],
      where: this.buildWhere(userId, { from, to }),
      _sum: { amount: true },
      _count: { _all: true },
    });
    return rows.map((row) => ({
      categoryId: row.categoryId,
      currency: row.currency,
      amount: row._sum.amount?.toFixed(2) ?? '0.00',
      count: row._count._all,
    }));
  }

  private buildWhere(userId: string, { categoryId, from, to }: ExpenseFilters): Prisma.ExpenseWhereInput {
    return {
      userId,
      ...(categoryId && { categoryId }),
      ...((from || to) && {
        date: { ...(from && { gte: toDate(from) }), ...(to && { lte: toDate(to) }) },
      }),
    };
  }
}

import { toExpensesQueryString } from '@/entities/expense';
import { ROUTES } from '@/shared/config';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination';
import { getPageItems } from '../lib/page-range';

interface Props {
  page: number;
  totalPages: number;
  filters: { categoryId?: string | undefined; from?: string | undefined; to?: string | undefined };
}

export function ExpensesPagination({ page, totalPages, filters }: Props) {
  if (totalPages <= 1) return null;
  const href = (target: number) =>
    `${ROUTES.transactions}${toExpensesQueryString(filters, target)}`;

  return (
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious href={href(page - 1)} />
          ) : (
            <PaginationPrevious
              href={href(1)}
              aria-disabled
              tabIndex={-1}
              className="pointer-events-none opacity-50"
            />
          )}
        </PaginationItem>
        {getPageItems(page, totalPages).map((item) => (
          <PaginationItem key={item} className="hidden sm:block">
            {typeof item === 'number' ? (
              <PaginationLink href={href(item)} isActive={item === page}>
                {item}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          {page < totalPages ? (
            <PaginationNext href={href(page + 1)} />
          ) : (
            <PaginationNext
              href={href(totalPages)}
              aria-disabled
              tabIndex={-1}
              className="pointer-events-none opacity-50"
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

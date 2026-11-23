export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** 1 … 4 [5] 6 … 12 — always first, last and the neighbours of the current page. */
export function getPageItems(current: number, total: number): PageItem[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);

  const items: PageItem[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push(page - previous === 2 ? previous + 1 : index === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(page);
  });
  return items;
}

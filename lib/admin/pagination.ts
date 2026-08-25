export const ADMIN_DEFAULT_PAGE_SIZE = 20;

export function parsePositivePage(value: string | null | undefined, maximum = 10_000) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : 1;
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(pageSize, 1)));
}

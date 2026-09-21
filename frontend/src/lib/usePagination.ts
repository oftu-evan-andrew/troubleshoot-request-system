import { useState } from "react";

export const PAGE_SIZE = 10;

export function usePagination<T>(items: T[] | undefined, pageSize = PAGE_SIZE) {
  const [requestedPage, setPage] = useState(1);

  const list = items ?? [];
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  // Clamped so a list that shrinks (e.g. after a delete or a poll) never
  // leaves the user on a page that no longer exists.
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageCount,
    pageSize,
    total: list.length,
    pageItems: list.slice(start, start + pageSize),
    setPage,
  };
}

import * as React from "react";

export function usePagination({ pageSize = 25, total = 0 }:{ pageSize?:number; total?:number }) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(pageSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const clampedPage = Math.min(pageCount, Math.max(1, page));
  React.useEffect(() => { if (page !== clampedPage) setPage(clampedPage); }, [page, clampedPage]);
  return {
    page: clampedPage,
    pageSize: size,
    setPage,
    setPageSize: (n:number) => { setSize(n); setPage(1); },
    pageCount,
    next: () => setPage(p => Math.min(pageCount, p + 1)),
    prev: () => setPage(p => Math.max(1, p - 1)),
  };
}

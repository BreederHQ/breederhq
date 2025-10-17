// useTableController.ts (composes the above for tables)
export function useTableController<K extends string, ID = string | number>(opts: {
  columns: Array<{ key: K; default?: boolean }>;
  storage: { columns: string; sort?: string; query?: string; filters?: string };
  total?: number;
  initialPageSize?: number;
}) {
  const sort = useSort<K>([]);
  const selection = useSelection<ID>();
  const cols = useColumns<K>(opts.columns, opts.storage.columns);
  const pager = usePagination({ pageSize: opts.initialPageSize ?? 25, total: opts.total ?? 0 });
  const query = useQueryState("", opts.storage.query, 300);
  return { sort, selection, cols, pager, query };
}

export type SortDir = "asc" | "desc";
export type SortRule = { key: string; dir: SortDir };

export function buildSortParam(
  sorts: SortRule[],
  allowedKeys: Iterable<string>
): string | undefined {
  const allow = new Set(allowedKeys);
  const parts = sorts
    .filter(s => allow.has(s.key))
    .map(s => `${s.key}:${s.dir}`);
  return parts.length ? parts.join(",") : undefined;
}

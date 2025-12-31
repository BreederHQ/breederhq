// Common shared types across all API modules
export type ID = string | number;

export interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

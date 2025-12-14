import type { ISODate } from "./types";

export function asISODateOnly(v: any): ISODate | null {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  // minimal validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s as ISODate;
}

export function normalizeCycleStartsAsc(input: any): ISODate[] {
  const raw: any[] = Array.isArray(input) ? input : [];
  const out = raw
    .map(asISODateOnly)
    .filter(Boolean) as ISODate[];
  out.sort();
  // collapse identical dates
  return out.filter((d, i) => i === 0 || d !== out[i - 1]);
}

type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | Record<string, boolean>;

export function cn(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a) continue;
    if (typeof a === "string" || typeof a === "number") out.push(String(a));
    else if (typeof a === "object") {
      for (const k in a)
        if (Object.prototype.hasOwnProperty.call(a, k) && (a as any)[k]) out.push(k);
    }
  }
  return out.join(" ");
}

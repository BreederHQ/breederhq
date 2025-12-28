/**
 * Format cents to currency string (e.g. 12345 => "$123.45")
 */
export function formatCents(cents?: number | null, currency = "USD"): string {
  if (cents == null) return "";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Format currency amount (dollars, not cents)
 */
export function formatCurrency(n?: number | null, currency = "USD"): string {
  if (n == null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

/**
 * Parse currency input string to cents (e.g. "123.45" => 12345)
 */
export function parseToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Format cents to dollars string for input (e.g. 12345 => "123.45")
 */
export function centsToInput(cents?: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

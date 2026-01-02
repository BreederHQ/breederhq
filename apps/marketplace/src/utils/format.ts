// apps/marketplace/src/utils/format.ts
// Shared formatting utilities

/**
 * Format cents to dollars display string.
 * Example: 150000 → "$1,500"
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// apps/portal/src/links.ts
// Centralized link builders for portal navigation.
// Keeps all cross-module URLs in one place for consistency.

/**
 * Build the href for viewing an invoice.
 *
 * Finance module supports URL-based deep linking via ?invoiceId=<id>.
 * When navigating to this URL, the InvoiceDetailDrawer opens automatically.
 */
export function buildInvoiceHref(invoiceId: string | number): string {
  return `/finance/invoices?invoiceId=${encodeURIComponent(String(invoiceId))}`;
}

/**
 * Navigate to invoice detail.
 * Uses window.location for cross-module navigation.
 */
export function navigateToInvoice(invoiceId: string | number): void {
  window.location.href = buildInvoiceHref(invoiceId);
}

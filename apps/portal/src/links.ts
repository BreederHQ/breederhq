// apps/portal/src/links.ts
// Centralized link builders for portal navigation.
// Keeps all cross-module URLs in one place for consistency.

/**
 * Build the href for viewing an invoice.
 *
 * Canonical behavior: The Finance module uses a drawer-based detail view
 * with no URL-based deep linking. Clicking a row in /finance/invoices
 * opens InvoiceDetailDrawer via React state, not URL params.
 *
 * Since deep linking to a specific invoice is not supported by Finance,
 * we link to the invoices list page. The user can locate their invoice there.
 *
 * If Finance adds URL param support in the future (e.g., ?invoice=:id or
 * /finance/invoices/:id), update this function to use it.
 */
export function buildInvoiceHref(_invoiceId: string | number): string {
  // Finance does not support deep linking to specific invoices.
  // Link to the invoices list page.
  return "/finance/invoices";
}

/**
 * Navigate to invoice detail.
 * Uses window.location for cross-module navigation.
 */
export function navigateToInvoice(invoiceId: string | number): void {
  window.location.href = buildInvoiceHref(invoiceId);
}

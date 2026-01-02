// apps/marketplace/src/shared/http/csrf.ts
// Pluggable CSRF token strategy.

/**
 * Function that returns CSRF headers.
 */
export type CsrfStrategy = () => Promise<Record<string, string>>;

/**
 * Default strategy: no CSRF headers.
 */
let strategy: CsrfStrategy = async () => ({});

/**
 * Set the CSRF strategy for the API client.
 * Call this at app initialization to configure CSRF handling.
 */
export function setCsrfStrategy(fn: CsrfStrategy): void {
  strategy = fn;
}

/**
 * Get CSRF headers using the configured strategy.
 */
export async function getCsrfHeaders(): Promise<Record<string, string>> {
  return strategy();
}

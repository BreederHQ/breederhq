// apps/marketplace/src/shared/http/safeJson.ts
// Defensive JSON parsing helper for API responses.

/**
 * Safely parse JSON from a Response object.
 * Returns null if parsing fails (instead of throwing).
 */
export async function safeReadJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

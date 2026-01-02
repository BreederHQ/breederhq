// apps/marketplace/src/shared/errors/userMessages.ts
// Maps API errors to user-friendly messages.

import { ApiError } from "../http/ApiError";

/**
 * Known error codes and their user-facing messages.
 */
const ERROR_MESSAGES: Record<string, string> = {
  csrf_failed: "Could not submit. Refresh and try again.",
  unauthenticated: "Please sign in to continue.",
  forbidden: "You do not have access to this.",
  not_found: "That page is not available.",
  rate_limited: "Too many requests. Try again shortly.",
  server_error: "Something went wrong. Try again.",
  network_error: "Unable to connect. Check your connection and try again.",
  request_failed: "Request failed. Try again.",
};

/**
 * Check if a message is safe to show to users.
 * Rejects messages that look like raw errors or stack traces.
 */
function isSafeMessage(msg: string): boolean {
  if (msg.length > 120) return false;
  if (msg.includes("{")) return false;
  if (msg.includes("}")) return false;
  if (msg.includes("Error:")) return false;
  if (msg.includes("at ")) return false;
  return true;
}

/**
 * Get a user-facing message from an error.
 * @param err - The error to convert.
 * @param fallback - Fallback message if no suitable message found.
 */
export function getUserFacingMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback;
  }

  // If API provided a safe message, use it
  if (err.safeMessage && isSafeMessage(err.safeMessage)) {
    return err.safeMessage;
  }

  // Map by error code
  const mapped = ERROR_MESSAGES[err.code];
  if (mapped) {
    return mapped;
  }

  return fallback;
}

// apps/marketplace/src/api/errors.ts

/**
 * Convert API errors to user-friendly messages.
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }
    // Use the error message if it's reasonably short
    if (error.message.length < 100) {
      return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

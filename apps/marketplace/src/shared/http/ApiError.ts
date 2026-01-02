// apps/marketplace/src/shared/http/ApiError.ts
// Typed error model for API failures.

/**
 * Structured error for API failures.
 * Carries status, error code, and optional safe message for users.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly safeMessage?: string;
  readonly requestId?: string;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    code: string,
    opts?: {
      safeMessage?: string;
      requestId?: string;
      isNetworkError?: boolean;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.safeMessage = opts?.safeMessage;
    this.requestId = opts?.requestId;
    this.isNetworkError = opts?.isNetworkError ?? false;
  }

  /**
   * Create ApiError from HTTP response.
   */
  static fromHttp(
    status: number,
    body: any | null,
    requestId?: string
  ): ApiError {
    // Extract code from body if present
    let code: string;
    if (body?.error && typeof body.error === "string") {
      code = body.error;
    } else {
      // Map by status
      switch (status) {
        case 401:
          code = "unauthenticated";
          break;
        case 403:
          code = "forbidden";
          break;
        case 404:
          code = "not_found";
          break;
        case 429:
          code = "rate_limited";
          break;
        default:
          if (status >= 500) {
            code = "server_error";
          } else {
            code = "request_failed";
          }
      }
    }

    // Extract safe message from body if present
    const safeMessage = body?.message ?? body?.detail ?? undefined;

    const message = `API error ${status}: ${code}`;

    return new ApiError(message, status, code, {
      safeMessage,
      requestId,
      isNetworkError: false,
    });
  }

  /**
   * Create ApiError from network failure (fetch threw).
   */
  static fromNetwork(err: unknown): ApiError {
    const message =
      err instanceof Error ? err.message : "Network request failed";

    return new ApiError(message, 0, "network_error", {
      safeMessage: "Unable to connect. Check your connection and try again.",
      isNetworkError: true,
    });
  }
}

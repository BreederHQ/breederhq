// apps/marketplace/src/shared/http/apiClient.ts
// Central HTTP client for marketplace API calls.

import { joinApi } from "./baseUrl";
import { safeReadJson } from "./safeJson";
import { getCsrfHeaders } from "./csrf";
import { ApiError } from "./ApiError";

/**
 * Response wrapper with data and status.
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Extract request ID from response headers.
 */
function getRequestId(res: Response): string | undefined {
  return (
    res.headers.get("x-request-id") ??
    res.headers.get("x-correlation-id") ??
    undefined
  );
}

/**
 * Perform a GET request to the API.
 * @throws ApiError on non-2xx response or network failure.
 */
export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const url = joinApi(path);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err) {
    throw ApiError.fromNetwork(err);
  }

  const requestId = getRequestId(res);
  const parsed = await safeReadJson(res);

  if (!res.ok) {
    throw ApiError.fromHttp(res.status, parsed, requestId);
  }

  // Return data (may be null for empty 2xx responses)
  return { data: parsed as T, status: res.status };
}

/**
 * Options for POST requests.
 */
export interface ApiPostOptions {
  /** Include CSRF headers. Default: false. */
  csrf?: boolean;
}

/**
 * Perform a POST request to the API.
 * @throws ApiError on non-2xx response or network failure.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  opts?: ApiPostOptions
): Promise<ApiResponse<T>> {
  const url = joinApi(path);

  // Build headers
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Add CSRF headers if requested
  if (opts?.csrf) {
    const csrfHeaders = await getCsrfHeaders();
    Object.assign(headers, csrfHeaders);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw ApiError.fromNetwork(err);
  }

  const requestId = getRequestId(res);
  const parsed = await safeReadJson(res);

  if (!res.ok) {
    throw ApiError.fromHttp(res.status, parsed, requestId);
  }

  // Return data (may be null for empty 2xx responses)
  return { data: parsed as T, status: res.status };
}

// apps/marketplace/src/core/hooks/usePrograms.ts
import * as React from "react";
import { apiGet } from "../../shared/http/apiClient";

/**
 * Program summary from backend PublicProgramSummaryDTO.
 */
export interface ProgramSummary {
  slug: string;
  name: string;
  location: string | null;
  species: string[];
  breed: string | null;
  photoUrl: string | null;
}

interface ProgramsResponse {
  items: ProgramSummary[];
  total: number;
}

interface UseProgramsParams {
  search: string;
  location: string;
  limit: number;
  offset: number;
}

interface UseProgramsResult {
  data: ProgramsResponse | null;
  loading: boolean;
  error: unknown | null;
  refetch: () => void;
}

/**
 * Hook to fetch programs from the marketplace API.
 * Aborts stale requests using a request counter.
 */
export function usePrograms(params: UseProgramsParams): UseProgramsResult {
  const { search, location, limit, offset } = params;

  const [data, setData] = React.useState<ProgramsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);

  // Request counter to abort stale requests
  const requestIdRef = React.useRef(0);

  const fetchPrograms = React.useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Build query string with backend param names
      const queryParams = new URLSearchParams();
      if (search.trim()) {
        queryParams.set("search", search.trim());
      }
      if (location.trim()) {
        queryParams.set("location", location.trim());
      }
      queryParams.set("limit", String(limit));
      queryParams.set("offset", String(offset));

      const queryString = queryParams.toString();
      const url = `/api/v1/marketplace/programs${queryString ? `?${queryString}` : ""}`;

      const { data: responseData } = await apiGet<ProgramsResponse>(url);

      // Only apply if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setData(responseData);
        setLoading(false);
      }
    } catch (err) {
      // Only apply error if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [search, location, limit, offset]);

  React.useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const refetch = React.useCallback(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return { data, loading, error, refetch };
}

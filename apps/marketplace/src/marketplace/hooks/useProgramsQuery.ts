// apps/marketplace/src/marketplace/hooks/useProgramsQuery.ts
import * as React from "react";
import { getPrograms } from "../../api/client";
import type { ProgramsResponse, PublicProgramSummaryDTO } from "../../api/types";

const LIMIT = 24;
const DEBOUNCE_MS = 300;

interface UseProgramsQueryParams {
  search: string;
  location: string;
  page: number;
}

interface UseProgramsQueryResult {
  data: ProgramsResponse | null;
  boostedItem: PublicProgramSummaryDTO | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProgramsQuery({
  search,
  location,
  page,
}: UseProgramsQueryParams): UseProgramsQueryResult {
  const [data, setData] = React.useState<ProgramsResponse | null>(null);
  const [boostedItem] = React.useState<PublicProgramSummaryDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Debounced values for search and location
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [debouncedLocation, setDebouncedLocation] = React.useState(location);

  // Track fetch counter to ignore stale responses
  const fetchCounterRef = React.useRef(0);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce location
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [location]);

  const fetchData = React.useCallback(async () => {
    const fetchId = ++fetchCounterRef.current;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * LIMIT;

    try {
      const result = await getPrograms({
        search: debouncedSearch || undefined,
        location: debouncedLocation || undefined,
        limit: LIMIT,
        offset,
      });

      // Ignore stale response
      if (fetchId !== fetchCounterRef.current) return;

      setData(result);
      setError(null);
    } catch (err) {
      // Ignore stale error
      if (fetchId !== fetchCounterRef.current) return;

      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // Ignore stale finally
      if (fetchId === fetchCounterRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, debouncedLocation, page]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = React.useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, boostedItem, loading, error, refetch };
}

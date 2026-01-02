// apps/marketplace/src/ui/hooks/useProgramListingsQuery.ts
import * as React from "react";
import { getProgramListings } from "../api";
import type { ListingsResponse } from "../types";

interface UseProgramListingsQueryResult {
  data: ListingsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProgramListingsQuery(
  programSlug: string
): UseProgramListingsQueryResult {
  const [data, setData] = React.useState<ListingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchCounterRef = React.useRef(0);

  const fetchData = React.useCallback(async () => {
    if (!programSlug) return;

    const fetchId = ++fetchCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await getProgramListings(programSlug);

      if (fetchId !== fetchCounterRef.current) return;

      setData(result);
      setError(null);
    } catch (err) {
      if (fetchId !== fetchCounterRef.current) return;

      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (fetchId === fetchCounterRef.current) {
        setLoading(false);
      }
    }
  }, [programSlug]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = React.useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

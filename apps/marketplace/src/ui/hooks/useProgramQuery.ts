// apps/marketplace/src/ui/hooks/useProgramQuery.ts
import * as React from "react";
import { getProgram } from "../api";
import type { PublicProgramDTO } from "../types";

interface UseProgramQueryResult {
  data: PublicProgramDTO | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProgramQuery(programSlug: string): UseProgramQueryResult {
  const [data, setData] = React.useState<PublicProgramDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchCounterRef = React.useRef(0);

  const fetchData = React.useCallback(async () => {
    if (!programSlug) return;

    const fetchId = ++fetchCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await getProgram(programSlug);

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

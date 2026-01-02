// apps/marketplace/src/marketplace/hooks/useProgramQuery.ts
import * as React from "react";
import { getProgram } from "../../api/client";
import { isDemoMode } from "../../demo/demoMode";
import { getMockProgram, simulateDelay } from "../../demo/mockData";
import type { PublicProgramDTO } from "../../api/types";

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

    // Demo mode: use mock data
    if (isDemoMode()) {
      await simulateDelay(150);
      if (fetchId !== fetchCounterRef.current) return;

      const result = getMockProgram(programSlug);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setError(new Error("Breeder not found"));
      }
      setLoading(false);
      return;
    }

    // Real API mode
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

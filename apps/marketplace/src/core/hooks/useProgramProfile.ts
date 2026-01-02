// apps/marketplace/src/core/hooks/useProgramProfile.ts
import * as React from "react";
import { apiGet } from "../../shared/http/apiClient";

/**
 * Program profile from backend PublicProgramDTO.
 */
export interface ProgramProfile {
  slug: string;
  name: string;
  bio: string | null;
  publicContactEmail: string | null;
  website: string | null;
}

interface UseProgramProfileResult {
  data: ProgramProfile | null;
  loading: boolean;
  error: unknown | null;
  refetch: () => void;
}

/**
 * Hook to fetch a program's public profile.
 */
export function useProgramProfile(programSlug: string): UseProgramProfileResult {
  const [data, setData] = React.useState<ProgramProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);

  const requestIdRef = React.useRef(0);

  const fetchProfile = React.useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const url = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}`;
      const { data: responseData } = await apiGet<ProgramProfile>(url);

      if (currentRequestId === requestIdRef.current) {
        setData(responseData);
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [programSlug]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refetch = React.useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { data, loading, error, refetch };
}

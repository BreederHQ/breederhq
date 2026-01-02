// apps/marketplace/src/core/hooks/useProgramListings.ts
import * as React from "react";
import { apiGet } from "../../shared/http/apiClient";

/**
 * Offspring group listing from backend PublicOffspringGroupListingDTO.
 */
export interface OffspringGroupListing {
  slug: string;
  title: string | null;
  description: string | null;
  species: string;
  breed: string | null;
  expectedBirthOn: string | null;
  actualBirthOn: string | null;
  countAvailable: number;
  dam: {
    name: string;
    photoUrl: string | null;
    breed: string | null;
  } | null;
  sire: {
    name: string;
    photoUrl: string | null;
    breed: string | null;
  } | null;
  coverImageUrl: string | null;
  priceRange: { min: number; max: number } | null;
  programSlug: string;
  programName: string;
}

interface ListingsResponse {
  items: OffspringGroupListing[];
  total: number;
  page: number;
  limit: number;
}

interface UseProgramListingsResult {
  data: ListingsResponse | null;
  loading: boolean;
  error: unknown | null;
  refetch: () => void;
}

/**
 * Hook to fetch a program's offspring group listings.
 */
export function useProgramListings(programSlug: string): UseProgramListingsResult {
  const [data, setData] = React.useState<ListingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);

  const requestIdRef = React.useRef(0);

  const fetchListings = React.useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const url = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups`;
      const { data: responseData } = await apiGet<ListingsResponse>(url);

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
    fetchListings();
  }, [fetchListings]);

  const refetch = React.useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  return { data, loading, error, refetch };
}

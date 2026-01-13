// apps/marketplace/src/hooks/useSavedListings.ts
// Hook for managing saved/favorited listings state

import * as React from "react";
import {
  getSavedListings,
  saveListing,
  unsaveListing,
  type SavedListingType,
  type SavedListingItem,
} from "../api/client";
import { useGateStatus } from "../gate/MarketplaceGate";

// Local cache of saved listing IDs for quick lookup
// Format: "type:id" -> true
type SavedCache = Map<string, boolean>;

function getCacheKey(type: SavedListingType, id: number | string): string {
  return `${type}:${id}`;
}

interface SavedListingsContextValue {
  savedIds: SavedCache;
  savedItems: SavedListingItem[];
  loading: boolean;
  isSaved: (type: SavedListingType, id: number | string) => boolean;
  toggleSave: (type: SavedListingType, id: number | string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SavedListingsContext = React.createContext<SavedListingsContextValue | null>(null);

/**
 * Provider component for saved listings state.
 * Wrap your app with this to enable save/favorite functionality.
 */
export function SavedListingsProvider({ children }: { children: React.ReactNode }) {
  const gateStatus = useGateStatus();
  const isAuthenticated = gateStatus?.status === "entitled" || gateStatus?.status === "not_entitled";

  const [savedIds, setSavedIds] = React.useState<SavedCache>(new Map());
  const [savedItems, setSavedItems] = React.useState<SavedListingItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch saved listings when authenticated
  const fetchSaved = React.useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Map());
      setSavedItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await getSavedListings({ limit: 100 });
      const items = response.items || [];
      setSavedItems(items);

      // Build cache of saved IDs
      const cache = new Map<string, boolean>();
      for (const item of items) {
        cache.set(getCacheKey(item.listingType, item.listingId), true);
      }
      setSavedIds(cache);
    } catch (err) {
      console.error("Failed to fetch saved listings:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  React.useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // Check if a listing is saved
  const isSaved = React.useCallback(
    (type: SavedListingType, id: number | string): boolean => {
      return savedIds.has(getCacheKey(type, id));
    },
    [savedIds]
  );

  // Toggle save/unsave
  const toggleSave = React.useCallback(
    async (type: SavedListingType, id: number | string): Promise<void> => {
      if (!isAuthenticated) {
        // Could trigger login prompt here
        console.warn("User must be authenticated to save listings");
        return;
      }

      const key = getCacheKey(type, id);
      const currentlySaved = savedIds.has(key);

      // Optimistic update
      setSavedIds((prev) => {
        const next = new Map(prev);
        if (currentlySaved) {
          next.delete(key);
        } else {
          next.set(key, true);
        }
        return next;
      });

      try {
        if (currentlySaved) {
          await unsaveListing(type, id);
          setSavedItems((prev) =>
            prev.filter((item) => !(item.listingType === type && item.listingId === Number(id)))
          );
        } else {
          await saveListing(type, id);
          // Refresh to get full listing details
          fetchSaved();
        }
      } catch (err) {
        // Revert on error
        setSavedIds((prev) => {
          const next = new Map(prev);
          if (currentlySaved) {
            next.set(key, true);
          } else {
            next.delete(key);
          }
          return next;
        });
        console.error("Failed to toggle save:", err);
      }
    },
    [isAuthenticated, savedIds, fetchSaved]
  );

  const value = React.useMemo<SavedListingsContextValue>(
    () => ({
      savedIds,
      savedItems,
      loading,
      isSaved,
      toggleSave,
      refresh: fetchSaved,
    }),
    [savedIds, savedItems, loading, isSaved, toggleSave, fetchSaved]
  );

  return (
    <SavedListingsContext.Provider value={value}>
      {children}
    </SavedListingsContext.Provider>
  );
}

/**
 * Hook to access saved listings functionality.
 * Must be used within SavedListingsProvider.
 */
export function useSavedListings(): SavedListingsContextValue {
  const context = React.useContext(SavedListingsContext);
  if (!context) {
    throw new Error("useSavedListings must be used within SavedListingsProvider");
  }
  return context;
}

/**
 * Lightweight hook to check if a specific listing is saved and toggle it.
 * Useful for individual cards that don't need the full saved list.
 */
export function useSaveButton(type: SavedListingType, id: number | string) {
  const context = React.useContext(SavedListingsContext);

  const isSaved = context?.isSaved(type, id) ?? false;
  const toggleSave = React.useCallback(async () => {
    await context?.toggleSave(type, id);
  }, [context, type, id]);

  return {
    isSaved,
    toggleSave,
    isAuthenticated: !!context,
  };
}

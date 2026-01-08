// apps/platform/src/hooks/useQuotaCheck.ts
import * as React from "react";
import { api } from "../api";

type QuotaMetric = "animals" | "contacts" | "portalUsers" | "breedingPlans" | "marketplaceListings";

type QuotaStatus = {
  current: number;
  limit: number | null;
  percentUsed: number | null;
  isOverLimit: boolean;
  canAdd: boolean;
};

type QuotaCheckResult = {
  allowed: boolean;
  status: QuotaStatus | null;
  needsUpgrade: boolean;
  warningLevel: "none" | "warning" | "critical" | "blocked";
};

const metricKeyMap: Record<QuotaMetric, string> = {
  animals: "animals",
  contacts: "contacts",
  portalUsers: "portalUsers",
  breedingPlans: "breedingPlans",
  marketplaceListings: "marketplaceListings",
};

/**
 * Hook to check quota status before allowing user actions
 *
 * @param metric - The quota metric to check
 * @returns Object with check function and loading state
 */
export function useQuotaCheck(metric: QuotaMetric) {
  const [loading, setLoading] = React.useState(false);

  const checkQuota = React.useCallback(async (): Promise<QuotaCheckResult> => {
    try {
      setLoading(true);
      const metricKey = metricKeyMap[metric];
      const response = await api.usage.getMetric(metricKey) as any;

      const { current, limit, percentUsed, isOverLimit, canAdd } = response;

      const status: QuotaStatus = {
        current,
        limit,
        percentUsed,
        isOverLimit,
        canAdd,
      };

      // Determine warning level
      let warningLevel: "none" | "warning" | "critical" | "blocked" = "none";

      if (isOverLimit || !canAdd) {
        warningLevel = "blocked";
      } else if (percentUsed !== null) {
        if (percentUsed >= 95) {
          warningLevel = "critical";
        } else if (percentUsed >= 80) {
          warningLevel = "warning";
        }
      }

      return {
        allowed: canAdd && !isOverLimit,
        status,
        needsUpgrade: !canAdd || isOverLimit,
        warningLevel,
      };
    } catch (error) {
      console.error("Failed to check quota:", error);
      // On error, allow the action (fail open)
      return {
        allowed: true,
        status: null,
        needsUpgrade: false,
        warningLevel: "none",
      };
    } finally {
      setLoading(false);
    }
  }, [metric]);

  return { checkQuota, loading };
}

/**
 * Hook to get all quota statuses on mount
 */
export function useQuotaStatus() {
  const [quotas, setQuotas] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.usage.getMetrics();
        if (!cancelled) {
          setQuotas(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load quota status");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { quotas, loading, error };
}

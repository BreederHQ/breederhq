// apps/platform/src/components/QuotaWarningBanner.tsx
import * as React from "react";
import { Button } from "@bhq/ui";
import { useQuotaStatus } from "../hooks/useQuotaCheck";
import { api } from "../api";

export default function QuotaWarningBanner() {
  const { quotas, loading } = useQuotaStatus();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [redirecting, setRedirecting] = React.useState(false);

  if (loading || !quotas) return null;

  const warnings: Array<{ metric: string; label: string; current: number; limit: number; percent: number }> = [];

  // Check each metric for warnings (90%+ usage)
  const metrics = [
    { key: "animals", label: "Animals" },
    { key: "contacts", label: "Contacts" },
    { key: "portalUsers", label: "Portal Users" },
    { key: "breedingPlans", label: "Breeding Plans" },
  ];

  for (const { key, label } of metrics) {
    const metric = quotas.usage[key];
    if (metric && metric.limit !== null && metric.percentUsed !== null && metric.percentUsed >= 90) {
      warnings.push({
        metric: key,
        label,
        current: metric.current,
        limit: metric.limit,
        percent: metric.percentUsed,
      });
    }
  }

  // Filter out dismissed warnings
  const activeWarnings = warnings.filter((w) => !dismissed.has(w.metric));

  if (activeWarnings.length === 0) return null;

  const handleDismiss = (metric: string) => {
    setDismissed((prev) => new Set([...prev, metric]));
  };

  const handleUpgrade = async () => {
    try {
      setRedirecting(true);
      const returnUrl = window.location.href;
      const result = await api.billing.createPortalSession(returnUrl) as { portalUrl: string };
      window.location.href = result.portalUrl;
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to open billing portal"}`);
      setRedirecting(false);
    }
  };

  return (
    <div className="bg-orange-500/10 border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-orange-400">
              Quota Warning{activeWarnings.length > 1 ? "s" : ""}
            </h4>
            <div className="mt-1 space-y-1">
              {activeWarnings.map((warning) => (
                <div key={warning.metric} className="flex items-center justify-between">
                  <p className="text-sm text-orange-200">
                    <strong>{warning.label}:</strong> {warning.current}/{warning.limit} ({Math.round(warning.percent)}% used)
                  </p>
                  <button
                    onClick={() => handleDismiss(warning.metric)}
                    className="ml-4 text-xs text-orange-300 hover:text-orange-100 underline"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpgrade}
            disabled={redirecting}
          >
            {redirecting ? "Opening..." : "Upgrade"}
          </Button>
        </div>
      </div>
    </div>
  );
}

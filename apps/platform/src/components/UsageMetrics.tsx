// apps/platform/src/components/UsageMetrics.tsx
import * as React from "react";
import { Card } from "@bhq/ui";
import { api } from "../api";

type UsageMetric = {
  current: number;
  limit: number | null;
  percentUsed: number | null;
  isOverLimit: boolean;
};

type UsageData = {
  plan: {
    name: string;
    features: string[];
  } | null;
  usage: Record<string, UsageMetric>;
  warnings: string[];
};

const METRIC_LABELS: Record<string, string> = {
  animals: "Animals",
  contacts: "Contacts",
  portalUsers: "Portal Users",
  breedingPlans: "Breeding Plans",
  marketplaceListings: "Marketplace Listings",
  storage: "Storage",
};

const METRIC_ICONS: Record<string, string> = {
  animals: "🐾",
  contacts: "👥",
  portalUsers: "🔐",
  breedingPlans: "📋",
  marketplaceListings: "🏪",
  storage: "💾",
};

function formatValue(key: string, value: number): string {
  if (key === "storage") {
    // Convert bytes to GB
    const gb = value / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  }
  return value.toLocaleString();
}

function getProgressColor(percentUsed: number | null, isOverLimit: boolean): string {
  if (isOverLimit) return "bg-red-500";
  if (percentUsed === null) return "bg-blue-500";
  if (percentUsed >= 95) return "bg-red-500";
  if (percentUsed >= 80) return "bg-orange-500";
  if (percentUsed >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

function getTextColor(percentUsed: number | null, isOverLimit: boolean): string {
  if (isOverLimit) return "text-red-400";
  if (percentUsed === null) return "text-blue-400";
  if (percentUsed >= 95) return "text-red-400";
  if (percentUsed >= 80) return "text-orange-400";
  if (percentUsed >= 60) return "text-yellow-400";
  return "text-green-400";
}

export default function UsageMetrics() {
  const [data, setData] = React.useState<UsageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = (await api.usage.getMetrics()) as UsageData;

        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load usage metrics");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-neutral-400">Loading usage metrics...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-500/10 border border-red-500/20">
        <div className="text-center">
          <p className="text-red-400 font-medium">Error loading usage metrics</p>
          <p className="text-sm text-red-300 mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = Object.entries(data.usage).filter(([key]) => METRIC_LABELS[key]);

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      {data.plan && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Current Plan</h3>
              <p className="text-2xl font-bold text-blue-400">{data.plan.name}</p>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upgrade Plan
            </a>
          </div>
        </Card>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <Card className="p-6 bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-orange-400 font-semibold mb-2">Usage Warnings</h4>
              <ul className="space-y-1 text-sm text-orange-300">
                {data.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Usage Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quota Usage</h3>
        <div className="space-y-6">
          {metrics.map(([key, metric]) => {
            const label = METRIC_LABELS[key];
            const icon = METRIC_ICONS[key];
            const percentUsed = metric.percentUsed ?? 0;
            const progressColor = getProgressColor(metric.percentUsed, metric.isOverLimit);
            const textColor = getTextColor(metric.percentUsed, metric.isOverLimit);

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-medium text-neutral-300">{label}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${textColor}`}>
                      {formatValue(key, metric.current)}
                      {metric.limit !== null && (
                        <span className="text-neutral-500">
                          {" "}
                          / {formatValue(key, metric.limit)}
                        </span>
                      )}
                      {metric.limit === null && (
                        <span className="text-neutral-500"> / Unlimited</span>
                      )}
                    </div>
                    {metric.percentUsed !== null && (
                      <div className="text-xs text-neutral-400">
                        {Math.round(percentUsed)}% used
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-300`}
                    style={{
                      width: metric.limit === null ? "100%" : `${Math.min(percentUsed, 100)}%`,
                    }}
                  />
                  {metric.isOverLimit && (
                    <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                  )}
                </div>

                {/* Over Limit Warning */}
                {metric.isOverLimit && (
                  <p className="text-xs text-red-400">
                    ⚠️ Quota exceeded - upgrade your plan to add more {label.toLowerCase()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Helpful Tips */}
      <Card className="p-6 bg-neutral-900/50">
        <h4 className="text-sm font-semibold text-white mb-3">💡 Quota Tips</h4>
        <ul className="space-y-2 text-xs text-neutral-400">
          <li>• You'll receive email alerts at 80%, 95%, and 100% usage</li>
          <li>• Upgrade your plan anytime to increase your quotas</li>
          <li>• Archive unused records to stay within your limits</li>
          <li>• Contact support if you need a custom enterprise plan</li>
        </ul>
      </Card>
    </div>
  );
}

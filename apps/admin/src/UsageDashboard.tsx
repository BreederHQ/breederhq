// apps/admin/src/UsageDashboard.tsx
import * as React from "react";
import { PageHeader, Card, SectionCard } from "@bhq/ui";
import { usageApi, UsageMetricsDTO } from "./api";

type UsageMetric = {
  current: number;
  limit: number | null;
  percentUsed: number | null;
  isOverLimit: boolean;
};

function UsageProgressBar({
  label,
  metric,
  unit = "",
}: {
  label: string;
  metric: UsageMetric;
  unit?: string;
}) {
  const { current, limit, percentUsed, isOverLimit } = metric;
  const percent = percentUsed ?? 0;
  const isUnlimited = limit === null;
  const isWarning = percent >= 90 && !isUnlimited;
  const isDanger = isOverLimit;

  // Determine color
  let barColor = "bg-blue-500";
  let textColor = "text-blue-400";
  if (isDanger) {
    barColor = "bg-red-500";
    textColor = "text-red-400";
  } else if (isWarning) {
    barColor = "bg-orange-500";
    textColor = "text-orange-400";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {current}
          {unit}
          {!isUnlimited && (
            <>
              {" / "}
              {limit}
              {unit}
            </>
          )}
          {isUnlimited && " (Unlimited)"}
        </span>
      </div>

      {!isUnlimited && (
        <>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {Math.round(percent)}% used
            </span>
            {isDanger && (
              <span className="text-red-400 font-medium">Over limit!</span>
            )}
            {isWarning && !isDanger && (
              <span className="text-orange-400 font-medium">
                Approaching limit
              </span>
            )}
          </div>
        </>
      )}

      {isUnlimited && (
        <div className="text-xs text-neutral-400">
          No limit - Enterprise plan
        </div>
      )}
    </div>
  );
}

function UsageWarningBanner({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <Card className="bg-orange-500/10 border border-orange-500/20">
      <div className="p-4">
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
            <h3 className="text-sm font-semibold text-orange-400 mb-2">
              Quota Warnings
            </h3>
            <ul className="space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-orange-200">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlanInfoCard({
  plan,
}: {
  plan: { name: string; tier: string } | null;
}) {
  if (!plan) return null;

  const isPro = plan.tier === "PRO";
  const isEnterprise = plan.tier === "ENTERPRISE";

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="text-sm text-neutral-400 mt-1">Current Plan</p>
          </div>
          <div>
            {isPro && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Pro
              </span>
            )}
            {isEnterprise && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Enterprise
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function UsageDashboard() {
  const [metrics, setMetrics] = React.useState<UsageMetricsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usageApi.getUsageMetrics();
        if (!cancelled) {
          setMetrics(data);
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
      <div className="p-4 space-y-4">
        <PageHeader
          title="Usage Dashboard"
          subtitle="Monitor quota usage and limits"
        />
        <Card>
          <div className="p-8 text-center text-neutral-400">
            Loading usage metrics...
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <PageHeader
          title="Usage Dashboard"
          subtitle="Monitor quota usage and limits"
        />
        <Card className="bg-red-500/10 border border-red-500/20">
          <div className="p-8 text-center">
            <p className="text-red-400 font-medium">Error: {error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 space-y-4">
        <PageHeader
          title="Usage Dashboard"
          subtitle="Monitor quota usage and limits"
        />
        <Card>
          <div className="p-8 text-center text-neutral-400">
            No usage data available
          </div>
        </Card>
      </div>
    );
  }

  const { plan, usage, warnings } = metrics;

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Usage Dashboard"
        subtitle="Monitor quota usage and limits for your subscription"
      />

      {/* Plan Info */}
      <PlanInfoCard plan={plan} />

      {/* Warnings */}
      {warnings.length > 0 && <UsageWarningBanner warnings={warnings} />}

      {/* Core Quotas */}
      <SectionCard title="Core Quotas">
        <div className="space-y-6">
          <UsageProgressBar label="Animals" metric={usage.animals} />
          <UsageProgressBar label="Contacts" metric={usage.contacts} />
          <UsageProgressBar label="Portal Users" metric={usage.portalUsers} />
          <UsageProgressBar
            label="Breeding Plans"
            metric={usage.breedingPlans}
          />
        </div>
      </SectionCard>

      {/* Additional Resources */}
      <SectionCard title="Additional Resources">
        <div className="space-y-6">
          <UsageProgressBar
            label="Marketplace Listings"
            metric={usage.marketplaceListings}
          />
          <UsageProgressBar
            label="Storage"
            metric={usage.storageGB}
            unit=" GB"
          />
          <UsageProgressBar
            label="SMS Messages"
            metric={usage.smsMessages}
            unit=" msgs"
          />
        </div>
      </SectionCard>

      {/* Help Text */}
      <Card>
        <div className="p-4 text-sm text-neutral-400">
          <p>
            Usage metrics are updated in real-time as you create, modify, or
            delete resources. Quotas are determined by your subscription plan.
            To upgrade your plan or purchase add-ons, contact support or visit
            the billing portal.
          </p>
        </div>
      </Card>
    </div>
  );
}

// apps/platform/src/components/BillingTab.tsx
import * as React from "react";
import { Card, Button, SectionCard } from "@bhq/ui";
import { api } from "../api";
import UsageMetrics from "./UsageMetrics";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

type SubscriptionData = {
  subscription: {
    id: number;
    status: SubscriptionStatus;
    product: {
      id: number;
      name: string;
      features: string[];
    };
    currentPeriodStart: string;
    currentPeriodEnd: string;
    canceledAt: string | null;
    addOns: Array<{
      id: number;
      product: {
        id: number;
        name: string;
      };
      quantity: number;
    }>;
  };
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const colors: Record<SubscriptionStatus, string> = {
    TRIAL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    PAST_DUE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CANCELED: "bg-red-500/20 text-red-400 border-red-500/30",
    INCOMPLETE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const labels: Record<SubscriptionStatus, string> = {
    TRIAL: "Trial",
    ACTIVE: "Active",
    PAST_DUE: "Past Due",
    CANCELED: "Canceled",
    INCOMPLETE: "Incomplete",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function BillingTab({ dirty, onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [subscription, setSubscription] = React.useState<SubscriptionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [portalLoading, setPortalLoading] = React.useState(false);

  // Load subscription data
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const subData = await api.billing.getSubscription() as Promise<SubscriptionData>;

        if (!cancelled) {
          setSubscription(subData);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load billing information");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const returnUrl = window.location.href;
      const result = await api.billing.createPortalSession(returnUrl) as { portalUrl: string };

      // Redirect to Stripe Customer Portal
      window.location.href = result.portalUrl;
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to open billing portal"}`);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-8">
          <div className="text-center text-neutral-400">Loading billing information...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-8 bg-red-500/10 border border-red-500/20">
          <div className="text-center">
            <p className="text-red-400 font-medium">Error loading billing information</p>
            <p className="text-sm text-red-300 mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <Card className="p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
            <p className="text-neutral-400 mb-4">You don't have an active subscription yet.</p>
            <Button variant="primary">Choose a Plan</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { subscription: sub } = subscription;
  const isPastDue = sub.status === "PAST_DUE";
  const isCanceled = sub.status === "CANCELED";
  const isScheduledForCancellation = sub.canceledAt && sub.status === "ACTIVE";

  return (
    <div className="space-y-4">
      {/* Warning for past due */}
      {isPastDue && (
        <Card className="p-4 bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-orange-400">Payment Past Due</h4>
              <p className="text-sm text-orange-200 mt-1">
                Your payment is overdue. Please update your payment method to continue using the service.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Warning for scheduled cancellation */}
      {isScheduledForCancellation && (
        <Card className="p-4 bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-yellow-400">Subscription Scheduled for Cancellation</h4>
              <p className="text-sm text-yellow-200 mt-1">
                Your subscription will be canceled on {formatDate(sub.currentPeriodEnd)}. You can reactivate it anytime before then.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Current Plan */}
      <SectionCard title="Current Plan">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{sub.product.name}</h3>
              <div className="mt-2">
                <StatusBadge status={sub.status} />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Current Period</p>
              <p className="text-sm text-white mt-1">
                {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
              </p>
            </div>
            {sub.canceledAt && (
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Canceled On</p>
                <p className="text-sm text-white mt-1">{formatDate(sub.canceledAt)}</p>
              </div>
            )}
          </div>

          {/* Features */}
          {sub.product.features && sub.product.features.length > 0 && (
            <div className="pt-4 border-t border-neutral-800">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Plan Features</p>
              <ul className="space-y-2">
                {sub.product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Add-ons */}
      {sub.addOns && sub.addOns.length > 0 && (
        <SectionCard title="Add-ons">
          <div className="space-y-3">
            {sub.addOns.map((addOn) => (
              <div key={addOn.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{addOn.product.name}</p>
                  <p className="text-xs text-neutral-400">Quantity: {addOn.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Usage Metrics - Comprehensive quota and usage display */}
      <UsageMetrics />
    </div>
  );
}

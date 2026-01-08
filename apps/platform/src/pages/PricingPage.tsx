// apps/platform/src/pages/PricingPage.tsx
import * as React from "react";
import { Button, Card, SectionCard } from "@bhq/ui";
import { api } from "../api";

type BillingInterval = "monthly" | "yearly";

type Plan = {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  tier: string;
  features: string[];
  quotas: Record<string, number | null>;
  stripePriceId: string;
  stripeYearlyPriceId: string | null;
};

const QUOTA_LABELS: Record<string, string> = {
  ANIMAL_QUOTA: "Animals",
  CONTACT_QUOTA: "Contacts",
  PORTAL_USER_QUOTA: "Portal Users",
  BREEDING_PLAN_QUOTA: "Breeding Plans",
  MARKETPLACE_LISTING_QUOTA: "Marketplace Listings",
  STORAGE_QUOTA_GB: "Storage (GB)",
  SMS_QUOTA: "SMS Messages/month",
};

export default function PricingPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [billingInterval, setBillingInterval] = React.useState<BillingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = React.useState<number | null>(null);
  const [showComparison, setShowComparison] = React.useState(false);

  // Load plans
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = (await api.billing.getPlans()) as { plans: Plan[] };

        if (!cancelled) {
          setPlans(data.plans);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load pricing plans");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChoosePlan = async (planId: number) => {
    try {
      setCheckoutLoading(planId);
      const successUrl = `${window.location.origin}/settings?tab=billing&success=true`;
      const cancelUrl = window.location.href;

      const result = (await api.billing.createCheckoutSession(
        planId,
        successUrl,
        cancelUrl
      )) as { checkoutUrl: string };

      // Redirect to Stripe Checkout
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to start checkout"}`);
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card className="p-8">
          <div className="text-center text-neutral-400">Loading pricing plans...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card className="p-8 bg-red-500/10 border border-red-500/20">
          <div className="text-center">
            <p className="text-red-400 font-medium">Error loading pricing plans</p>
            <p className="text-sm text-red-300 mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const getPrice = (plan: Plan) => {
    if (billingInterval === "yearly") {
      return plan.priceYearly || plan.priceMonthly * 10; // Fallback to 10x monthly
    }
    return plan.priceMonthly;
  };

  const getMonthlySavings = (plan: Plan) => {
    if (!plan.priceYearly) return 0;
    const yearlyMonthly = plan.priceYearly / 12;
    return plan.priceMonthly - yearlyMonthly;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
        <p className="text-lg text-neutral-300 mb-8">
          Select the perfect plan for your breeding operation
        </p>

        {/* Billing Interval Toggle */}
        <div className="inline-flex items-center bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingInterval === "monthly"
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingInterval === "yearly"
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const savings = getMonthlySavings(plan);
          const isPopular = plan.tier === "PROFESSIONAL";

          return (
            <Card
              key={plan.id}
              className={`p-8 relative ${
                isPopular ? "border-2 border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-neutral-400 text-sm mb-4">{plan.description}</p>

                <div className="mb-2">
                  <span className="text-5xl font-bold text-white">
                    ${billingInterval === "yearly" ? (price / 12).toFixed(0) : price.toFixed(0)}
                  </span>
                  <span className="text-neutral-400 text-lg">/month</span>
                </div>

                {billingInterval === "yearly" && savings > 0 && (
                  <p className="text-sm text-green-400">
                    Save ${savings.toFixed(0)}/month
                  </p>
                )}

                {billingInterval === "yearly" && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Billed ${price.toFixed(0)}/year
                  </p>
                )}
              </div>

              <Button
                variant={isPopular ? "primary" : "secondary"}
                className="w-full mb-6"
                onClick={() => handleChoosePlan(plan.id)}
                disabled={checkoutLoading === plan.id}
              >
                {checkoutLoading === plan.id ? "Loading..." : "Choose Plan"}
              </Button>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                  Features
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Quotas */}
              <div className="pt-6 border-t border-neutral-800">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3">
                  Quotas
                </p>
                <div className="space-y-2">
                  {Object.entries(plan.quotas).map(([key, value]) => {
                    const label = QUOTA_LABELS[key] || key;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">{label}</span>
                        <span className="text-white font-medium">
                          {value === null ? "Unlimited" : value.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Compare Plans Button */}
      <div className="text-center mb-12">
        <Button
          variant="secondary"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? "Hide Comparison" : "Compare All Plans"}
        </Button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <Card className="p-8 mb-12 overflow-x-auto">
          <h3 className="text-2xl font-bold text-white mb-6">Plan Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-4 px-4 text-neutral-400 font-semibold">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-4 px-4">
                    <div className="text-white font-bold text-lg">{plan.name}</div>
                    <div className="text-neutral-400 text-xs mt-1">
                      ${billingInterval === "yearly" ? (getPrice(plan) / 12).toFixed(0) : getPrice(plan).toFixed(0)}/mo
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Pricing */}
              <tr className="border-b border-neutral-800">
                <td className="py-3 px-4 text-neutral-300 font-medium">Price</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="py-3 px-4 text-center">
                    <div className="text-white font-semibold">
                      ${billingInterval === "yearly" ? (getPrice(plan) / 12).toFixed(0) : getPrice(plan).toFixed(0)}/mo
                    </div>
                    {billingInterval === "yearly" && (
                      <div className="text-xs text-neutral-500">
                        ${getPrice(plan).toFixed(0)}/year
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Quotas */}
              {Object.keys(QUOTA_LABELS).map((quotaKey) => {
                const label = QUOTA_LABELS[quotaKey];
                return (
                  <tr key={quotaKey} className="border-b border-neutral-800">
                    <td className="py-3 px-4 text-neutral-300">{label}</td>
                    {plans.map((plan) => {
                      const value = plan.quotas[quotaKey];
                      return (
                        <td key={plan.id} className="py-3 px-4 text-center text-white font-medium">
                          {value === null || value === undefined ? (
                            <span className="text-neutral-600">-</span>
                          ) : value === 0 ? (
                            <span className="text-green-400">Unlimited</span>
                          ) : (
                            value.toLocaleString()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Features - Show all unique features */}
              {Array.from(new Set(plans.flatMap((p) => p.features))).map((feature) => (
                <tr key={feature} className="border-b border-neutral-800">
                  <td className="py-3 px-4 text-neutral-300">{feature}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="py-3 px-4 text-center">
                      {plan.features.includes(feature) ? (
                        <svg
                          className="w-5 h-5 text-green-500 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-neutral-700 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Action Row */}
              <tr>
                <td className="py-6 px-4"></td>
                {plans.map((plan) => (
                  <td key={plan.id} className="py-6 px-4 text-center">
                    <Button
                      variant={plan.tier === "PROFESSIONAL" ? "primary" : "secondary"}
                      onClick={() => handleChoosePlan(plan.id)}
                      disabled={checkoutLoading === plan.id}
                      className="w-full"
                    >
                      {checkoutLoading === plan.id ? "Loading..." : "Choose Plan"}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* FAQ Section */}
      <SectionCard title="Frequently Asked Questions">
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-semibold mb-2">Can I change plans later?</h4>
            <p className="text-neutral-400 text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">What happens if I exceed my quota?</h4>
            <p className="text-neutral-400 text-sm">
              You'll receive email notifications at 80%, 95%, and 100% usage. Once you reach
              your limit, you'll need to upgrade to continue adding new records.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Can I cancel anytime?</h4>
            <p className="text-neutral-400 text-sm">
              Yes, you can cancel your subscription at any time. Your access will continue
              until the end of your current billing period.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Do you offer refunds?</h4>
            <p className="text-neutral-400 text-sm">
              We offer a 30-day money-back guarantee. If you're not satisfied, contact us
              for a full refund.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

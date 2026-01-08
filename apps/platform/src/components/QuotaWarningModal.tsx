// apps/platform/src/components/QuotaWarningModal.tsx
import * as React from "react";
import { Button, Card } from "@bhq/ui";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { api } from "../api";

type QuotaWarningLevel = "warning" | "critical" | "blocked";

type QuotaWarningModalProps = {
  open: boolean;
  onClose: () => void;
  onProceed?: () => void;
  metric: string;
  metricLabel: string;
  current: number;
  limit: number;
  percentUsed: number;
  warningLevel: QuotaWarningLevel;
};

export default function QuotaWarningModal({
  open,
  onClose,
  onProceed,
  metric,
  metricLabel,
  current,
  limit,
  percentUsed,
  warningLevel,
}: QuotaWarningModalProps) {
  const [redirecting, setRedirecting] = React.useState(false);

  if (!open) return null;

  const isBlocked = warningLevel === "blocked";
  const isCritical = warningLevel === "critical";
  const isWarning = warningLevel === "warning";

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

  const handleProceedAnyway = () => {
    if (onProceed) {
      onProceed();
    }
    onClose();
  };

  const iconColor = isBlocked
    ? "text-red-500"
    : isCritical
    ? "text-orange-500"
    : "text-yellow-500";

  const titleColor = isBlocked
    ? "text-red-400"
    : isCritical
    ? "text-orange-400"
    : "text-yellow-400";

  const title = isBlocked
    ? `${metricLabel} Quota Exceeded`
    : isCritical
    ? `${metricLabel} Quota Almost Full`
    : `${metricLabel} Quota Warning`;

  const message = isBlocked
    ? `You've reached your limit of ${limit} ${metricLabel.toLowerCase()}. To add more, please upgrade your plan.`
    : isCritical
    ? `You're using ${Math.round(percentUsed)}% of your ${metricLabel.toLowerCase()} quota (${current}/${limit}). Consider upgrading soon.`
    : `You're using ${Math.round(percentUsed)}% of your ${metricLabel.toLowerCase()} quota (${current}/${limit}). You may want to upgrade before reaching the limit.`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isBlocked ? undefined : onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 p-6 space-y-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-4">
          <svg
            className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isBlocked ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${titleColor}`}>{title}</h3>
            <p className="text-sm text-neutral-300 mt-2">{message}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isBlocked
                  ? "bg-red-500"
                  : isCritical
                  ? "bg-orange-500"
                  : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-neutral-400">
              {current} / {limit} {metricLabel.toLowerCase()}
            </span>
            <span className="text-xs text-neutral-400">
              {Math.round(percentUsed)}% used
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleUpgrade}
            disabled={redirecting}
            className="flex-1"
          >
            {redirecting ? "Opening..." : "Upgrade Plan"}
          </Button>
          {!isBlocked && onProceed && (
            <Button
              variant="secondary"
              onClick={handleProceedAnyway}
              className="flex-1"
            >
              Continue Anyway
            </Button>
          )}
          {!isBlocked && !onProceed && (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </Card>
    </div>,
    getOverlayRoot()
  );
}

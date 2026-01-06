// apps/marketplace/src/marketplace/components/ReportBreederModal.tsx
// Modal for marketplace users to report a breeder for misconduct

import * as React from "react";
import {
  reportBreeder,
  type BreederReportReason,
  type BreederReportSeverity,
} from "../../api/client";

/* ───────────────────────────────────────────────────────────────────────────
 * Report Reason Options
 * ─────────────────────────────────────────────────────────────────────────── */

const REPORT_REASONS: Array<{
  value: BreederReportReason;
  label: string;
  description: string;
}> = [
  {
    value: "SPAM",
    label: "Spam",
    description: "Excessive unsolicited messages or promotional content",
  },
  {
    value: "FRAUD",
    label: "Fraud / Scam",
    description: "Deceptive practices, fake listings, or scam behavior",
  },
  {
    value: "HARASSMENT",
    label: "Harassment",
    description: "Abusive, threatening, or inappropriate communication",
  },
  {
    value: "MISREPRESENTATION",
    label: "Misrepresentation",
    description: "False claims about animals, credentials, or business",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other policy violation (please describe below)",
  },
];

const SEVERITY_OPTIONS: Array<{
  value: BreederReportSeverity;
  label: string;
  description: string;
}> = [
  {
    value: "LIGHT",
    label: "Minor",
    description: "One-time or minor issue",
  },
  {
    value: "MEDIUM",
    label: "Moderate",
    description: "Repeated issues or concerning pattern",
  },
  {
    value: "HEAVY",
    label: "Severe",
    description: "Serious violation requiring immediate attention",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 * ReportBreederModal Component
 * ─────────────────────────────────────────────────────────────────────────── */

export interface ReportBreederModalProps {
  /** Provide either breederTenantId OR breederTenantSlug */
  breederTenantId?: number;
  breederTenantSlug?: string;
  breederName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ReportBreederModal({
  breederTenantId,
  breederTenantSlug,
  breederName,
  onClose,
  onSubmitted,
}: ReportBreederModalProps) {
  const [reason, setReason] = React.useState<BreederReportReason | null>(null);
  const [severity, setSeverity] = React.useState<BreederReportSeverity>("MEDIUM");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason) {
      setError("Please select a reason for your report.");
      return;
    }

    if (!breederTenantId && !breederTenantSlug) {
      setError("Unable to identify breeder. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reportBreeder({
        breederTenantId,
        breederTenantSlug,
        reason,
        severity,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: any) {
      console.error("Failed to submit report:", err);
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Report Submitted
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Thank you for your report. Our team will review it and take appropriate action.
              We may contact you if we need additional information.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Report Breeder
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Report <strong className="text-neutral-900 dark:text-white">{breederName}</strong> for
            violating our community guidelines.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
            {/* Reason Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                Reason for Report <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReason(opt.value)}
                    className={[
                      "w-full text-left p-3 rounded-lg border transition-all",
                      reason === opt.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
                    ].join(" ")}
                  >
                    <div className="font-medium text-sm text-neutral-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={[
                      "p-2 rounded-lg border text-center transition-all",
                      severity === opt.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
                    ].join(" ")}
                  >
                    <div className="font-medium text-sm text-neutral-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                Additional Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide specific details about the issue (optional but helpful)..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
              />
            </div>

            {/* Info Banner */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your report will be reviewed by our team. We take all reports seriously
                and will investigate thoroughly. The breeder will not be notified of who
                submitted the report.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * ReportBreederButton Component - Simple trigger button
 * ─────────────────────────────────────────────────────────────────────────── */

export interface ReportBreederButtonProps {
  /** Provide either breederTenantId OR breederTenantSlug */
  breederTenantId?: number;
  breederTenantSlug?: string;
  breederName: string;
  variant?: "text" | "icon" | "button";
  className?: string;
}

export function ReportBreederButton({
  breederTenantId,
  breederTenantSlug,
  breederName,
  variant = "text",
  className = "",
}: ReportBreederButtonProps) {
  const [showModal, setShowModal] = React.useState(false);

  const baseClasses = "transition-colors";

  const variantClasses = {
    text: "text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400",
    icon: "p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded",
    button:
      "px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={[baseClasses, variantClasses[variant], className].filter(Boolean).join(" ")}
        title="Report this breeder"
      >
        {variant === "icon" ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          </svg>
        ) : (
          "Report"
        )}
      </button>

      {showModal && (
        <ReportBreederModal
          breederTenantId={breederTenantId}
          breederTenantSlug={breederTenantSlug}
          breederName={breederName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default ReportBreederModal;

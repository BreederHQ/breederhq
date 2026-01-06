// apps/admin/src/BreederReportsAdmin.tsx
// Admin dashboard for managing breeder reports from marketplace users

import * as React from "react";
import {
  breederReportsApi,
  type BreederFlaggedDTO,
  type BreederReportDTO,
  type BreederReportDetailDTO,
  type BreederReportSettingsDTO,
} from "./api";
import { Card, SectionCard, Button, SearchBar } from "@bhq/ui";
import { toast } from "@bhq/ui/atoms/Toast";

/* ───────────────────────────────────────────────────────────────────────────
 * Column definitions
 * ─────────────────────────────────────────────────────────────────────────── */

const FLAGGED_COLUMNS = [
  { key: "businessName", label: "Business", default: true },
  { key: "email", label: "Email", default: true },
  { key: "totalReports", label: "Total Reports", default: true },
  { key: "pendingReports", label: "Pending", default: true },
  { key: "reportBreakdown", label: "L/M/H", default: true },
  { key: "status", label: "Status", default: true },
  { key: "flaggedAt", label: "Flagged", default: true },
];

/* ───────────────────────────────────────────────────────────────────────────
 * Date formatting helpers
 * ─────────────────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ───────────────────────────────────────────────────────────────────────────
 * Status Badges
 * ─────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ flag }: { flag: BreederFlaggedDTO }) {
  if (flag.marketplaceSuspendedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        Suspended
      </span>
    );
  }
  if (flag.warningIssuedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
        Warning Issued
      </span>
    );
  }
  if (flag.flaggedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
        Flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
      Normal
    </span>
  );
}

function SeverityBadge({ level }: { level: "LIGHT" | "MEDIUM" | "HEAVY" }) {
  const classes = {
    LIGHT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    MEDIUM: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    HEAVY: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[level]}`}>
      {level}
    </span>
  );
}

function ReasonBadge({ reason }: { reason: BreederReportDTO["reason"] }) {
  const labels: Record<BreederReportDTO["reason"], string> = {
    SPAM: "Spam",
    FRAUD: "Fraud",
    HARASSMENT: "Harassment",
    MISREPRESENTATION: "Misrepresentation",
    OTHER: "Other",
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400">
      {labels[reason]}
    </span>
  );
}

function ReportStatusBadge({ status }: { status: BreederReportDTO["status"] }) {
  const classes: Record<BreederReportDTO["status"], string> = {
    PENDING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    REVIEWED: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    DISMISSED: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
    ACTIONED: "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status]}`}>
      {status}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * Flagged Breeders Tab
 * ─────────────────────────────────────────────────────────────────────────── */

function FlaggedBreedersTab({ onSelectBreeder }: { onSelectBreeder: (tenantId: number) => void }) {
  const [rows, setRows] = React.useState<BreederFlaggedDTO[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [showFlaggedOnly, setShowFlaggedOnly] = React.useState(false);
  const [showWarningOnly, setShowWarningOnly] = React.useState(false);
  const [showSuspendedOnly, setShowSuspendedOnly] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await breederReportsApi.listFlaggedBreeders({
        q: q || undefined,
        flaggedOnly: showFlaggedOnly,
        warningOnly: showWarningOnly,
        suspendedOnly: showSuspendedOnly,
        page,
        limit: 25,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load breeders");
    }
    setLoading(false);
  }, [q, page, showFlaggedOnly, showWarningOnly, showSuspendedOnly]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Filter rows by search (client-side for responsiveness)
  const filteredRows = q.trim()
    ? rows.filter(
        (r) =>
          r.tenant.name.toLowerCase().includes(q.toLowerCase()) ||
          (r.tenant.primaryEmail?.toLowerCase().includes(q.toLowerCase()) ?? false)
      )
    : rows;

  return (
    <Card>
      {/* Toolbar */}
      <div className="p-4 border-b border-hairline space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by business name or email..."
            widthPx={300}
          />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showFlaggedOnly}
                onChange={(e) => {
                  setShowFlaggedOnly(e.target.checked);
                  if (e.target.checked) {
                    setShowWarningOnly(false);
                    setShowSuspendedOnly(false);
                  }
                }}
                className="rounded border-hairline"
              />
              Flagged only
            </label>
            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showWarningOnly}
                onChange={(e) => {
                  setShowWarningOnly(e.target.checked);
                  if (e.target.checked) {
                    setShowFlaggedOnly(false);
                    setShowSuspendedOnly(false);
                  }
                }}
                className="rounded border-hairline"
              />
              Warning issued
            </label>
            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showSuspendedOnly}
                onChange={(e) => {
                  setShowSuspendedOnly(e.target.checked);
                  if (e.target.checked) {
                    setShowFlaggedOnly(false);
                    setShowWarningOnly(false);
                  }
                }}
                className="rounded border-hairline"
              />
              Suspended only
            </label>
          </div>

          <button
            type="button"
            onClick={load}
            className="text-xs text-secondary hover:text-primary transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="text-xs text-secondary">
          {total} reported breeder{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface">
              {FLAGGED_COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={FLAGGED_COLUMNS.length} className="px-4 py-12 text-center text-secondary">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={FLAGGED_COLUMNS.length} className="px-4 py-12 text-center text-red-500">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filteredRows.length === 0 && (
              <tr>
                <td colSpan={FLAGGED_COLUMNS.length} className="px-4 py-12 text-center text-secondary">
                  No reported breeders found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectBreeder(row.breederTenantId)}
                  className="border-b border-hairline hover:bg-surface cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{row.tenant.name}</td>
                  <td className="px-4 py-3 text-secondary">{row.tenant.primaryEmail || "—"}</td>
                  <td className="px-4 py-3">{row.totalReports}</td>
                  <td className="px-4 py-3">
                    {row.pendingReports > 0 ? (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">{row.pendingReports}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-600">{row.lightReports}</span>
                    <span className="text-secondary mx-1">/</span>
                    <span className="text-orange-600">{row.mediumReports}</span>
                    <span className="text-secondary mx-1">/</span>
                    <span className="text-red-600">{row.heavyReports}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge flag={row} />
                  </td>
                  <td className="px-4 py-3 text-secondary">{fmtDate(row.flaggedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="p-4 border-t border-hairline flex items-center justify-between">
          <span className="text-xs text-secondary">
            Page {page} of {Math.ceil(total / 25)}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 25)} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * Breeder Detail Modal
 * ─────────────────────────────────────────────────────────────────────────── */

function BreederDetailModal({
  tenantId,
  onClose,
  onActionComplete,
}: {
  tenantId: number;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [detail, setDetail] = React.useState<BreederReportDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Warning/suspend inputs
  const [showWarningInput, setShowWarningInput] = React.useState(false);
  const [warningNote, setWarningNote] = React.useState("");
  const [showSuspendInput, setShowSuspendInput] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await breederReportsApi.getBreederReports(tenantId);
      setDetail(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load breeder details");
    }
    setLoading(false);
  }, [tenantId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Actions
  const handleClearFlag = async () => {
    setActionLoading("clear");
    try {
      await breederReportsApi.clearBreederFlag(tenantId);
      toast.success("Flag cleared successfully");
      onActionComplete();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear flag");
    }
    setActionLoading(null);
  };

  const handleIssueWarning = async () => {
    if (!warningNote.trim()) {
      toast.error("Please provide a warning note");
      return;
    }
    setActionLoading("warn");
    try {
      await breederReportsApi.warnBreeder(tenantId, warningNote);
      toast.success("Warning issued successfully");
      setShowWarningInput(false);
      setWarningNote("");
      onActionComplete();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to issue warning");
    }
    setActionLoading(null);
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }
    setActionLoading("suspend");
    try {
      await breederReportsApi.suspendBreederMarketplace(tenantId, suspendReason);
      toast.success("Marketplace listing suspended successfully");
      setShowSuspendInput(false);
      setSuspendReason("");
      onActionComplete();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to suspend listing");
    }
    setActionLoading(null);
  };

  const handleUnsuspend = async () => {
    setActionLoading("unsuspend");
    try {
      await breederReportsApi.unsuspendBreederMarketplace(tenantId);
      toast.success("Marketplace listing restored successfully");
      onActionComplete();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore listing");
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-surface border border-hairline rounded-xl shadow-2xl p-8">
          <div className="animate-pulse">Loading breeder details...</div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-surface border border-hairline rounded-xl shadow-2xl p-8">
          <div className="text-red-500">{error || "Failed to load details"}</div>
          <Button variant="secondary" size="sm" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const { flag, reports } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold">{flag.tenant.name}</h3>
            <p className="text-sm text-secondary">{flag.tenant.primaryEmail || "No email"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banners */}
          {flag.marketplaceSuspendedAt && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Marketplace Listing Suspended</span>
              </div>
              <p className="text-sm text-secondary mt-1">
                Suspended on {fmtDateTime(flag.marketplaceSuspendedAt)}
              </p>
              {flag.suspendedReason && (
                <p className="text-sm text-secondary mt-1">Reason: {flag.suspendedReason}</p>
              )}
            </div>
          )}

          {flag.warningIssuedAt && !flag.marketplaceSuspendedAt && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Warning Issued</span>
              </div>
              <p className="text-sm text-secondary mt-1">
                Issued on {fmtDateTime(flag.warningIssuedAt)}
              </p>
              {flag.warningNote && (
                <p className="text-sm text-secondary mt-1">Note: {flag.warningNote}</p>
              )}
            </div>
          )}

          {flag.flaggedAt && !flag.warningIssuedAt && !flag.marketplaceSuspendedAt && (
            <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="font-medium">Flagged for Review</span>
              </div>
              <p className="text-sm text-secondary mt-1">
                Flagged on {fmtDateTime(flag.flaggedAt)}
              </p>
              {flag.flagReason && (
                <p className="text-sm text-secondary mt-1">Reason: {flag.flagReason}</p>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1">Total Reports</div>
              <div className="text-lg font-semibold">{flag.totalReports}</div>
            </div>
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1">Pending</div>
              <div className="text-lg font-semibold text-orange-600">{flag.pendingReports}</div>
            </div>
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1">By Severity</div>
              <div className="text-sm">
                <span className="text-yellow-600">{flag.lightReports}L</span>
                <span className="text-secondary mx-1">/</span>
                <span className="text-orange-600">{flag.mediumReports}M</span>
                <span className="text-secondary mx-1">/</span>
                <span className="text-red-600">{flag.heavyReports}H</span>
              </div>
            </div>
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1">Status</div>
              <StatusBadge flag={flag} />
            </div>
          </div>

          {/* Report History */}
          <SectionCard title="Report History">
            {reports.length === 0 ? (
              <div className="p-4 text-sm text-secondary text-center">No reports found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-secondary">Reporter</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-secondary">Reason</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-secondary">Severity</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-secondary">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-secondary">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b border-hairline last:border-0">
                        <td className="px-4 py-2 text-secondary">{report.reporterUserIdMasked}</td>
                        <td className="px-4 py-2">
                          <ReasonBadge reason={report.reason} />
                        </td>
                        <td className="px-4 py-2">
                          <SeverityBadge level={report.severity} />
                        </td>
                        <td className="px-4 py-2">
                          <ReportStatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-2 text-secondary">{fmtDate(report.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Warning Input */}
          {showWarningInput && !flag.marketplaceSuspendedAt && (
            <SectionCard title="Issue Warning">
              <div className="p-4 space-y-3">
                <textarea
                  value={warningNote}
                  onChange={(e) => setWarningNote(e.target.value)}
                  placeholder="Enter warning note..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowWarningInput(false);
                      setWarningNote("");
                    }}
                    disabled={actionLoading === "warn"}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleIssueWarning}
                    disabled={actionLoading === "warn" || !warningNote.trim()}
                  >
                    {actionLoading === "warn" ? "Issuing..." : "Issue Warning"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Suspend Input */}
          {showSuspendInput && !flag.marketplaceSuspendedAt && (
            <SectionCard title="Suspend Marketplace Listing">
              <div className="p-4 space-y-3">
                <p className="text-sm text-secondary">
                  This will hide the breeder's marketplace listing. Their account will remain active.
                </p>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSuspendInput(false);
                      setSuspendReason("");
                    }}
                    disabled={actionLoading === "suspend"}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSuspend}
                    disabled={actionLoading === "suspend" || !suspendReason.trim()}
                  >
                    {actionLoading === "suspend" ? "Suspending..." : "Suspend Listing"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-hairline flex justify-between flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex gap-2">
            {/* Clear Flag */}
            {flag.flaggedAt && !flag.warningIssuedAt && !flag.marketplaceSuspendedAt && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFlag}
                disabled={actionLoading === "clear"}
              >
                {actionLoading === "clear" ? "Clearing..." : "Clear Flag"}
              </Button>
            )}

            {/* Issue Warning */}
            {!flag.marketplaceSuspendedAt && !showWarningInput && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowWarningInput(true)}
              >
                Issue Warning
              </Button>
            )}

            {/* Suspend / Unsuspend */}
            {flag.marketplaceSuspendedAt ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleUnsuspend}
                disabled={actionLoading === "unsuspend"}
              >
                {actionLoading === "unsuspend" ? "Restoring..." : "Restore Listing"}
              </Button>
            ) : (
              !showSuspendInput && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowSuspendInput(true)}
                >
                  Suspend Listing
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * Settings Tab
 * ─────────────────────────────────────────────────────────────────────────── */

function SettingsTab() {
  const [settings, setSettings] = React.useState<BreederReportSettingsDTO | null>(null);
  const [flagThreshold, setFlagThreshold] = React.useState(3);
  const [enableAutoFlag, setEnableAutoFlag] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await breederReportsApi.getSettings();
        setSettings(res);
        setFlagThreshold(res.flagThreshold);
        setEnableAutoFlag(res.enableAutoFlag);
      } catch (e: any) {
        setError(e?.message || "Failed to load settings");
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await breederReportsApi.updateSettings({
        flagThreshold,
        enableAutoFlag,
      });
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings");
    }
    setSaving(false);
  };

  const hasChanges =
    settings &&
    (flagThreshold !== settings.flagThreshold || enableAutoFlag !== settings.enableAutoFlag);

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center text-secondary">Loading settings...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-8 text-center text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4">Breeder Report Settings</h3>

          {/* Flag Threshold */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Flag Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={flagThreshold}
                  onChange={(e) => setFlagThreshold(Number(e.target.value))}
                  min={1}
                  max={50}
                  className="w-20 px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
                <span className="text-sm text-secondary">
                  reports before auto-flagging
                </span>
              </div>
              <p className="text-xs text-secondary mt-1">
                Breeders will be automatically flagged for review when they reach this number of reports.
              </p>
            </div>

            {/* Enable Auto-Flag */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAutoFlag}
                onChange={(e) => setEnableAutoFlag(e.target.checked)}
                className="rounded border-hairline"
              />
              <span className="text-sm">Enable automatic flagging</span>
            </label>

            {/* Note about no auto-suspend */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Unlike marketplace user abuse, breeders are <strong>not automatically suspended</strong>.
                All suspension actions require manual admin review since breeders are paying customers.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * Main Component
 * ─────────────────────────────────────────────────────────────────────────── */

type TabKey = "breeders" | "settings";

export default function BreederReportsAdmin() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("breeders");
  const [selectedTenantId, setSelectedTenantId] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleActionComplete = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Breeder Reports</h2>
        <p className="text-sm text-secondary mt-1">
          Review and manage reports from marketplace users about breeders.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-hairline">
        <button
          type="button"
          onClick={() => setActiveTab("breeders")}
          className={[
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeTab === "breeders"
              ? "text-primary"
              : "text-secondary hover:text-primary",
          ].join(" ")}
        >
          Reported Breeders
          {activeTab === "breeders" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--brand-orange))]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={[
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeTab === "settings"
              ? "text-primary"
              : "text-secondary hover:text-primary",
          ].join(" ")}
        >
          Settings
          {activeTab === "settings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--brand-orange))]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "breeders" && (
        <FlaggedBreedersTab
          key={refreshKey}
          onSelectBreeder={(tenantId) => setSelectedTenantId(tenantId)}
        />
      )}
      {activeTab === "settings" && <SettingsTab />}

      {/* Detail Modal */}
      {selectedTenantId && (
        <BreederDetailModal
          tenantId={selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
          onActionComplete={handleActionComplete}
        />
      )}
    </div>
  );
}

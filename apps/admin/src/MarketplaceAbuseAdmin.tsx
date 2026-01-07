// apps/admin/src/MarketplaceAbuseAdmin.tsx
// Admin UI for managing marketplace user abuse and blocks
import * as React from "react";
import {
  PageHeader, Card, Table, TableHeader, TableRow, TableCell, TableFooter,
  ColumnsPopover, hooks, SearchBar, SectionCard, Button, Input,
} from "@bhq/ui";
import { ToastViewport, toast } from "@bhq/ui/atoms/Toast";
import {
  adminApi,
  type MarketplaceFlaggedUserDTO,
  type MarketplaceUserDetailDTO,
  type MarketplaceAbuseSettingsDTO,
} from "./api";

/* ─────────────────────────────────────────────────────────────────────────────
 * Column definitions
 * ───────────────────────────────────────────────────────────────────────────── */
const FLAGGED_COLUMNS: Array<{ key: string; label: string; default?: boolean }> = [
  { key: "userName", label: "User", default: true },
  { key: "email", label: "Email", default: true },
  { key: "activeBlocks", label: "Active Blocks", default: true },
  { key: "totalBlocks", label: "Total Blocks", default: true },
  { key: "blockBreakdown", label: "L/M/H", default: true },
  { key: "approvalRate", label: "Approvals/Rejections", default: true },
  { key: "status", label: "Status", default: true },
  { key: "flaggedAt", label: "Flagged", default: true },
];

const STORAGE_KEY = "bhq_admin_marketplace_abuse_cols_v1";

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper functions
 * ───────────────────────────────────────────────────────────────────────────── */
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "short", day: "numeric",
  }).format(d);
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function getStatusBadge(row: MarketplaceFlaggedUserDTO) {
  if (row.suspendedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        Suspended
      </span>
    );
  }
  if (row.flaggedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
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

function getLevelBadge(level: string) {
  const classes = {
    LIGHT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    MEDIUM: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    HEAVY: "bg-red-500/10 text-red-600 dark:text-red-400",
  }[level] || "bg-neutral-500/10 text-neutral-600";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes}`}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */
export default function MarketplaceAbuseAdmin() {
  // View state: "users" | "settings"
  const [activeView, setActiveView] = React.useState<"users" | "settings">("users");

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Marketplace Abuse"
        subtitle={activeView === "users"
          ? "Review flagged and suspended marketplace users"
          : "Configure abuse detection thresholds"
        }
      />

      {/* Tabs */}
      <nav className="inline-flex items-end gap-6 mb-4" role="tablist">
        {([
          { key: "users", label: "Flagged Users" },
          { key: "settings", label: "Settings" },
        ] as const).map((tab) => {
          const isActive = activeView === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveView(tab.key)}
              className={[
                "pb-1 text-sm font-medium transition-colors select-none",
                isActive ? "text-white" : "text-neutral-400 hover:text-white",
              ].join(" ")}
              style={{
                borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      {activeView === "users" ? <FlaggedUsersTab /> : <SettingsTab />}

      <ToastViewport />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Flagged Users Tab
 * ───────────────────────────────────────────────────────────────────────────── */
function FlaggedUsersTab() {
  const [rows, setRows] = React.useState<MarketplaceFlaggedUserDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [total, setTotal] = React.useState(0);

  // Filters
  const [q, setQ] = React.useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = React.useState(true);
  const [showSuspendedOnly, setShowSuspendedOnly] = React.useState(false);

  // Selected user for detail modal
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listFlaggedUsers({
        flaggedOnly: showFlaggedOnly,
        suspendedOnly: showSuspendedOnly,
        page,
        limit: pageSize,
      });
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load flagged users");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showFlaggedOnly, showSuspendedOnly, page, pageSize]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Filter rows by search
  const displayRows = React.useMemo(() => {
    if (!q.trim()) return rows;
    const ql = q.toLowerCase();
    return rows.filter((r) => {
      const name = r.user.name || `${r.user.firstName} ${r.user.lastName}`;
      return (
        name.toLowerCase().includes(ql) ||
        r.user.email.toLowerCase().includes(ql)
      );
    });
  }, [rows, q]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const cols = hooks.useColumns(FLAGGED_COLUMNS, STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : FLAGGED_COLUMNS;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by name or email..."
            widthPx={300}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFlaggedOnly}
              onChange={(e) => {
                setShowFlaggedOnly(e.target.checked);
                if (e.target.checked) setShowSuspendedOnly(false);
              }}
              className="rounded"
            />
            Flagged only
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showSuspendedOnly}
              onChange={(e) => {
                setShowSuspendedOnly(e.target.checked);
                if (e.target.checked) setShowFlaggedOnly(false);
              }}
              className="rounded"
            />
            Suspended only
          </label>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={FLAGGED_COLUMNS}
          columnState={cols.map}
          onColumnStateChange={cols.setAll}
          getRowId={(r: MarketplaceFlaggedUserDTO) => r.id}
          pageSize={pageSize}
          renderStickyRight={() => (
            <ColumnsPopover
              columns={cols.map}
              onToggle={cols.toggle}
              onSet={cols.setAll}
              allColumns={FLAGGED_COLUMNS}
              triggerClassName="bhq-columns-trigger"
            />
          )}
          stickyRightWidthPx={40}
        >
          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe} sorts={[]} onToggleSort={() => {}} />
            <tbody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">Loading...</div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-red-600">Error: {error}</div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && displayRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">No users found.</div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && displayRows.length > 0 && displayRows.map((r) => (
                <TableRow
                  key={r.id}
                  onClick={() => setSelectedUserId(r.userId)}
                  className="cursor-pointer hover:bg-surface-strong"
                >
                  {visibleSafe.map((c) => {
                    if (c.key === "userName") {
                      const name = r.user.name || `${r.user.firstName} ${r.user.lastName}`.trim();
                      return <TableCell key={c.key}>{name || "Unknown"}</TableCell>;
                    }
                    if (c.key === "email") {
                      return <TableCell key={c.key}>{r.user.email}</TableCell>;
                    }
                    if (c.key === "activeBlocks") {
                      return <TableCell key={c.key}>{r.activeBlocks}</TableCell>;
                    }
                    if (c.key === "totalBlocks") {
                      return <TableCell key={c.key}>{r.totalBlocks}</TableCell>;
                    }
                    if (c.key === "blockBreakdown") {
                      return (
                        <TableCell key={c.key}>
                          <span className="text-yellow-600">{r.lightBlocks}</span>
                          {" / "}
                          <span className="text-orange-600">{r.mediumBlocks}</span>
                          {" / "}
                          <span className="text-red-600">{r.heavyBlocks}</span>
                        </TableCell>
                      );
                    }
                    if (c.key === "approvalRate") {
                      return (
                        <TableCell key={c.key}>
                          <span className="text-green-600">{r.totalApprovals}</span>
                          {" / "}
                          <span className="text-red-600">{r.totalRejections}</span>
                        </TableCell>
                      );
                    }
                    if (c.key === "status") {
                      return <TableCell key={c.key}>{getStatusBadge(r)}</TableCell>;
                    }
                    if (c.key === "flaggedAt") {
                      return <TableCell key={c.key}>{fmtDate(r.flaggedAt)}</TableCell>;
                    }
                    return <TableCell key={c.key}>—</TableCell>;
                  })}
                </TableRow>
              ))}
            </tbody>
          </table>

          <TableFooter
            entityLabel="users"
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            start={displayRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
            end={displayRows.length === 0 ? 0 : Math.min(total, page * pageSize)}
            filteredTotal={total}
            total={total}
          />
        </Table>
      </Card>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onActionComplete={() => {
            setSelectedUserId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * User Detail Modal
 * ───────────────────────────────────────────────────────────────────────────── */
function UserDetailModal({
  userId,
  onClose,
  onActionComplete,
}: {
  userId: string;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [data, setData] = React.useState<MarketplaceUserDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [showSuspendInput, setShowSuspendInput] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.getMarketplaceUser(userId)
      .then((res) => setData(res))
      .catch((e) => setError(e?.message || "Failed to load user details"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }
    setActionLoading("suspend");
    try {
      await adminApi.suspendMarketplaceUser(userId, suspendReason);
      toast.success("User suspended successfully");
      onActionComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to suspend user");
    }
    setActionLoading(null);
  };

  const handleUnsuspend = async () => {
    setActionLoading("unsuspend");
    try {
      await adminApi.unsuspendMarketplaceUser(userId);
      toast.success("User unsuspended successfully");
      onActionComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to unsuspend user");
    }
    setActionLoading(null);
  };

  const handleClearFlag = async () => {
    setActionLoading("clearFlag");
    try {
      await adminApi.clearMarketplaceUserFlag(userId);
      toast.success("Flag cleared successfully");
      onActionComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear flag");
    }
    setActionLoading(null);
  };

  const flag = data?.flag;
  const blocks = data?.blocks || [];
  const userName = flag?.user.name || `${flag?.user.firstName} ${flag?.user.lastName}`.trim() || "Unknown";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface border border-hairline rounded-xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-sm text-secondary">{flag?.user.email}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-strong rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && <div className="py-8 text-center text-secondary">Loading...</div>}
          {error && <div className="py-8 text-center text-red-600">{error}</div>}
          {!loading && !error && flag && (
            <>
              {/* Status Banner */}
              {flag.suspendedAt && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Suspended on {fmtDateTime(flag.suspendedAt)}
                  </div>
                  {flag.suspendedReason && (
                    <p className="text-sm text-secondary mt-1">Reason: {flag.suspendedReason}</p>
                  )}
                </div>
              )}

              {flag.flaggedAt && !flag.suspendedAt && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Flagged on {fmtDateTime(flag.flaggedAt)}
                  </div>
                  {flag.flagReason && (
                    <p className="text-sm text-secondary mt-1">Reason: {flag.flagReason}</p>
                  )}
                </div>
              )}

              {/* Stats */}
              <SectionCard title="Statistics">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Active Blocks</div>
                    <div className="text-lg font-semibold">{flag.activeBlocks}</div>
                  </div>
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Total Blocks</div>
                    <div className="text-lg font-semibold">{flag.totalBlocks}</div>
                  </div>
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Approvals</div>
                    <div className="text-lg font-semibold text-green-600">{flag.totalApprovals}</div>
                  </div>
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Rejections</div>
                    <div className="text-lg font-semibold text-red-600">{flag.totalRejections}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Light Blocks</div>
                    <div className="text-lg font-semibold text-yellow-600">{flag.lightBlocks}</div>
                  </div>
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Medium Blocks</div>
                    <div className="text-lg font-semibold text-orange-600">{flag.mediumBlocks}</div>
                  </div>
                  <div className="rounded border border-hairline bg-surface px-3 py-2">
                    <div className="text-xs text-secondary mb-1">Heavy Blocks</div>
                    <div className="text-lg font-semibold text-red-600">{flag.heavyBlocks}</div>
                  </div>
                </div>
              </SectionCard>

              {/* Block History */}
              <SectionCard title="Block History">
                {blocks.length === 0 ? (
                  <div className="text-sm text-secondary">No blocks recorded.</div>
                ) : (
                  <div className="overflow-hidden rounded border border-hairline">
                    <table className="w-full text-sm">
                      <thead className="text-secondary bg-surface-strong">
                        <tr>
                          <th className="text-left px-3 py-2">Breeder</th>
                          <th className="text-left px-3 py-2">Level</th>
                          <th className="text-left px-3 py-2">Reason</th>
                          <th className="text-left px-3 py-2">Blocked</th>
                          <th className="text-left px-3 py-2">Lifted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {blocks.map((b) => (
                          <tr key={b.id}>
                            <td className="px-3 py-2">{b.tenant.name}</td>
                            <td className="px-3 py-2">{getLevelBadge(b.level)}</td>
                            <td className="px-3 py-2 text-secondary">{b.reason || "—"}</td>
                            <td className="px-3 py-2">{fmtDate(b.createdAt)}</td>
                            <td className="px-3 py-2">{b.liftedAt ? fmtDate(b.liftedAt) : "Active"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {/* Suspend Input */}
              {showSuspendInput && !flag.suspendedAt && (
                <SectionCard title="Suspend User">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Reason for suspension</label>
                      <textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="e.g., Repeated abuse across multiple breeders"
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleSuspend}
                        disabled={actionLoading === "suspend" || !suspendReason.trim()}
                      >
                        {actionLoading === "suspend" ? "Suspending..." : "Confirm Suspend"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowSuspendInput(false);
                          setSuspendReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !error && flag && (
          <div className="px-5 py-4 border-t border-hairline flex justify-between">
            <div>
              {flag.flaggedAt && !flag.suspendedAt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFlag}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "clearFlag" ? "Clearing..." : "Clear Flag"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {flag.suspendedAt ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUnsuspend}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "unsuspend" ? "Unsuspending..." : "Unsuspend User"}
                </Button>
              ) : (
                !showSuspendInput && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowSuspendInput(true)}
                    disabled={!!actionLoading}
                  >
                    Suspend User
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Settings Tab
 * ───────────────────────────────────────────────────────────────────────────── */
function SettingsTab() {
  const [settings, setSettings] = React.useState<MarketplaceAbuseSettingsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Draft state
  const [flagThreshold, setFlagThreshold] = React.useState(3);
  const [autoSuspendThreshold, setAutoSuspendThreshold] = React.useState(5);
  const [enableAutoSuspend, setEnableAutoSuspend] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getMarketplaceAbuseSettings();
      setSettings(res);
      setFlagThreshold(res.flagThreshold);
      setAutoSuspendThreshold(res.autoSuspendThreshold);
      setEnableAutoSuspend(res.enableAutoSuspend);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateMarketplaceAbuseSettings({
        flagThreshold,
        autoSuspendThreshold,
        enableAutoSuspend,
      });
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings && (
    flagThreshold !== settings.flagThreshold ||
    autoSuspendThreshold !== settings.autoSuspendThreshold ||
    enableAutoSuspend !== settings.enableAutoSuspend
  );

  return (
    <div className="max-w-2xl space-y-4">
      {loading && (
        <Card className="p-8 text-center text-secondary">Loading settings...</Card>
      )}
      {error && (
        <Card className="p-8 text-center text-red-600">{error}</Card>
      )}
      {!loading && !error && (
        <>
          <SectionCard title="Flag Threshold">
            <p className="text-sm text-secondary mb-3">
              Users will be automatically flagged for review when they reach this many active blocks across all breeders.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={flagThreshold}
                onChange={(e) => setFlagThreshold(Number(e.target.value) || 1)}
                min={1}
                max={100}
                className="w-24"
              />
              <span className="text-sm text-secondary">active blocks</span>
            </div>
          </SectionCard>

          <SectionCard title="Auto-Suspend">
            <p className="text-sm text-secondary mb-3">
              Optionally auto-suspend users when they exceed a higher threshold of blocks.
            </p>
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableAutoSuspend}
                  onChange={(e) => setEnableAutoSuspend(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable auto-suspend</span>
              </label>

              {enableAutoSuspend && (
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={autoSuspendThreshold}
                    onChange={(e) => setAutoSuspendThreshold(Number(e.target.value) || 1)}
                    min={flagThreshold + 1}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-sm text-secondary">active blocks (must be greater than flag threshold)</span>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

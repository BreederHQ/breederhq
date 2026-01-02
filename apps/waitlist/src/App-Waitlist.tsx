// apps/waitlist/src/App-Waitlist.tsx
// Standalone Waitlist module with Approved/Pending tabs
import * as React from "react";
import {
  PageHeader,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  ColumnsPopover,
  hooks,
  SearchBar,
} from "@bhq/ui";
import { ToastViewport } from "@bhq/ui/atoms/Toast";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import "@bhq/ui/bhq.css";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/details.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeWaitlistApiClient, WaitlistApi } from "./api";

// Import the WaitlistTab component (which is the core content for Approved)
import WaitlistTab from "./pages/WaitlistTab";

/* ─────────────────────────────────────────────────────────────────────────────
 * Waitlist Shell with Approved/Pending tabs
 * Pattern copied from Breeding Planner (Your Breeding Plans | What If Planning)
 * ───────────────────────────────────────────────────────────────────────────── */

type WaitlistView = "approved" | "pending";

export default function AppWaitlist() {
  // Tenant and API initialization
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [api, setApi] = React.useState<WaitlistApi | null>(null);
  const [readOnlyGlobal] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("bhq_read_only");
      return raw === "1" || raw === "true";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const t = tenantId ?? (await resolveTenantId());
      if (!alive) return;
      setTenantId(t ?? null);
      if (t) setApi(makeWaitlistApiClient());
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  // Tab state - Approved is default
  const [activeView, setActiveView] = React.useState<WaitlistView>("approved");

  return (
    <div className="bhq-waitlist-app">
      <PageHeader
        title="Waitlist"
        subtitle={
          activeView === "approved"
            ? "Manage your approved waitlist entries"
            : "Review pending waitlist requests"
        }
        rightSlot={null}
      />

      <div className="p-4">
        {/* Page-level tabs: Approved | Pending */}
        {/* Pattern from apps/breeding/src/App-Breeding.tsx lines 2703-2728 */}
        <nav className="inline-flex items-end gap-6 mb-4" role="tablist" aria-label="Waitlist views">
          {(["approved", "pending"] as const).map((tabKey) => {
            const isActive = activeView === tabKey;
            const label = tabKey === "approved" ? "Approved" : "Pending";
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tabKey)}
                className={[
                  "pb-1 text-sm font-medium transition-colors select-none",
                  isActive
                    ? "text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                ].join(" ")}
                style={{
                  borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        {activeView === "approved" ? (
          <WaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        ) : (
          <PendingWaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        )}
      </div>

      <ToastViewport />
      <OverlayMount />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Tab
 * Shows informational card at top, then the same table UI as Approved (empty)
 * TODO: wire pending waitlist sources (marketplace inquiries, portal actions, etc.)
 * ───────────────────────────────────────────────────────────────────────────── */
function PendingWaitlistTab({
  api,
  tenantId,
  readOnlyGlobal,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
  readOnlyGlobal: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Informational card - kept exactly as before */}
      <div className="rounded-lg border border-hairline bg-surface p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
          <svg
            className="w-6 h-6 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-primary mb-1">Pending Waitlist</h3>
        <p className="text-sm text-secondary max-w-sm mx-auto">
          Marketplace inquiries and portal requests will appear here for your review before being added to the approved waitlist.
        </p>
      </div>

      {/* Same table surface as Approved - renders with empty data */}
      <PendingWaitlistTable />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Table - Empty table with same structure as Approved
 * Uses same column config and rendering as WaitlistTab but with static empty data
 * ───────────────────────────────────────────────────────────────────────────── */
const WAITLIST_COLS: Array<{ key: string; label: string; default?: boolean }> = [
  { key: "contactLabel", label: "Contact", default: true },
  { key: "orgLabel", label: "Org", default: true },
  { key: "speciesPref", label: "Species", default: true },
  { key: "breedPrefText", label: "Breeds", default: true },
  { key: "damPrefName", label: "Dam", default: true },
  { key: "sirePrefName", label: "Sire", default: true },
  { key: "depositPaidAt", label: "Deposit Paid On", default: true },
  { key: "status", label: "Status", default: false },
  { key: "priority", label: "Priority", default: false },
  { key: "skipCount", label: "Skips", default: false },
  { key: "lastActivityAt", label: "Activity", default: false },
];

const PENDING_WAITLIST_STORAGE_KEY = "bhq_pending_waitlist_cols_v1";

function PendingWaitlistTable() {
  const [q, setQ] = React.useState("");
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);

  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const f = prev.find((s) => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  const cols = hooks.useColumns(WAITLIST_COLS, PENDING_WAITLIST_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : WAITLIST_COLS;

  // Empty data - will be wired to pending sources later
  const rows: any[] = [];
  const loading = false;
  const error: string | null = null;

  return (
    <Card>
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          <span className="text-xs text-secondary">Pending review</span>
        </div>

        <Table
          columns={WAITLIST_COLS}
          columnState={cols.map}
          onColumnStateChange={cols.setAll}
          getRowId={(r: any) => r.id}
          pageSize={25}
          renderStickyRight={() => (
            <ColumnsPopover
              columns={cols.map}
              onToggle={cols.toggle}
              onSet={cols.setAll}
              allColumns={WAITLIST_COLS}
              triggerClassName="bhq-columns-trigger"
            />
          )}
          stickyRightWidthPx={40}
        >
          <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
            <SearchBar value={q} onChange={(v) => setQ(v)} placeholder="Search pending..." widthPx={520} />
            <div />
          </div>

          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
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
              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">No pending entries.</div>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </table>
        </Table>
      </div>
    </Card>
  );
}

// Export for standalone mounting
if (typeof window !== "undefined") {
  (window as any).AppWaitlist = AppWaitlist;
}

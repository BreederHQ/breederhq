// apps/waitlist/src/App-Waitlist.tsx
// Standalone Waitlist module with Approved/Pending/Rejected tabs
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
  Button,
} from "@bhq/ui";
import { ToastViewport, toast } from "@bhq/ui/atoms/Toast";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { DetailsHost } from "@bhq/ui/components/Drawer/DetailsHost";
import { DetailsScaffold } from "@bhq/ui/components/Drawer/DetailsScaffold";
import "@bhq/ui/bhq.css";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/details.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeWaitlistApiClient, WaitlistApi, type BlockedUserInfo } from "./api";

// Import the WaitlistTab component (which is the core content for Approved)
import WaitlistTab from "./pages/WaitlistTab";

/* ─────────────────────────────────────────────────────────────────────────────
 * Waitlist Shell with Approved/Pending/Rejected tabs
 * Pattern copied from Breeding Planner (Your Breeding Plans | What If Planning)
 * ───────────────────────────────────────────────────────────────────────────── */

type WaitlistView = "approved" | "pending" | "rejected" | "blocked";

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

  // Tab state - read from URL query param or default to approved
  const [activeView, setActiveView] = React.useState<WaitlistView>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "pending" || tab === "rejected" || tab === "approved" || tab === "blocked") {
        return tab;
      }
    } catch {
      // Ignore
    }
    return "approved";
  });

  return (
    <div className="bhq-waitlist-app">
      <div className="p-4 space-y-4">
        <div className="relative">
          <PageHeader
            title="Waitlist"
            subtitle={
              activeView === "approved"
                ? "Manage your approved waitlist entries"
                : activeView === "pending"
                ? "Review pending waitlist requests"
                : activeView === "rejected"
                ? "View rejected waitlist requests"
                : "Manage blocked marketplace users"
            }
            rightSlot={null}
          />

          {/* Right-aligned Tab Navigation with emojis and orange underline */}
          <div className="absolute right-0 top-0 h-full flex items-center">
            <nav className="flex items-center gap-1" role="tablist" aria-label="Waitlist views">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "approved"}
                onClick={() => setActiveView("approved")}
                className={[
                  "h-9 px-3 text-sm font-semibold leading-9 border-b-2 transition-colors flex items-center gap-1.5",
                  activeView === "approved"
                    ? "text-primary border-accent"
                    : "text-secondary hover:text-primary border-transparent",
                ].join(" ")}
              >
                <span>✅</span>
                <span>Approved</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeView === "pending"}
                onClick={() => setActiveView("pending")}
                className={[
                  "h-9 px-3 text-sm font-semibold leading-9 border-b-2 transition-colors flex items-center gap-1.5",
                  activeView === "pending"
                    ? "text-primary border-accent"
                    : "text-secondary hover:text-primary border-transparent",
                ].join(" ")}
              >
                <span>⏳</span>
                <span>Pending</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeView === "rejected"}
                onClick={() => setActiveView("rejected")}
                className={[
                  "h-9 px-3 text-sm font-semibold leading-9 border-b-2 transition-colors flex items-center gap-1.5",
                  activeView === "rejected"
                    ? "text-primary border-accent"
                    : "text-secondary hover:text-primary border-transparent",
                ].join(" ")}
              >
                <span>🚫</span>
                <span>Rejected</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeView === "blocked"}
                onClick={() => setActiveView("blocked")}
                className={[
                  "h-9 px-3 text-sm font-semibold leading-9 border-b-2 transition-colors flex items-center gap-1.5",
                  activeView === "blocked"
                    ? "text-primary border-accent"
                    : "text-secondary hover:text-primary border-transparent",
                ].join(" ")}
              >
                <span>🛑</span>
                <span>Blocked</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        {activeView === "approved" ? (
          <WaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        ) : activeView === "pending" ? (
          <PendingWaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        ) : activeView === "rejected" ? (
          <RejectedWaitlistTab
            api={api}
            tenantId={tenantId}
          />
        ) : (
          <BlockedUsersTab api={api} />
        )}
      </div>

      <ToastViewport />
      <OverlayMount />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Tab
 * Shows INQUIRY status entries from marketplace/portal waitlist requests
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
  const [selectedEntryId, setSelectedEntryId] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleCloseDrawer = () => setSelectedEntryId(null);
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setSelectedEntryId(null);
  };

  return (
    <div className="space-y-4">
      {/* Informational card */}
      <div className="rounded-lg border border-yellow-500/30 bg-surface px-4 py-3 text-center">
        <h3 className="text-sm font-medium text-yellow-500 mb-1">Pending Waitlist</h3>
        <p className="text-sm text-secondary max-w-lg mx-auto">
          Marketplace inquiries and portal requests will appear here for your review before being added to the approved waitlist.
          The same person can request multiple waitlist entries if they have unique species, breed, sire, or dam preferences.
        </p>
      </div>

      {/* Table showing INQUIRY status entries */}
      <PendingWaitlistTable
        api={api}
        tenantId={tenantId}
        onRowClick={(id) => setSelectedEntryId(id)}
        refreshKey={refreshKey}
      />

      {/* Pending Entry Drawer */}
      {selectedEntryId && (
        <PendingWaitlistDrawer
          api={api}
          tenantId={tenantId}
          entryId={selectedEntryId}
          onClose={handleCloseDrawer}
          onActionComplete={handleRefresh}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Table - Fetches INQUIRY status waitlist entries
 * ───────────────────────────────────────────────────────────────────────────── */
const PENDING_COLS: Array<{ key: string; label: string; default?: boolean }> = [
  { key: "contactLabel", label: "Contact", default: true },
  { key: "speciesPref", label: "Species", default: true },
  { key: "breedPrefText", label: "Breeds", default: true },
  { key: "notes", label: "Notes", default: true },
  { key: "createdAt", label: "Submitted", default: true },
];

const PENDING_WAITLIST_STORAGE_KEY = "bhq_pending_waitlist_cols_v1";

// Row mapping for pending entries
type PendingTableRow = {
  id: number;
  contactLabel: string | null;
  speciesPref: string | null;
  breedPrefText: string | null;
  notes: string | null;
  createdAt: string | null;
};

function mapPendingToTableRow(w: any): PendingTableRow {
  // Get contact label from clientParty or contact
  const contact = w.contact;
  const clientParty = w.clientParty;

  let contactLabel: string | null = null;
  if (contact?.display_name) {
    contactLabel = contact.display_name;
  } else if (contact?.first_name || contact?.last_name) {
    contactLabel = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  } else if (clientParty?.name) {
    contactLabel = clientParty.name;
  } else if (clientParty?.email) {
    contactLabel = clientParty.email;
  }

  const breedPrefText =
    w.breedPrefText ||
    (Array.isArray(w.breedPrefs) ? w.breedPrefs.filter(Boolean).join(", ") : null) ||
    null;

  return {
    id: Number(w.id),
    contactLabel,
    speciesPref: w.speciesPref ?? null,
    breedPrefText,
    notes: w.notes ?? null,
    createdAt: w.createdAt ?? null,
  };
}

function fmtDateTime(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleString() : "";
}

function PendingWaitlistTable({
  api,
  tenantId,
  onRowClick,
  refreshKey,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
  onRowClick?: (id: number) => void;
  refreshKey?: number;
}) {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<PendingTableRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);

  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const f = prev.find((s) => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  // Fetch INQUIRY status entries
  const load = React.useCallback(async () => {
    if (!api) return;
    if (!api.waitlist || typeof api.waitlist.list !== "function") {
      console.warn("[PendingWaitlist] waitlist API missing on client", api);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.waitlist.list({
        q: q || undefined,
        limit: 200,
        tenantId: tenantId ?? undefined,
        status: "INQUIRY",
      });
      const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
      setRows(items.map(mapPendingToTableRow));
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load pending waitlist");
      setLoading(false);
    }
  }, [api, q, tenantId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [load, refreshKey]);

  const cols = hooks.useColumns(PENDING_COLS, PENDING_WAITLIST_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : PENDING_COLS;

  return (
    <Card>
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          <span className="text-xs text-secondary">{rows.length} pending</span>
        </div>

        <Table
          columns={PENDING_COLS}
          columnState={cols.map}
          onColumnStateChange={cols.setAll}
          getRowId={(r: PendingTableRow) => r.id}
          pageSize={25}
          renderStickyRight={() => (
            <ColumnsPopover
              columns={cols.map}
              onToggle={cols.toggle}
              onSet={cols.setAll}
              allColumns={PENDING_COLS}
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
                    <div className="py-8 text-center text-sm text-secondary">Loading pending entries...</div>
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
              {!loading &&
                !error &&
                rows.length > 0 &&
                rows.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => onRowClick?.(r.id)}
                    className={onRowClick ? "cursor-pointer hover:bg-surface-strong" : ""}
                  >
                    {visibleSafe.map((c) => {
                      let v: any = (r as any)[c.key];
                      if (c.key === "createdAt") v = fmtDateTime(v);
                      // Truncate notes for display
                      if (c.key === "notes" && v && v.length > 100) {
                        v = v.substring(0, 100) + "...";
                      }
                      return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </tbody>
          </table>
        </Table>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Block User Modal - Select block level and optionally add reason
 * ───────────────────────────────────────────────────────────────────────────── */
type BlockLevel = "LIGHT" | "MEDIUM" | "HEAVY";

const BLOCK_LEVELS: Array<{
  value: BlockLevel;
  label: string;
  description: string;
  restrictions: string[];
}> = [
  {
    value: "LIGHT",
    label: "Light",
    description: "Minimal restrictions",
    restrictions: ["Cannot join your waitlist"],
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Moderate restrictions",
    restrictions: ["Cannot join your waitlist", "Cannot send you messages"],
  },
  {
    value: "HEAVY",
    label: "Heavy",
    description: "Full restrictions",
    restrictions: [
      "Cannot join your waitlist",
      "Cannot send you messages",
      "Cannot view your breeder profile",
    ],
  },
];

function BlockUserModal({
  userName,
  onConfirm,
  onCancel,
  loading,
}: {
  userName: string;
  onConfirm: (level: BlockLevel, reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [level, setLevel] = React.useState<BlockLevel>("MEDIUM");
  const [reason, setReason] = React.useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline">
          <h3 className="text-lg font-semibold">Block User</h3>
          <p className="text-sm text-secondary mt-1">
            Block <strong>{userName}</strong> from interacting with your marketplace profile.
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Level Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Block Level
            </label>
            <div className="space-y-2">
              {BLOCK_LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={[
                    "w-full text-left p-3 rounded-lg border transition-all",
                    level === opt.value
                      ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5"
                      : "border-hairline hover:border-neutral-500",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{opt.label}</span>
                    <span className="text-xs text-secondary">{opt.description}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {opt.restrictions.map((r, i) => (
                      <li key={i} className="text-xs text-secondary flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {r}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Reason (Optional, for your reference only)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Spam, abusive messages, etc."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is only visible to you, not the blocked user.
            </p>
          </div>

          {/* Info banner */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              The user will not be notified that they have been blocked. They will see generic messages like "This breeder is not accepting inquiries."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(level, reason)}
            disabled={loading}
          >
            {loading ? "Blocking..." : "Block User"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Approval Confirmation Modal - Contact/Organization creation wizard
 * ───────────────────────────────────────────────────────────────────────────── */
type RecordType = "contact" | "organization";

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

function ApprovalConfirmationModal({
  entry,
  duplicateInfo,
  onConfirm,
  onCancel,
  loading,
}: {
  entry: any;
  duplicateInfo: any;
  onConfirm: (data: {
    recordType: RecordType;
    linkToExisting: boolean;
    contactData?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    };
    orgData?: {
      name: string;
      email: string;
      phone: string;
      website?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    };
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const clientParty = entry?.clientParty;
  const existingContact = duplicateInfo?.existingContact;
  const hasDuplicate = duplicateInfo?.hasDuplicate;

  // Step state: 'choose' -> 'form'
  const [step, setStep] = React.useState<"choose" | "form">(hasDuplicate ? "choose" : "choose");
  const [recordType, setRecordType] = React.useState<RecordType>("contact");
  const [linkToExisting, setLinkToExisting] = React.useState(false);

  // Contact form state
  const [contactForm, setContactForm] = React.useState({
    firstName: clientParty?.name?.split(" ")[0] || "",
    lastName: clientParty?.name?.split(" ").slice(1).join(" ") || "",
    email: clientParty?.email || "",
    phone: clientParty?.phone || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  // Organization form state
  const [orgForm, setOrgForm] = React.useState({
    name: clientParty?.name || "",
    email: clientParty?.email || "",
    phone: clientParty?.phone || "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (linkToExisting && hasDuplicate) {
      onConfirm({ recordType, linkToExisting: true });
    } else if (recordType === "contact") {
      onConfirm({ recordType, linkToExisting: false, contactData: contactForm });
    } else {
      onConfirm({ recordType, linkToExisting: false, orgData: orgForm });
    }
  };

  const canSubmit = linkToExisting || (recordType === "contact"
    ? (contactForm.firstName.trim() || contactForm.lastName.trim()) && contactForm.email.trim()
    : orgForm.name.trim() && orgForm.email.trim());

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-xl bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex-shrink-0">
          <h3 className="text-lg font-semibold">Approve & Add to Your Records</h3>
          <p className="text-sm text-secondary mt-1">
            This person will be added to your approved waitlist and converted to a record in your system.
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Duplicate Match Notice */}
          {hasDuplicate && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Existing Record Found
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    <strong>{existingContact?.display_name}</strong>
                    {existingContact?.email && <> ({existingContact.email})</>}
                  </p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkToExisting}
                      onChange={(e) => setLinkToExisting(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline"
                    />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Link to this existing record instead of creating a new one
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Record Type Selection */}
          {!linkToExisting && (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Create as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordType("contact")}
                    className={[
                      "p-4 rounded-lg border-2 text-left transition-all",
                      recordType === "contact"
                        ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5"
                        : "border-hairline hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">Contact</span>
                    </div>
                    <p className="text-xs text-secondary">
                      An individual person (buyer, client, etc.)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordType("organization")}
                    className={[
                      "p-4 rounded-lg border-2 text-left transition-all",
                      recordType === "organization"
                        ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5"
                        : "border-hairline hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">Organization</span>
                    </div>
                    <p className="text-xs text-secondary">
                      A business, breeder, or other entity
                    </p>
                  </button>
                </div>
              </div>

              {/* Contact Form */}
              {recordType === "contact" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    Contact Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">First Name *</label>
                      <input
                        type="text"
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                        className={inputClass}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Last Name</label>
                      <input
                        type="text"
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Email *</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className={inputClass}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className={inputClass}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Address</label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      className={inputClass}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">City</label>
                      <input
                        type="text"
                        value={contactForm.city}
                        onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                        className={inputClass}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">State</label>
                      <input
                        type="text"
                        value={contactForm.state}
                        onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                        className={inputClass}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">ZIP</label>
                      <input
                        type="text"
                        value={contactForm.zip}
                        onChange={(e) => setContactForm({ ...contactForm, zip: e.target.value })}
                        className={inputClass}
                        placeholder="ZIP code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Notes</label>
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      className={inputClass + " h-20 resize-none"}
                      placeholder="Any additional notes about this contact..."
                    />
                  </div>
                </div>
              )}

              {/* Organization Form */}
              {recordType === "organization" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    Organization Details
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Organization Name *</label>
                    <input
                      type="text"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      className={inputClass}
                      placeholder="Organization name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Email *</label>
                      <input
                        type="email"
                        value={orgForm.email}
                        onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                        className={inputClass}
                        placeholder="contact@organization.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Phone</label>
                      <input
                        type="tel"
                        value={orgForm.phone}
                        onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                        className={inputClass}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Website</label>
                    <input
                      type="url"
                      value={orgForm.website}
                      onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                      className={inputClass}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Address</label>
                    <input
                      type="text"
                      value={orgForm.address}
                      onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                      className={inputClass}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">City</label>
                      <input
                        type="text"
                        value={orgForm.city}
                        onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                        className={inputClass}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">State</label>
                      <input
                        type="text"
                        value={orgForm.state}
                        onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                        className={inputClass}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">ZIP</label>
                      <input
                        type="text"
                        value={orgForm.zip}
                        onChange={(e) => setOrgForm({ ...orgForm, zip: e.target.value })}
                        className={inputClass}
                        placeholder="ZIP code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Notes</label>
                    <textarea
                      value={orgForm.notes}
                      onChange={(e) => setOrgForm({ ...orgForm, notes: e.target.value })}
                      className={inputClass + " h-20 resize-none"}
                      placeholder="Any additional notes about this organization..."
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info Banner */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {linkToExisting
                ? "The waitlist entry will be linked to your existing record. No new record will be created."
                : recordType === "contact"
                ? "A new Contact will be created in your Contacts list. You can edit their details anytime from the Contacts module."
                : "A new Organization will be created in your system. You can edit their details anytime from the Contacts module."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? "Processing..." : linkToExisting ? "Approve & Link" : `Approve & Create ${recordType === "contact" ? "Contact" : "Organization"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Modal - Details and actions for a pending entry (centered popup)
 * ───────────────────────────────────────────────────────────────────────────── */
function PendingWaitlistDrawer({
  api,
  tenantId,
  entryId,
  onClose,
  onActionComplete,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
  entryId: number;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [entry, setEntry] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = React.useState<any>(null);
  const [checkingDuplicate, setCheckingDuplicate] = React.useState(false);

  // Action states
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [showMessageInput, setShowMessageInput] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);

  // Fetch entry details
  React.useEffect(() => {
    if (!api || !entryId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await api.raw.get<any>(`/waitlist/${entryId}`);
        setEntry(res);
        setLoading(false);

        // Check for duplicates
        setCheckingDuplicate(true);
        try {
          const dupRes = await api.raw.get<any>(`/waitlist/${entryId}/check-duplicate`);
          setDuplicateInfo(dupRes);
        } catch {
          // Ignore duplicate check errors
        }
        setCheckingDuplicate(false);
      } catch (e: any) {
        setError(e?.message || "Failed to load entry");
        setLoading(false);
      }
    })();
  }, [api, entryId]);

  const handleApproveWithData = async (data: {
    recordType: RecordType;
    linkToExisting: boolean;
    contactData?: any;
    orgData?: any;
  }) => {
    if (!api || !entry) return;
    setActionLoading("approve");
    try {
      const body: any = {
        recordType: data.recordType,
      };

      if (data.linkToExisting && duplicateInfo?.existingContact?.id) {
        body.linkToExistingContactId = duplicateInfo.existingContact.id;
      } else if (data.recordType === "contact" && data.contactData) {
        body.contactData = {
          first_name: data.contactData.firstName,
          last_name: data.contactData.lastName,
          email: data.contactData.email,
          phone_e164: data.contactData.phone,
          address_line1: data.contactData.address,
          city: data.contactData.city,
          state: data.contactData.state,
          postal_code: data.contactData.zip,
          notes: data.contactData.notes,
        };
      } else if (data.recordType === "organization" && data.orgData) {
        body.organizationData = {
          name: data.orgData.name,
          email: data.orgData.email,
          phone: data.orgData.phone,
          website: data.orgData.website,
          address_line1: data.orgData.address,
          city: data.orgData.city,
          state: data.orgData.state,
          postal_code: data.orgData.zip,
          notes: data.orgData.notes,
        };
      }

      await api.raw.post(`/waitlist/${entryId}/approve`, body);
      toast.success(`Entry approved and ${data.linkToExisting ? "linked to existing record" : (data.recordType === "contact" ? "Contact created" : "Organization created")}`);
      setShowApprovalModal(false);
      onActionComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve entry");
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!api || !entry) return;
    setActionLoading("reject");
    try {
      await api.raw.post(`/waitlist/${entryId}/reject`, { reason: rejectReason || null });
      toast.success("Entry rejected");
      onActionComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject entry");
    }
    setActionLoading(null);
  };

  const handleSendMessage = async () => {
    if (!api || !entry || !messageText.trim()) return;
    setActionLoading("message");
    try {
      await api.raw.post(`/waitlist/${entryId}/message`, { message: messageText.trim() });
      toast.success("Message sent");
      setShowMessageInput(false);
      setMessageText("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
    }
    setActionLoading(null);
  };

  const handleBlockUser = async (level: BlockLevel, reason: string) => {
    if (!api || !entry) return;

    const marketplaceUserId = entry.clientParty?.externalId || entry.marketplaceUserId;

    if (!marketplaceUserId) {
      toast.error("Cannot block: No marketplace user associated with this entry");
      setShowBlockModal(false);
      return;
    }

    setActionLoading("block");
    try {
      await api.marketplaceBlocks.block({
        userId: marketplaceUserId,
        level,
        reason: reason || undefined,
      });
      toast.success("User blocked successfully");
      setShowBlockModal(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to block user");
    }
    setActionLoading(null);
  };

  // Get display info
  const contact = entry?.contact;
  const clientParty = entry?.clientParty;
  const displayName =
    contact?.display_name ||
    (contact?.first_name || contact?.last_name
      ? `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim()
      : null) ||
    clientParty?.name ||
    "Unknown";
  const displayEmail = contact?.email || clientParty?.email || null;
  const displayPhone = contact?.phoneE164 || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Pending Request</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-strong rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
          {loading && (
            <div className="py-8 text-center text-sm text-secondary">Loading...</div>
          )}
          {error && (
            <div className="py-8 text-center text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && entry && (
            <>
              {/* Contact Info */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{displayName}</span>
                  </div>
                  {displayEmail && (
                    <div className="text-sm text-secondary flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {displayEmail}
                    </div>
                  )}
                  {displayPhone && (
                    <div className="text-sm text-secondary flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {displayPhone}
                    </div>
                  )}
                </div>
              </section>

              {/* Request Details */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                  Request Details
                </h3>
                <div className="space-y-2 text-sm">
                  {entry.speciesPref && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Species</span>
                      <span>{entry.speciesPref}</span>
                    </div>
                  )}
                  {entry.breedPrefs && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Breeds</span>
                      <span>
                        {Array.isArray(entry.breedPrefs)
                          ? entry.breedPrefs.filter(Boolean).join(", ")
                          : entry.breedPrefs}
                      </span>
                    </div>
                  )}
                  {entry.sirePref && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Sire Preference</span>
                      <span>{entry.sirePref.name}</span>
                    </div>
                  )}
                  {entry.damPref && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Dam Preference</span>
                      <span>{entry.damPref.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-secondary">Submitted</span>
                    <span>{fmtDateTime(entry.createdAt)}</span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              {entry.notes && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                    Notes / Message
                  </h3>
                  <div className="text-sm bg-neutral-800/50 rounded-lg p-3 whitespace-pre-wrap">
                    {entry.notes}
                  </div>
                </section>
              )}

              {/* Message Input */}
              {showMessageInput && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                    Send Message
                  </h3>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || actionLoading === "message"}
                    >
                      {actionLoading === "message" ? "Sending..." : "Send"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMessageInput(false);
                        setMessageText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </section>
              )}

              {/* Reject Reason Input */}
              {showRejectInput && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                    Rejection Reason (Optional)
                  </h3>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection (optional)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <p className="text-xs text-secondary mt-1">
                    This will be visible to the applicant.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                      disabled={actionLoading === "reject"}
                    >
                      {actionLoading === "reject" ? "Rejecting..." : "Confirm Reject"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !error && entry && !showRejectInput && !showMessageInput && (
          <div className="px-5 py-4 border-t border-hairline flex gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMessageInput(true)}
              disabled={!!actionLoading}
            >
              Message
            </Button>
            {/* Block button - only show if this is a marketplace user */}
            {(entry.clientParty?.externalId || entry.marketplaceUserId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockModal(true)}
                disabled={!!actionLoading}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                Block
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRejectInput(true)}
              disabled={!!actionLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowApprovalModal(true)}
              disabled={!!actionLoading}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <ApprovalConfirmationModal
          entry={entry}
          duplicateInfo={duplicateInfo}
          onConfirm={handleApproveWithData}
          onCancel={() => setShowApprovalModal(false)}
          loading={actionLoading === "approve"}
        />
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <BlockUserModal
          userName={displayName}
          onConfirm={handleBlockUser}
          onCancel={() => setShowBlockModal(false)}
          loading={actionLoading === "block"}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Rejected Waitlist Tab
 * Shows REJECTED status entries for historical reference
 * ───────────────────────────────────────────────────────────────────────────── */
const REJECTED_COLS: Array<{ key: string; label: string; default?: boolean }> = [
  { key: "contactLabel", label: "Contact", default: true },
  { key: "speciesPref", label: "Species", default: true },
  { key: "rejectedReason", label: "Reason", default: true },
  { key: "rejectedAt", label: "Rejected", default: true },
  { key: "actions", label: "", default: true },
];

const REJECTED_WAITLIST_STORAGE_KEY = "bhq_rejected_waitlist_cols_v2";

type RejectedTableRow = {
  id: number;
  contactLabel: string | null;
  speciesPref: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  marketplaceUserId: string | null;
  userName: string | null;
};

function mapRejectedToTableRow(w: any): RejectedTableRow {
  const contact = w.contact;
  const clientParty = w.clientParty;

  let contactLabel: string | null = null;
  if (contact?.display_name) {
    contactLabel = contact.display_name;
  } else if (contact?.first_name || contact?.last_name) {
    contactLabel = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  } else if (clientParty?.name) {
    contactLabel = clientParty.name;
  } else if (clientParty?.email) {
    contactLabel = clientParty.email;
  }

  // Get marketplace user ID for blocking capability
  const marketplaceUserId = w.marketplaceUserId || clientParty?.externalId || null;

  return {
    id: Number(w.id),
    contactLabel,
    speciesPref: w.speciesPref ?? null,
    rejectedReason: w.rejectedReason ?? null,
    rejectedAt: w.rejectedAt ?? null,
    marketplaceUserId,
    userName: contactLabel,
  };
}

function RejectedWaitlistTab({
  api,
  tenantId,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
}) {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<RejectedTableRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);

  // Block modal state
  const [blockTarget, setBlockTarget] = React.useState<{ userId: string; userName: string } | null>(null);
  const [blockLoading, setBlockLoading] = React.useState(false);

  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const f = prev.find((s) => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  const load = React.useCallback(async () => {
    if (!api) return;
    if (!api.waitlist || typeof api.waitlist.list !== "function") {
      console.warn("[RejectedWaitlist] waitlist API missing on client", api);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.waitlist.list({
        q: q || undefined,
        limit: 200,
        tenantId: tenantId ?? undefined,
        status: "REJECTED",
      });
      const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
      setRows(items.map(mapRejectedToTableRow));
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load rejected waitlist");
      setLoading(false);
    }
  }, [api, q, tenantId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [load]);

  const cols = hooks.useColumns(REJECTED_COLS, REJECTED_WAITLIST_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : REJECTED_COLS;

  // Block handler
  const handleBlock = async (level: BlockLevel, reason: string) => {
    if (!api || !blockTarget) return;

    setBlockLoading(true);
    try {
      await api.marketplaceBlocks.block({
        userId: blockTarget.userId,
        level,
        reason: reason || undefined,
      });
      toast.success("User blocked successfully");
      setBlockTarget(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to block user");
    }
    setBlockLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Informational card */}
      <div className="rounded-lg border border-red-500/30 bg-surface px-4 py-3 text-center">
        <h3 className="text-sm font-medium text-red-500 mb-1">Rejected Requests</h3>
        <p className="text-sm text-secondary max-w-lg mx-auto">
          Historical record of waitlist requests that were declined.
        </p>
      </div>

      <Card>
        <div className="relative">
          <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
            <span className="text-xs text-secondary">{rows.length} rejected</span>
          </div>

          <Table
            columns={REJECTED_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: RejectedTableRow) => r.id}
            pageSize={25}
            renderStickyRight={() => (
              <ColumnsPopover
                columns={cols.map}
                onToggle={cols.toggle}
                onSet={cols.setAll}
                allColumns={REJECTED_COLS}
                triggerClassName="bhq-columns-trigger"
              />
            )}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <SearchBar value={q} onChange={(v) => setQ(v)} placeholder="Search rejected..." widthPx={520} />
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe.filter((c) => c.key !== "actions")} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading rejected entries...</div>
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
                      <div className="py-8 text-center text-sm text-secondary">No rejected entries.</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  rows.length > 0 &&
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      {visibleSafe.map((c) => {
                        // Render block action button
                        if (c.key === "actions") {
                          // Only show block button if entry has a marketplace user ID
                          if (!r.marketplaceUserId) {
                            return <TableCell key={c.key}></TableCell>;
                          }
                          return (
                            <TableCell key={c.key}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBlockTarget({ userId: r.marketplaceUserId!, userName: r.userName || "this user" })}
                                className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              >
                                Block
                              </Button>
                            </TableCell>
                          );
                        }
                        let v: any = (r as any)[c.key];
                        if (c.key === "rejectedAt") v = fmtDateTime(v);
                        // Truncate reason for display
                        if (c.key === "rejectedReason" && v && v.length > 100) {
                          v = v.substring(0, 100) + "...";
                        }
                        return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>
          </Table>
        </div>
      </Card>

      {/* Block User Modal */}
      {blockTarget && (
        <BlockUserModal
          userName={blockTarget.userName}
          onConfirm={handleBlock}
          onCancel={() => setBlockTarget(null)}
          loading={blockLoading}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Blocked Users Tab
 * Shows marketplace users blocked by this breeder with unblock functionality
 * ───────────────────────────────────────────────────────────────────────────── */
const BLOCKED_COLS: Array<{ key: string; label: string; default?: boolean }> = [
  { key: "name", label: "User", default: true },
  { key: "email", label: "Email", default: true },
  { key: "level", label: "Block Level", default: true },
  { key: "reason", label: "Reason", default: true },
  { key: "createdAt", label: "Blocked On", default: true },
  { key: "actions", label: "", default: true },
];

const BLOCKED_USERS_STORAGE_KEY = "bhq_blocked_users_cols_v1";

function getLevelBadgeClass(level: string) {
  switch (level) {
    case "LIGHT":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "MEDIUM":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "HEAVY":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400";
  }
}

function BlockedUsersTab({ api }: { api: WaitlistApi | null }) {
  const [rows, setRows] = React.useState<BlockedUserInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [unblockingId, setUnblockingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.marketplaceBlocks.list();
      setRows(res?.items || []);
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load blocked users");
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (userId: string) => {
    if (!api) return;
    setUnblockingId(userId);
    try {
      await api.marketplaceBlocks.unblock(userId);
      toast.success("User unblocked successfully");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to unblock user");
    }
    setUnblockingId(null);
  };

  const cols = hooks.useColumns(BLOCKED_COLS, BLOCKED_USERS_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : BLOCKED_COLS;

  return (
    <div className="space-y-4">
      {/* Informational card */}
      <div className="rounded-lg border border-orange-500/30 bg-surface px-4 py-3 text-center">
        <h3 className="text-sm font-medium text-orange-500 mb-1">Blocked Users</h3>
        <p className="text-sm text-secondary max-w-lg mx-auto">
          Marketplace users you've blocked. They cannot interact with your profile based on their block level.
        </p>
      </div>

      <Card>
        <div className="relative">
          <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
            <span className="text-xs text-secondary">{rows.length} blocked</span>
          </div>

          <Table
            columns={BLOCKED_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: BlockedUserInfo) => r.id}
            pageSize={25}
            renderStickyRight={() => (
              <ColumnsPopover
                columns={cols.map}
                onToggle={cols.toggle}
                onSet={cols.setAll}
                allColumns={BLOCKED_COLS}
                triggerClassName="bhq-columns-trigger"
              />
            )}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <div className="text-sm text-secondary">
                {loading ? "Loading..." : `${rows.length} blocked user${rows.length === 1 ? "" : "s"}`}
              </div>
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader
                columns={visibleSafe.filter((c) => c.key !== "actions")}
                sorts={[]}
                onToggleSort={() => {}}
              />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading blocked users...</div>
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
                      <div className="py-8 text-center text-sm text-secondary">No blocked users.</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  rows.length > 0 &&
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      {visibleSafe.map((c) => {
                        if (c.key === "name") {
                          const name = r.user.name || `${r.user.firstName} ${r.user.lastName}`.trim() || "Unknown";
                          return <TableCell key={c.key}>{name}</TableCell>;
                        }
                        if (c.key === "email") {
                          return <TableCell key={c.key}>{r.user.email}</TableCell>;
                        }
                        if (c.key === "level") {
                          return (
                            <TableCell key={c.key}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeClass(r.level)}`}>
                                {r.level}
                              </span>
                            </TableCell>
                          );
                        }
                        if (c.key === "reason") {
                          const reason = r.reason || "—";
                          return (
                            <TableCell key={c.key}>
                              <span className="text-secondary" title={r.reason || undefined}>
                                {reason.length > 50 ? reason.substring(0, 50) + "..." : reason}
                              </span>
                            </TableCell>
                          );
                        }
                        if (c.key === "createdAt") {
                          return <TableCell key={c.key}>{fmtDateTime(r.createdAt)}</TableCell>;
                        }
                        if (c.key === "actions") {
                          return (
                            <TableCell key={c.key}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblock(r.userId)}
                                disabled={unblockingId === r.userId}
                                className="text-xs"
                              >
                                {unblockingId === r.userId ? "Unblocking..." : "Unblock"}
                              </Button>
                            </TableCell>
                          );
                        }
                        return <TableCell key={c.key}>{(r as any)[c.key] ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Export for standalone mounting
if (typeof window !== "undefined") {
  (window as any).AppWaitlist = AppWaitlist;
}

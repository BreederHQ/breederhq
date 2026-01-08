// apps/admin/src/App-Admin.tsx
import * as React from "react";
import {
  PageHeader, Card, Table, TableHeader, TableRow, TableCell, TableFooter,
  ColumnsPopover, hooks, utils, SearchBar, FiltersRow, DetailsHost,
  DetailsScaffold, DetailsSpecRenderer, SectionCard, Button, Input,
} from "@bhq/ui";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { adminApi, TenantDTO } from "./api";
import MarketplaceAbuseAdmin from "./MarketplaceAbuseAdmin";
import BreederReportsAdmin from "./BreederReportsAdmin";
import UsageDashboard from "./UsageDashboard";
import SubscriptionAdmin from "./SubscriptionAdmin";

type TenantRow = TenantDTO;

type AdminTenantUser = {
  userId: string; email: string;
  firstName?: string | null; lastName?: string | null; name?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BILLING" | "VIEWER";
  verified: boolean; createdAt?: string | null; isSuperAdmin?: boolean;
};

type BillingDTO = {
  provider: string | null; customerId: string | null; subscriptionId: string | null;
  plan: string | null; status: string | null; currentPeriodEnd: string | null;
  createdAt?: string | null; updatedAt?: string | null;
} | null;

type SessionUser = { id: string; email: string; name?: string | null; isSuperAdmin?: boolean | null };

const COLUMNS: Array<{ key: keyof TenantRow & string; label: string; default?: boolean }> = [
  { key: "name", label: "Tenant", default: true },
  { key: "primaryEmail", label: "Email", default: true },
  { key: "usersCount", label: "Users", default: true },
  { key: "organizationsCount", label: "Orgs", default: true },
  { key: "contactsCount", label: "Contacts", default: true },
  { key: "animalsCount", label: "Animals", default: true },
  { key: "createdAt", label: "Created", default: false },
  { key: "updatedAt", label: "Updated", default: false },
];

const STORAGE_KEY = "bhq_admin_cols_v1";
const { readTenantIdFast, resolveTenantId } = utils;

/* utils */
const Required = () => <span className="ml-1 text-xs text-[hsl(var(--brand-orange))] align-middle">* Required</span>;
function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function tenantToRow(t: TenantDTO): TenantRow { return { ...t, primaryEmail: t.primaryEmail ?? null, billing: t.billing ?? null }; }
async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await adminApi.me();
    return res?.user ?? null;
  } catch {
    return null;
  }
}
const usersExclOwner = (r: TenantRow) => Math.max(0, (r.usersCount ?? 0) - 1);

/* ───────────────────────── New: TenantDetailsView component ───────────────────────── */
function TenantDetailsView({
  row, mode, setMode, setDraft, activeTab, setActiveTab, requestSave,
  tenantSections, // function
}: any) {
  // local dirty tracking for sub-tabs
  const [usersDirty, setUsersDirty] = React.useState(false);
  const [billingDirty, setBillingDirty] = React.useState(false);
  const { confirm } = hooks.useDirtyConfirm(usersDirty || billingDirty);

  // Password reset state
  const [resetWorking, setResetWorking] = React.useState(false);
  const [resetPassword, setResetPassword] = React.useState<string | null>(null);
  const [resetErr, setResetErr] = React.useState<string | null>(null);

  // register child "save" callbacks (e.g., UsersTab role batch)
  const childSaversRef = React.useRef(new Set<() => Promise<void>>());
  const registerChildSave = React.useCallback((cb: () => Promise<void>) => {
    childSaversRef.current.add(cb);
    return () => childSaversRef.current.delete(cb);
  }, []);
  const runChildSaves = React.useCallback(async () => {
    for (const task of Array.from(childSaversRef.current)) { // sequential by design
      // eslint-disable-next-line no-await-in-loop
      await task();
    }
  }, []);

  const guardedSetActiveTab = (next: string) => { if (next !== activeTab && confirm()) setActiveTab(next); };
  const guardedCancel = () => { if (confirm()) setMode("view"); };
  const onTopSave = async () => { await runChildSaves(); await requestSave(); setUsersDirty(false); setBillingDirty(false); };

  const handleResetPassword = async () => {
    try {
      setResetWorking(true);
      setResetErr(null);
      const res = await adminApi.adminResetOwnerPassword(row.id, { generateTempPassword: true });
      setResetPassword(res.tempPassword);
    } catch (e: any) {
      setResetErr(e?.message || "Failed to reset password");
    } finally {
      setResetWorking(false);
    }
  };

  return (
    <DetailsScaffold
      title={row.name}
      subtitle={row.primaryEmail || ""}
      mode={mode}
      onEdit={() => setMode("edit")}
      onCancel={guardedCancel}
      onSave={onTopSave}
      tabs={[
        { key: "overview", label: "Overview" },
        { key: "users", label: "Users" },
        { key: "billing", label: "Billing" },
        { key: "audit", label: "Audit" },
      ]}
      activeTab={activeTab}
      onTabChange={guardedSetActiveTab}
      rightActions={
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs border border-hairline bg-[hsl(var(--brand-orange))]/15 text-[hsl(var(--brand-orange))]">
              Editing
            </span>
          )}
          <Button size="sm" variant="outline">Archive</Button>
        </div>
      }
    >
      {activeTab === "overview" && (
        <>
          <DetailsSpecRenderer<TenantRow>
            row={row}
            mode={mode}
            setDraft={(p) => setDraft((d: any) => ({ ...d, ...p }))}
            sections={tenantSections(mode)}
          />

          {/* Owner Password Reset Section */}
          <SectionCard title="Owner Password Reset" className="mt-4">
            <div className="space-y-3">
              {!resetPassword ? (
                <>
                  <p className="text-sm text-secondary">
                    Generate a new temporary password for the tenant owner. The owner will be required to change it on next login.
                  </p>
                  {resetErr && <div className="text-sm text-red-600">{resetErr}</div>}
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetPassword}
                      disabled={resetWorking}
                    >
                      {resetWorking ? "Generating..." : "Reset Owner Password"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="text-xs text-secondary mb-1 flex items-center justify-between">
                      <span>New Temporary Password</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(resetPassword);
                        }}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-hairline rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="font-mono text-sm font-semibold break-all">{resetPassword}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
                    <div className="font-medium mb-1">Important:</div>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-secondary">
                      <li>This password will not be shown again</li>
                      <li>The owner must change this password on first login</li>
                    </ul>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setResetPassword(null)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}

      {activeTab === "users" && (
        <UsersTab tenantId={row.id} mode={mode} onDirty={setUsersDirty} registerSave={registerChildSave} />
      )}

      {activeTab === "billing" && (
        <BillingTab tenantId={row.id} mode={mode} onDirty={setBillingDirty} />
      )}

      {activeTab === "audit" && (
        <div className="space-y-2">
          <SectionCard title="Dates">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded border border-hairline bg-surface px-3 py-2">
                <div className="text-xs text-secondary mb-1 uppercase tracking-wide">Created</div>
                <div className="text-sm text-primary">{fmtDate(row.createdAt) || "—"}</div>
              </div>
              <div className="rounded border border-hairline bg-surface px-3 py-2">
                <div className="text-xs text-secondary mb-1 uppercase tracking-wide">Last Modified</div>
                <div className="text-sm text-primary">{fmtDate(row.updatedAt) || "—"}</div>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Change Log">
            <div className="text-sm text-secondary">No audit entries (placeholder).</div>
          </SectionCard>
        </div>
      )}
    </DetailsScaffold>
  );
}

/* ───────────────────────── Main component ───────────────────────── */
type AdminSection = "tenants" | "marketplace-abuse" | "breeder-reports" | "usage" | "subscriptions";

export default function AppAdmin() {
  const [activeSection, setActiveSection] = React.useState<AdminSection>("tenants");

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "admin", label: "Admin" } }));
  }, []);
  React.useEffect(() => { if (!getOverlayRoot()) console.warn("ColumnsPopover needs an overlay root."); }, []);

  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [tenantErr, setTenantErr] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try { const t = await resolveTenantId(); if (!cancelled) setTenantId(t); }
      catch (e: any) { if (!cancelled) setTenantErr(String(e?.message || e) || "Failed to resolve tenant"); }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  React.useEffect(() => {
    if (tenantId == null) return; // wait until we know the id

    // 1) Persist tenant id synchronously so request() can attach X-Tenant-Id
    try {
      localStorage.setItem("BHQ_TENANT_ID", String(tenantId));
      (window as any).__BHQ_TENANT_ID__ = tenantId;
    } catch { }

    // 2) Now load the session user
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.me();
        if (!cancelled) setMe(res?.user ?? null);
      } catch {
        try {
          const res2 = await (adminApi as any).me?.(tenantId);
          if (!cancelled) setMe(res2?.user ?? null);
        } catch {
          if (!cancelled) setMe(null);
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tenantId]);

  // --- session user state (single source of truth)
  const [me, setMe] = React.useState<SessionUser | null>(null);
  const [meLoading, setMeLoading] = React.useState(true);
  const [canAdminTenants, setCanAdminTenants] = React.useState(false);

  // Load session user (scoped; needs tenant header)
  React.useEffect(() => {
    if (tenantId == null) return; // wait until tenantId is known/persisted
    let cancelled = false;
    (async () => {
      try {
        const u = await getSessionUser();
        if (!cancelled) setMe(u);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const isSuper = !!me?.isSuperAdmin;
  const canShowNewTenant = ((!meLoading && isSuper) || canAdminTenants);

  // search/filters
  const [q, setQ] = React.useState(() => { try { return localStorage.getItem("bhq_admin_q_v1") || ""; } catch { return ""; } });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem("bhq_admin_filters_v1") || "{}"); } catch { return {}; } });
  React.useEffect(() => { try { localStorage.setItem("bhq_admin_q_v1", q); } catch { } }, [q]);
  React.useEffect(() => { try { localStorage.setItem("bhq_admin_filters_v1", JSON.stringify(filters || {})); } catch { } }, [filters]);
  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const clearFilters = () => { setQ(""); setFilters({}); };

  // data + pagination
  const [rows, setRows] = React.useState<TenantRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(tenantId != null ? true : false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  // ── NEW TENANT MODAL STATE + HELPERS
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(null);

  // form fields
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newOwnerFirstName, setNewOwnerFirstName] = React.useState("");
  const [newOwnerLastName, setNewOwnerLastName] = React.useState("");
  const [newTempPassword, setNewTempPassword] = React.useState("");
  const [generatePassword, setGeneratePassword] = React.useState(true);

  // simple email check
  const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);
  const canCreate = newName.trim().length > 0 && isEmail(newEmail.trim()) && newOwnerFirstName.trim().length > 0 && (generatePassword || newTempPassword.trim().length >= 8);

  // create action
  const doCreateTenant = async () => {
    if (!canCreate) {
      setCreateErr("Please enter a tenant name, valid email, owner first name, and password (or enable generate).");
      return;
    }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const res = await adminApi.adminProvisionTenant({
        tenant: { name: newName.trim(), primaryEmail: newEmail.trim() },
        owner: {
          email: newEmail.trim(),
          firstName: newOwnerFirstName.trim(),
          lastName: newOwnerLastName.trim() || null,
          verify: true,
          makeDefault: false,
          tempPassword: generatePassword ? undefined : newTempPassword.trim(),
          generateTempPassword: generatePassword,
        },
      });

      // Immediately reflect in the table
      setRows(prev => {
        const row = tenantToRow(res.tenant as any);
        return me?.isSuperAdmin ? [row, ...prev] : [row];
      });

      // Show the password
      setCreatedPassword(res.tempPassword);
      setNewName(""); setNewEmail(""); setNewOwnerFirstName(""); setNewOwnerLastName(""); setNewTempPassword("");
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create tenant");
    } finally {
      setCreateWorking(false);
    }
  };

  const resetCreateModal = () => {
    setCreateOpen(false);
    setCreatedPassword(null);
    setCreateErr(null);
    setNewName("");
    setNewEmail("");
    setNewOwnerFirstName("");
    setNewOwnerLastName("");
    setNewTempPassword("");
    setGeneratePassword(true);
  };

  /* ── sorting (state + server sort param) — MUST be declared before any effect that uses sortParam ── */
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const sortParam = React.useMemo(
    () => (sorts.length ? sorts.map(s => `${s.key}:${s.dir}`).join(",") : undefined),
    [sorts]
  );
  const onToggleSort = React.useCallback(
    (key: string, opts?: { shiftKey?: boolean }) => {
      setSorts(prev => {
        const append = !!opts?.shiftKey;          // Shift = add to multi-sort
        const base = append ? [...prev] : [];     // otherwise reset to single-column
        const idx = base.findIndex(s => s.key === key);
        if (idx === -1) base.push({ key, dir: "asc" });
        else if (base[idx].dir === "asc") base[idx] = { key, dir: "desc" };
        else base.splice(idx, 1);                 // third click removes this key
        return base;
      });
    },
    []
  );
  // keep paging in sync when search/filters/sorts change
  React.useEffect(() => { setPage(1); }, [qDebounced, filters, sorts]);

  /* ── data load — single tenant by default; all tenants for super admins ── */
  React.useEffect(() => {
    if (meLoading) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        if (isSuper) {
          // Super admins can see every tenant
          const res = await adminApi.listTenantsAll({
            q: qDebounced || undefined,
            page: 1,
            limit: 50,
            sort: sortParam,
          });

          if (!cancelled) {
            setRows((res.items || []).map(tenantToRow));
            setCanAdminTenants(true);
          }
        } else {
          // Normal users should see their own tenant
          if (tenantId == null) return; // still resolving

          const t = await adminApi.getTenant(tenantId);

          if (!cancelled) {
            setRows([tenantToRow(t)]);
            setCanAdminTenants(false);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load tenants");
          setRows([]);
          setCanAdminTenants(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [meLoading, isSuper, tenantId, qDebounced, sortParam]);

  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  type FilterKind = "text" | "select" | "date";
  const FILTER_TYPES: Partial<Record<keyof TenantRow & string, { kind: FilterKind }>> = {
    name: { kind: "text" }, primaryEmail: { kind: "text" }, createdAt: { kind: "date" }, updatedAt: { kind: "date" },
    usersCount: { kind: "text" }, organizationsCount: { kind: "text" }, contactsCount: { kind: "text" }, animalsCount: { kind: "text" },
  };
  const filterSchemaForFiltersRow = React.useMemo(() => {
    return visibleSafe.map(col => {
      if (col.key === "createdAt") {
        return { key: col.key, label: col.label, editor: "dateRange" as const, fromKey: "createdAt_from", toKey: "createdAt_to" };
      }
      if (col.key === "updatedAt") {
        return { key: col.key, label: col.label, editor: "dateRange" as const, fromKey: "updatedAt_from", toKey: "updatedAt_to" };
      }
      // keep everything else as text/select/date (your existing behavior)
      const cfg = FILTER_TYPES[col.key] || { kind: "text" as const };
      if (cfg.kind === "date") return ({ key: col.key, label: col.label, editor: "date" as const });
      if (cfg.kind === "select") return ({ key: col.key, label: col.label, editor: "select" as const });
      return ({ key: col.key, label: col.label, editor: "text" as const });
    });
  }, [visibleSafe]);

  const DATE_KEYS = new Set(["createdAt", "updatedAt"] as const);

  // --- date helpers + tiny chips ---
  const toISODateOnly = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : "");
  const inDateRange = (valueISO?: string | null, from?: string, to?: string) => {
    const d = toISODateOnly(valueISO);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  // Simple, local filter chips (shared version is fine too if you have it)
  function FilterChips({
    filters, onChange, prettyLabel,
  }: {
    filters: Record<string, string>;
    onChange: (next: Record<string, string>) => void;
    prettyLabel?: (key: string) => string;
  }) {
    const entries = Object.entries(filters).filter(([, v]) => (v ?? "") !== "");
    if (!entries.length) return null;

    const labelFor = (k: string) => {
      if (prettyLabel) return prettyLabel(k);
      if (k.endsWith("_from")) return k.replace("_from", " ≥");
      if (k.endsWith("_to")) return k.replace("_to", " ≤");
      return k;
    };

    const clearOne = (key: string) => {
      const next = { ...filters };
      delete next[key];
      onChange(next);
    };
    const clearAll = () => onChange({});

    return (
      <div className="px-3 pb-2 flex flex-wrap items-center gap-2">
        {entries.map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-strong px-2.5 py-1 text-xs">
            <span className="text-secondary">{labelFor(k)}:</span>
            <span className="text-primary">{v}</span>
            <button
              type="button"
              className="rounded hover:bg-white/10 px-1"
              aria-label={`Clear ${labelFor(k)}`}
              onClick={() => clearOne(k)}
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          className="ml-1 text-xs underline text-secondary hover:text-primary"
          onClick={clearAll}
        >
          Clear all
        </button>
      </div>
    );
  }

  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    if (!active.length && !qDebounced) return rows;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    let data = [...rows];

    // free text search (unchanged)
    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter(r => {
        const hay = [
          r.name, r.primaryEmail, r.billing?.plan, r.billing?.status,
          r.usersCount, r.organizationsCount, r.contactsCount, r.animalsCount,
          r.createdAt, r.updatedAt,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      const createdFrom = filters["createdAt_from"];
      const createdTo = filters["createdAt_to"];
      const updatedFrom = filters["updatedAt_from"];
      const updatedTo = filters["updatedAt_to"];

      data = data.filter(r => {
        // text-like filters (ignore the range keys)
        const textOk = active.every(([key, val]) => {
          if (key === "createdAt_from" || key === "createdAt_to" || key === "updatedAt_from" || key === "updatedAt_to") {
            return true;
          }
          const raw = (r as any)[key];
          const isDate = key === "createdAt" || key === "updatedAt";
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });

        if (!textOk) return false;

        // inclusive date ranges (YYYY-MM-DD comparisons)
        const createdOk = (createdFrom || createdTo) ? inDateRange(r.createdAt, createdFrom, createdTo) : true;
        const updatedOk = (updatedFrom || updatedTo) ? inDateRange(r.updatedAt, updatedFrom, updatedTo) : true;

        return createdOk && updatedOk;
      });
    }

    return data;
  }, [rows, filters, qDebounced]);

  const sortedRows = React.useMemo(() => {
    if (!sorts.length) return displayRows;
    if (isSuper) return displayRows; // server already sorted it
    const out = [...displayRows];
    out.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [displayRows, sorts, isSuper]);

  // ── derived pagination values (used by table + footer)
  const pageCount = React.useMemo(
    () => Math.max(1, Math.ceil(sortedRows.length / pageSize)),
    [sortedRows.length, pageSize]
  );
  const clampedPage = Math.min(page, pageCount);
  const start = sortedRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = sortedRows.length === 0 ? 0 : Math.min(sortedRows.length, (clampedPage - 1) * pageSize + pageSize);

  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  /* sections for overview */
  const tenantSections = (mode: "view" | "edit") => ([
    {
      title: "Tenant",
      fields: [
        {
          label: "Email",
          view: (r: TenantRow) => r.primaryEmail ?? "—",
          edit: (r: TenantRow, set: (updates: Partial<TenantRow>) => void) => <Input size="sm" defaultValue={r.primaryEmail ?? ""} onChange={e => set({ primaryEmail: e.target.value })} />,
        },
        // CHANGE THIS LINE:
        { label: "Users", view: (r: TenantRow) => String(usersExclOwner(r)) },
        { label: "Orgs", view: (r: TenantRow) => String(r.organizationsCount ?? 0) },
        { label: "Contacts", view: (r: TenantRow) => String(r.contactsCount ?? 0) },
        { label: "Animals", view: (r: TenantRow) => String(r.animalsCount ?? 0) },
        { label: "Created", view: (r: TenantRow) => fmtDate(r.createdAt) || "—" },
        { label: "Updated", view: (r: TenantRow) => fmtDate(r.updatedAt) || "—" },
      ],
    },
  ]);

  /* details host config (no hooks inside render!) */
  const detailsConfig = React.useMemo(() => ({
    idParam: "tenantId",
    getRowId: (r: TenantRow) => r.id,
    width: 820,
    placement: "center" as const,
    align: "top" as const,
    fetchRow: (id: string | number) => adminApi.getTenant(Number(id)),
    onSave: async (id: string | number, draft: Partial<TenantRow>) => {
      const numId = Number(id);
      const updated = await adminApi.patchTenant(numId, draft);
      setRows(prev => prev.map(r => (r.id === numId ? { ...r, ...tenantToRow(updated) } : r)));
    },
    header: (r: TenantRow) => ({ title: r.name, subtitle: r.primaryEmail || "" }),
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "users", label: "Users" },
      { key: "billing", label: "Billing" },
      { key: "audit", label: "Audit" },
    ],
    customChrome: true,
    render: (props: any) => (
      <TenantDetailsView {...props} tenantSections={tenantSections} />
    ),
  }), []);

  console.debug('[admin gate]', {
    meLoading,
    isSuper: !!me?.isSuperAdmin,
    canAdminTenants,
    canShowNewTenant: canAdminTenants,
  });

  // Super admin section tabs config
  const superAdminTabs = [
    { key: "tenants", label: "Tenants" },
    { key: "marketplace-abuse", label: "Marketplace Abuse" },
    { key: "breeder-reports", label: "Breeder Reports" },
    { key: "usage", label: "Usage Dashboard" },
    { key: "subscriptions", label: "Subscriptions" },
  ] as const;

  // Render super admin section nav
  const renderSuperAdminNav = () => (
    <div className="px-4 pt-4 border-b border-hairline">
      <nav className="inline-flex items-end gap-6" role="tablist">
        {superAdminTabs.map((tab) => {
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(tab.key)}
              className={[
                "pb-2 text-sm font-medium transition-colors select-none",
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
    </div>
  );

  // If showing Marketplace Abuse section (super admin only), render that instead
  if (activeSection === "marketplace-abuse" && isSuper) {
    return (
      <div>
        {/* Super Admin Section Nav */}
        {renderSuperAdminNav()}
        <MarketplaceAbuseAdmin />
      </div>
    );
  }

  // If showing Breeder Reports section (super admin only), render that instead
  if (activeSection === "breeder-reports" && isSuper) {
    return (
      <div>
        {/* Super Admin Section Nav */}
        {renderSuperAdminNav()}
        <BreederReportsAdmin />
      </div>
    );
  }

  // If showing Usage Dashboard section (not super admin only - tenant scoped), render that instead
  if (activeSection === "usage") {
    return (
      <div>
        {/* Super Admin Section Nav */}
        {isSuper && renderSuperAdminNav()}
        <UsageDashboard />
      </div>
    );
  }

  // If showing Subscriptions section (super admin only), render that instead
  if (activeSection === "subscriptions" && isSuper) {
    return (
      <div>
        {/* Super Admin Section Nav */}
        {renderSuperAdminNav()}
        <SubscriptionAdmin />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Super Admin Section Nav */}
      {isSuper && (
        <div className="border-b border-hairline -mx-4 px-4 -mt-4 pt-4 mb-4">
          <nav className="inline-flex items-end gap-6" role="tablist">
            {superAdminTabs.map((tab) => {
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveSection(tab.key)}
                  className={[
                    "pb-2 text-sm font-medium transition-colors select-none",
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
        </div>
      )}

      {/* Header row with absolutely-positioned right actions */}
      <div className="relative">
        <PageHeader
          title="Admin"
          subtitle="Create and Manage User Accounts In Your Tenant"
        />

        {/* Right-side actions, same visual row as the header */}
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
          {/* New Tenant (left) */}
          {((!meLoading && !!me?.isSuperAdmin) || canAdminTenants) && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              New Tenant
            </Button>
          )}

          {/* More (right) */}
          <Button size="sm" variant="outline">
            ...
          </Button>
        </div>
      </div>

      {/* main table */}
      <Card>
        <DetailsHost rows={rows} config={detailsConfig}>
          <Table
            columns={COLUMNS}
            columnState={map}
            onColumnStateChange={setAll}
            getRowId={(r: TenantRow) => r.id}
            pageSize={25}
            renderStickyRight={() => (
              <ColumnsPopover columns={map} onToggle={toggle} onSet={setAll} allColumns={COLUMNS} triggerClassName="bhq-columns-trigger" />
            )}
            stickyRightWidthPx={40}
          >
            {/* toolbar */}
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30">
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search any field…"
                widthPx={520}
                rightSlot={
                  <div className="flex items-center gap-2">
                    {/* Filters toggle */}
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(v => !v)}
                      aria-expanded={filtersOpen}
                      title="Filters"
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3 5h18M7 12h10M10 19h4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                }
              />
            </div>

            {/* filters */}
            {filtersOpen && (
              <FiltersRow
                filters={filters}
                onChange={(next) => setFilters(next)}
                schema={filterSchemaForFiltersRow}
              />
            )}

            <FilterChips
              filters={filters}
              onChange={setFilters}
              prettyLabel={(k) => {
                if (k === "primaryEmail") return "Email";
                if (k === "createdAt_from") return "Created ≥";
                if (k === "createdAt_to") return "Created ≤";
                if (k === "updatedAt_from") return "Updated ≥";
                if (k === "updatedAt_to") return "Updated ≤";
                return k;
              }}
            />

            {/* table */}
            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {!isSuper && tenantId == null && (
                  <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">Resolving tenant…</div></TableCell></TableRow>
                )}
                {loading && (
                  <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">Loading tenants…</div></TableCell></TableRow>
                )}
                {!loading && error && (
                  <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-red-600">Error: {error}</div></TableCell></TableRow>
                )}
                {!loading && !error && pageRows.length === 0 && (
                  <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">No tenants to display yet.</div></TableCell></TableRow>
                )}
                {!loading && !error && pageRows.length > 0 &&
                  pageRows.map(r => (
                    <TableRow key={r.id} detailsRow={r}>
                      {visibleSafe.map(c => {
                        // Special-case: Users column shows count excluding owner
                        if (c.key === "usersCount") {
                          const shown = usersExclOwner(r);
                          return (
                            <TableCell key={c.key} title={`${r.usersCount ?? 0} total (incl. owner)`}>
                              {String(shown)}
                            </TableCell>
                          );
                        }

                        let v = (r as any)[c.key] as any;
                        if (c.key === "createdAt" || c.key === "updatedAt") v = fmtDate(v);
                        if (typeof v === "number") v = String(v);
                        return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))
                }
              </tbody>
            </table>

            <TableFooter
              entityLabel="tenants"
              page={clampedPage}
              pageCount={pageCount}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
              start={sortedRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1}
              end={sortedRows.length === 0 ? 0 : Math.min(sortedRows.length, (clampedPage - 1) * pageSize + pageSize)}
              filteredTotal={sortedRows.length}
              total={rows.length}
            />
          </Table>
        </DetailsHost>
      </Card>

      {/* ───────────────────── Provision Tenant Modal ───────────────────── */}
      {createOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => !createWorking && !createdPassword && resetCreateModal()} />

          {/* card */}
          <div className="relative w-[540px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            {!createdPassword ? (
              <>
                <div className="text-lg font-semibold mb-1">Provision Tenant</div>
                <div className="text-sm text-secondary mb-4">
                  Create a new tenant and set up the owner account.
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-secondary mb-1">
                      Tenant name <span className="text-[hsl(var(--brand-orange))]">*</span>
                    </div>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.currentTarget.value)}
                      placeholder="Acme Ranch LLC"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-secondary mb-1">
                      Owner email <span className="text-[hsl(var(--brand-orange))]">*</span>
                    </div>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.currentTarget.value)}
                      placeholder="owner@acme-ranch.test"
                      type="email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-secondary mb-1">
                        Owner first name <span className="text-[hsl(var(--brand-orange))]">*</span>
                      </div>
                      <Input
                        value={newOwnerFirstName}
                        onChange={(e) => setNewOwnerFirstName(e.currentTarget.value)}
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-secondary mb-1">
                        Owner last name <span className="text-muted-foreground">(optional)</span>
                      </div>
                      <Input
                        value={newOwnerLastName}
                        onChange={(e) => setNewOwnerLastName(e.currentTarget.value)}
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-3 mt-3">
                    <div className="text-xs font-medium mb-2">Temporary Password</div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="gen-pwd"
                        checked={generatePassword}
                        onChange={(e) => setGeneratePassword(e.currentTarget.checked)}
                        className="rounded"
                      />
                      <label htmlFor="gen-pwd" className="text-sm cursor-pointer">
                        Generate strong password
                      </label>
                    </div>

                    {!generatePassword && (
                      <div>
                        <div className="text-xs text-secondary mb-1">
                          Enter password (min 8 chars) <span className="text-[hsl(var(--brand-orange))]">*</span>
                        </div>
                        <Input
                          type="password"
                          value={newTempPassword}
                          onChange={(e) => setNewTempPassword(e.currentTarget.value)}
                          placeholder="Temporary password"
                        />
                      </div>
                    )}
                  </div>

                  {createErr && <div className="text-sm text-red-600">{createErr}</div>}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-secondary">
                      <span className="text-[hsl(var(--brand-orange))]">*</span> Required
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={resetCreateModal} disabled={createWorking}>
                        Cancel
                      </Button>
                      <Button onClick={doCreateTenant} disabled={!canCreate || createWorking}>
                        {createWorking ? "Creating…" : "Create tenant"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-1 text-green-600">✓ Tenant Created</div>
                <div className="text-sm text-secondary mb-4">
                  Copy the temporary password now. It will not be shown again.
                </div>

                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-secondary mb-1">Owner Email</div>
                    <div className="font-mono text-sm">{newEmail}</div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="text-xs text-secondary mb-1 flex items-center justify-between">
                      <span>Temporary Password</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdPassword);
                        }}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-hairline rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="font-mono text-sm font-semibold break-all">{createdPassword}</div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
                    <div className="font-medium mb-1">Important:</div>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-secondary">
                      <li>The owner must change this password on first login</li>
                      <li>This password will not be shown again</li>
                      <li>You can reset the password later from the Admin UI</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={resetCreateModal}>
                      Done
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Tabs (unchanged from previous drop except props) ───────────────────────── */

function UsersTab({
  tenantId, mode, onDirty, registerSave,
}: {
  tenantId: number; mode: "view" | "edit";
  onDirty: (v: boolean) => void;
  registerSave?: (cb: () => Promise<void>) => () => void;
}) {
  // Roles available for non-owner users (OWNER intentionally excluded)
  const ROLE_OPTIONS: Array<Exclude<AdminTenantUser["role"], "OWNER">> = [
    "ADMIN", "MEMBER", "BILLING", "VIEWER",
  ];

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [items, setItems] = React.useState<AdminTenantUser[]>([]);
  const [showArchived, setShowArchived] = React.useState(false);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<typeof ROLE_OPTIONS[number]>("MEMBER");

  const [changedRoles, setChangedRoles] =
    React.useState<Record<string, AdminTenantUser["role"]>>({});
  const changedRef = React.useRef(changedRoles);
  React.useEffect(() => {
    changedRef.current = changedRoles;
    onDirty(Object.keys(changedRoles).length > 0);
  }, [changedRoles, onDirty]);

  const reload = React.useCallback(() => {
    setLoading(true); setErr("");
    adminApi
      .listUsers(tenantId, { page: 1, limit: 50, includeArchived: showArchived } as any)
      .then((res: any) => {
        // Hide the tenant owner from the list
        const list: AdminTenantUser[] = (res?.items || []).filter((u: AdminTenantUser) => u.role !== "OWNER");
        setItems(list);
      })
      .catch((e: any) => setErr(e?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [tenantId, showArchived]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  // parent registers a saver that applies any pending role changes
  React.useEffect(() => {
    if (!registerSave) return;
    const dispose = registerSave(async () => {
      const entries = Object.entries(changedRef.current);
      for (const [userId, newRole] of entries) {
        const current = items.find((u) => u.userId === userId)?.role;
        if (current && current !== newRole) {
          // eslint-disable-next-line no-await-in-loop
          await adminApi.setRole(tenantId, userId, newRole);
        }
      }
      if (entries.length) {
        setChangedRoles({});
        await reload();
      }
    });
    return dispose;
  }, [registerSave, tenantId, items, reload]);

  const canInvite = firstName.trim() && lastName.trim() && email.trim();

  return (
    <div className="space-y-4 text-primary">
      <SectionCard title="Add / Invite">
        {/* Row 1: First / Last (required) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end mb-2">
          <div>
            <div className="text-xs text-secondary mb-1">
              First name <span className="text-[hsl(var(--brand-orange))]">*</span>
            </div>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              placeholder="First name"
              className="h-9"
            />
          </div>
          <div>
            <div className="text-xs text-secondary mb-1">
              Last name <span className="text-[hsl(var(--brand-orange))]">*</span>
            </div>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              placeholder="Last name"
              className="h-9"
            />
          </div>
        </div>

        {/* Row 2: Email + ROLE (same line, all breakpoints) */}
        <div className="flex items-end gap-2">
          {/* Email (flex grows) */}
          <div className="flex-1 min-w-[260px]">
            <div className="text-xs text-secondary mb-1">
              Email address <span className="text-[hsl(var(--brand-orange))]">*</span>
            </div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="email@tenant.test"
              className="h-9"
            />
          </div>

          {/* ROLE label */}
          <div className="text-xs font-medium text-secondary pb-1">
            ROLE:
          </div>

          {/* Role select (fixed width so it sits on same line) */}
          <div className="w-[200px]">
            <select
              className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              value={role}
              onChange={(e) => setRole(e.currentTarget.value as typeof ROLE_OPTIONS[number])}
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <Button
            className="h-9 px-4"
            onClick={async () => {
              try {
                if (!canInvite) throw new Error('First name, last name, and email are required.');
                await adminApi.addUser(tenantId, {
                  email, firstName, lastName, name: `${firstName} ${lastName}`.trim(), role
                } as any);
                setFirstName(''); setLastName(''); setEmail(''); setRole('MEMBER'); reload();
              } catch (e: any) {
                alert(e?.message || 'Add failed');
              }
            }}
            disabled={!canInvite}
          >
            Add
          </Button>
        </div>

        {/* Legend */}
        <div className="text-xs text-secondary mt-2">
          <span className="text-[hsl(var(--brand-orange))]">*</span> Required
        </div>
      </SectionCard>

      <SectionCard
        title="Users"
        right={
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.currentTarget.checked)}
            />
            Show archived
          </label>
        }
      >
        {loading && <div className="text-secondary text-sm">Loading users…</div>}
        {err && <div className="text-red-600 text-sm">Error: {err}</div>}
        {!loading && !err && (
          <div className="overflow-hidden rounded border border-hairline">
            <table className="w-full text-sm">
              <thead className="text-secondary bg-surface-strong">
                <tr>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Verified</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {items.map((u) => (
                  <UserRow
                    key={u.userId}
                    tenantId={tenantId}
                    user={u}
                    mode={mode}
                    onChanged={reload}
                    onRoleChange={(next) =>
                      setChangedRoles((m) => ({ ...m, [u.userId]: next }))
                    }
                  />
                ))}
                {!items.length && (
                  <tr>
                    <td className="px-3 py-6 text-secondary" colSpan={6}>
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function UserRow({
  tenantId, user, mode, onChanged, onRoleChange,
}: { tenantId: number; user: AdminTenantUser; mode: "view" | "edit"; onChanged: () => void; onRoleChange: (role: AdminTenantUser["role"]) => void; }) {
  const [working, setWorking] = React.useState(false);
  const [role, setRole] = React.useState<AdminTenantUser["role"]>(user.role);
  const [showPw, setShowPw] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const doVerify = async () => { try { setWorking(true); await adminApi.verifyEmail(tenantId, user.userId); onChanged(); } catch (e: any) { alert(e?.message || "Verify failed"); } finally { setWorking(false); } };
  const doArchive = async () => {
    const ok = window.confirm(`Archive ${user.email}?`); if (!ok) return;
    try { setWorking(true); const fn = (adminApi as any).archiveUser ?? adminApi.removeUser; await fn(tenantId, user.userId); onChanged(); }
    catch (e: any) { alert(e?.message || "Archive failed"); } finally { setWorking(false); }
  };

  const isComplex = (pw: string) => pw.length >= 12 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  const doSetPw = async () => {
    if (!isComplex(password)) { alert("Password must be at least 12 characters and include upper, lower, number, and special."); return; }
    try { setWorking(true); await adminApi.setPassword(tenantId, user.userId, password); setPassword(""); setShowPw(false); alert("Password updated."); }
    catch (e: any) { alert(e?.message || "Set password failed"); } finally { setWorking(false); }
  };

  const fullName = (user.firstName || user.lastName ? [user.firstName, user.lastName].filter(Boolean).join(" ") : user.name) || "—";
  React.useEffect(() => { setRole(user.role); }, [user.role]);

  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="break-all">{user.email}</span>
          {user.isSuperAdmin && (
            <span className="inline-flex items-center text-[10px] leading-4 px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/40 text-[hsl(var(--brand-orange))]">
              Super Admin
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">{fullName}</td>

      <td className="px-3 py-2">
        {mode === "view" ? (
          <span>{user.role}</span>
        ) : (
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              value={role}
              onChange={(e) => { const next = e.currentTarget.value as AdminTenantUser["role"]; setRole(next); onRoleChange(next); }}
            >
              {["OWNER", "ADMIN", "MEMBER", "BILLING", "VIEWER"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </td>

      <td className="px-3 py-2">{user.verified ? "Yes" : "No"}</td>
      <td className="px-3 py-2">{fmtDate(user.createdAt)}</td>

      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {!user.verified && <Button size="sm" variant="outline" onClick={doVerify} disabled={working}>Verify</Button>}
          <Button size="sm" variant="outline" onClick={() => setShowPw(v => !v)} disabled={working}>{showPw ? "Close" : "Reset PW"}</Button>
          <Button size="icon" variant="ghost" title="Archive user" onClick={doArchive} disabled={working} aria-label="Archive">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </Button>
        </div>

        {showPw && (
          <div className="mt-2 rounded border border-hairline bg-surface-strong p-2">
            <div className="text-xs text-secondary mb-1">New password (min 12 chars, upper + lower + number + special)</div>
            <div className="flex items-center gap-2">
              <Input type="password" placeholder="Strong password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} className="h-8 w-[260px]" />
              <Button size="sm" onClick={doSetPw} disabled={working || !password}>Save</Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function BillingTab({ tenantId, mode, onDirty }: { tenantId: number; mode: "view" | "edit"; onDirty: (v: boolean) => void; }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [billing, setBilling] = React.useState<BillingDTO>(null);
  const [draft, setDraft] = React.useState<Partial<NonNullable<BillingDTO>>>({});

  React.useEffect(() => {
    let cancelled = false;
    setErr(""); setLoading(true);
    adminApi.getBilling(tenantId)
      .then((b: BillingDTO) => { if (!cancelled) { setBilling(b); setDraft({}); onDirty(false); } })
      .catch((e: any) => { if (!cancelled) setErr(e?.message || "Failed to load billing"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tenantId, onDirty]);

  React.useEffect(() => {
    const dirty = ["provider", "customerId", "subscriptionId", "plan", "status", "currentPeriodEnd"].some(k => (draft as any)[k] !== undefined);
    onDirty(dirty);
  }, [draft, onDirty]);

  const v = <K extends keyof NonNullable<BillingDTO>>(k: K) =>
    (draft as any)[k] !== undefined ? (draft as any)[k] : (billing as any)?.[k] ?? "";

  const Read = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div><div className="text-xs text-secondary mb-1">{label}</div><div className="text-sm">{value ?? "—"}</div></div>
  );
  const Edit = ({ label, k, placeholder }: { label: string; k: keyof NonNullable<BillingDTO>; placeholder?: string }) => (
    <div><div className="text-xs text-secondary mb-1">{label}</div>
      <Input value={v(k)} placeholder={placeholder} onChange={(e) => setDraft(p => ({ ...p, [k]: e.currentTarget.value || null }))} />
    </div>
  );

  return (
    <div className="space-y-4">
      {loading && <div className="text-sm text-secondary">Loading billing…</div>}
      {err && <div className="text-sm text-red-600">Error: {err}</div>}
      {!loading && !err && (
        <SectionCard
          title="Billing"
          right={mode === "edit" && (
            <div className="flex gap-2">
              <Button onClick={async () => {
                try {
                  const body = {
                    provider: draft.provider !== undefined ? draft.provider : (billing as any)?.provider ?? null,
                    customerId: draft.customerId !== undefined ? draft.customerId : (billing as any)?.customerId ?? null,
                    subscriptionId: draft.subscriptionId !== undefined ? draft.subscriptionId : (billing as any)?.subscriptionId ?? null,
                    plan: draft.plan !== undefined ? draft.plan : (billing as any)?.plan ?? null,
                    status: draft.status !== undefined ? draft.status : (billing as any)?.status ?? null,
                    currentPeriodEnd: draft.currentPeriodEnd !== undefined ? draft.currentPeriodEnd : (billing as any)?.currentPeriodEnd ?? null,
                  };
                  const saved = await adminApi.patchBilling(tenantId, body as any);
                  setBilling(saved); setDraft({}); onDirty(false);
                } catch (e: any) { alert(e?.message || "Save failed"); }
              }}>Save</Button>
              <Button variant="outline" onClick={() => setDraft({})}>Reset</Button>
            </div>
          )}
        >
          {mode === "view" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Read label="Provider" value={(billing as any)?.provider || "—"} />
              <Read label="Plan" value={(billing as any)?.plan || "—"} />
              <Read label="Status" value={(billing as any)?.status || "—"} />
              <Read label="Customer ID" value={(billing as any)?.customerId || "—"} />
              <Read label="Subscription ID" value={(billing as any)?.subscriptionId || "—"} />
              <Read label="Current Period End" value={fmtDate((billing as any)?.currentPeriodEnd) || "—"} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Edit label="Provider" k="provider" />
              <Edit label="Plan" k="plan" />
              <Edit label="Status" k="status" />
              <Edit label="Customer ID" k="customerId" />
              <Edit label="Subscription ID" k="subscriptionId" />
              <Edit label="Current Period End (ISO)" k="currentPeriodEnd" placeholder="2025-01-31T23:59:59.000Z" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1 uppercase tracking-wide">Created</div>
              <div className="text-sm text-primary">{fmtDate((billing as any)?.createdAt) || "—"}</div>
            </div>
            <div className="rounded border border-hairline bg-surface px-3 py-2">
              <div className="text-xs text-secondary mb-1 uppercase tracking-wide">Updated</div>
              <div className="text-sm text-primary">{fmtDate((billing as any)?.updatedAt) || "—"}</div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

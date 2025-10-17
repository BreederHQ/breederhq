// App-Admin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { components } from "@bhq/ui";

/** ─────────────────────────────────────────────────────────────────────────────
 * Types (aligned to API spec)
 * ──────────────────────────────────────────────────────────────────────────── */

type ID = number;
type SortDir = "asc" | "desc";
type SortRule = { key: keyof TenantRow; dir: SortDir };

type BillingDTO =
  | {
    provider: string | null;
    customerId: string | null;
    subscriptionId: string | null;
    plan: string | null;
    status: string | null;
    currentPeriodEnd: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }
  | null;

type TenantDTO = {
  id: ID;
  name: string;
  primaryEmail: string | null;
  usersCount: number;
  organizationsCount: number;
  contactsCount: number;
  animalsCount: number;
  billing: BillingDTO;
  createdAt: string;
  updatedAt: string;
};

type TenantRow = TenantDTO;

type TenantPatchBody = Partial<{
  name: string;
  primaryEmail: string | null;
}>;

type TenantUserDTO = {
  userId: string;
  email: string;
  name?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BILLING" | "VIEWER";
  verified: boolean;
  createdAt?: string | null;
  isSuperAdmin?: boolean;
};

type AddUserBody = {
  email: string;
  name?: string;
  role: TenantUserDTO["role"];
};

type BillingPatchBody = Partial<{
  provider: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null; // ISO or null
}>;

/** ─────────────────────────────────────────────────────────────────────────────
 * Storage keys
 * ──────────────────────────────────────────────────────────────────────────── */

const COL_STORAGE_KEY = "bhq_admin_tenants_cols_v2";
const SORT_STORAGE_KEY = "bhq_admin_tenants_sorts_v2";
const Q_STORAGE_KEY = "bhq_admin_tenants_q_v2";
const PAGE_SIZE_STORAGE_KEY = "bhq_admin_tenants_page_size_v2";
const FILTERS_STORAGE_KEY = "bhq_admin_tenants_filters_v2";
const SHOW_FILTERS_STORAGE_KEY = "bhq_admin_tenants_show_filters_v2";

/** ─────────────────────────────────────────────────────────────────────────────
 * Columns
 * ──────────────────────────────────────────────────────────────────────────── */

type ColumnDef = {
  key: keyof TenantRow & string;
  label: string;
  default?: boolean;
  type?: "text" | "date" | "number";
  center?: boolean;
  render?: (r: TenantRow) => React.ReactNode;
};

const ALL_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Tenant", default: true, type: "text" },
  {
    key: "primaryEmail",
    label: "Email",
    default: true,
    type: "text",
    render: (r) => r.primaryEmail || "—",
  },
  {
    key: "usersCount",
    label: "Users",
    default: true,
    type: "number",
    center: true,
    render: (r) => <span className="tabular-nums">{r.usersCount ?? 0}</span>,
  },
  {
    key: "organizationsCount",
    label: "Orgs",
    default: false,
    type: "number",
    center: true,
    render: (r) => <span className="tabular-nums">{r.organizationsCount ?? 0}</span>,
  },
  {
    key: "contactsCount",
    label: "Contacts",
    default: false,
    type: "number",
    center: true,
    render: (r) => <span className="tabular-nums">{r.contactsCount ?? 0}</span>,
  },
  {
    key: "animalsCount",
    label: "Animals",
    default: true,
    type: "number",
    center: true,
    render: (r) => <span className="tabular-nums">{r.animalsCount ?? 0}</span>,
  },
  {
    key: "createdAt",
    label: "Created",
    default: true,
    type: "date",
    center: true,
    render: (r) => formatDate(r.createdAt) || "—",
  },
  {
    key: "updatedAt",
    label: "Updated",
    default: false,
    type: "date",
    center: true,
    render: (r) => formatDate(r.updatedAt) || "—",
  },
];

/** ─────────────────────────────────────────────────────────────────────────────
 * Small utils
 * ──────────────────────────────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function getEventValue(e: any): string {
  if (e && typeof e.persist === "function") e.persist();
  if (e && typeof e === "object") {
    const v =
      (e.currentTarget && "value" in e.currentTarget ? e.currentTarget.value : undefined) ??
      (e.target && "value" in e.target ? e.target.value : undefined);
    return v != null ? String(v) : "";
  }
  return e != null ? String(e) : "";
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function formatOrUnknown(iso?: string | null) {
  return formatDate(iso) || "Unknown";
}
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** ─────────────────────────────────────────────────────────────────────────────
 * API client — strictly /api/v1 (same-origin unless VITE_API_URL given)
 * ──────────────────────────────────────────────────────────────────────────── */

function apiBase() {
  const w = window as any;
  const base = w.__BHQ_API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || location.origin;
  const trimmed = String(base).replace(/\/+$/, "");
  // Ensure it ends with /api/v1
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

async function http<T>(path: string, init?: RequestInit & { json?: any }): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const body = init?.json != null ? JSON.stringify(init.json) : init?.body;
  if (init?.json != null) headers["Content-Type"] = "application/json";

  // Add CSRF header for unsafe methods (server sets XSRF-TOKEN cookie)
  const method = (init?.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = getCookie("XSRF-TOKEN");
    if (token) {
      // Send only the header the server expects/whitelists
      headers["X-CSRF-Token"] = token;
    }
    // Do NOT send extra custom headers (keeps preflight happy)
  }

  const url = `${apiBase()}${path}`;
  const res = await fetch(url, { credentials: "include", ...init, headers, body });

  const ct = res.headers.get("content-type") || "";
  const parse = async () => (ct.includes("json") ? res.json() : res.text());

  if (!res.ok) {
    const data = (await parse()) as any;
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (await parse()) as T;
}

type SessionUser = { id: string; email: string; name?: string | null; isSuperAdmin?: boolean | null };

async function getSessionUser(): Promise<{ user: SessionUser | null }> {
  // primary: /session (works in your logs)
  try {
    const res = await http<any>(`/session`);
    // accept { user } or a raw user object, just in case
    const user = (res?.user ?? (res?.id ? res : null)) as SessionUser | null;
    return { user: user ?? null };
  } catch {
    // fallback (older builds might expose /me or /user)
    try {
      const res = await http<any>(`/me`);
      const user = (res?.user ?? (res?.id ? res : null)) as SessionUser | null;
      return { user: user ?? null };
    } catch {
      return { user: null };
    }
  }
}

const API = {
  listTenants: (p: { q?: string; page?: number; limit?: number; sort?: string }) =>
    http<{ items: TenantDTO[]; total: number }>(
      `/tenants?` +
      new URLSearchParams({
        ...(p.q ? { q: p.q } : {}),
        ...(p.page ? { page: String(p.page) } : {}),
        ...(p.limit ? { limit: String(p.limit) } : {}),
        ...(p.sort ? { sort: p.sort } : {}),
      }).toString()
    ),
  getTenant: (id: ID) => http<TenantDTO>(`/tenants/${id}`),
  patchTenant: (id: ID, body: TenantPatchBody) => http<TenantDTO>(`/tenants/${id}`, { method: "PATCH", json: body }),

  // Billing
  getBilling: (id: ID) => http<BillingDTO>(`/tenants/${id}/billing`),
  patchBilling: (id: ID, body: BillingPatchBody) =>
    http<BillingDTO>(`/tenants/${id}/billing`, { method: "PATCH", json: body }),

  // Memberships
  listUsers: (tenantId: ID, p?: { q?: string; role?: string; page?: number; limit?: number }) =>
    http<{ items: TenantUserDTO[]; total: number }>(
      `/tenants/${tenantId}/users?` +
      new URLSearchParams({
        ...(p?.q ? { q: p.q } : {}),
        ...(p?.role ? { role: p.role } : {}),
        ...(p?.page ? { page: String(p.page) } : {}),
        ...(p?.limit ? { limit: String(p.limit) } : {}),
      }).toString()
    ),
  addUser: (tenantId: ID, body: AddUserBody) =>
    http<TenantUserDTO>(`/tenants/${tenantId}/users`, { method: "POST", json: body }),
  setRole: (tenantId: ID, userId: string, role: TenantUserDTO["role"]) =>
    http<{ ok: true }>(`/tenants/${tenantId}/users/${userId}/role`, { method: "PUT", json: { role } }),
  verifyEmail: (tenantId: ID, userId: string) =>
    http<{ ok: true }>(`/tenants/${tenantId}/users/${userId}/verify-email`, { method: "POST" }),
  resetPassword: (tenantId: ID, userId: string) =>
    http<{ ok: true }>(`/tenants/${tenantId}/users/${userId}/reset-password`, { method: "POST" }),
  removeUser: (tenantId: ID, userId: string) =>
    http<{ ok: true }>(`/tenants/${tenantId}/users/${userId}`, { method: "DELETE" }),
  setPassword: (tenantId: ID, userId: string, password: string) =>
    http<{ ok: true }>(`/tenants/${tenantId}/users/${userId}/password`, {
      method: "PUT",
      json: { password },
    }),

  // Admin-only: create tenant + owner + (optional) billing in one step
  adminProvisionTenant: (body: {
    tenant: { name: string; primaryEmail?: string | null };
    owner: { email: string; name?: string | null; verify?: boolean; makeDefault?: boolean };
    billing?:
    | {
      provider?: string | null;
      customerId?: string | null;
      subscriptionId?: string | null;
      plan?: string | null;
      status?: string | null;
      currentPeriodEnd?: string | null;
    }
    | undefined;
  }) =>
    http<{
      tenant: { id: ID; name: string; primaryEmail: string | null; createdAt: string; updatedAt: string };
      owner: { id: string; email: string; name: string | null; verified: boolean; isSuperAdmin: boolean; createdAt: string };
      billing: BillingPatchBody | null;
    }>(`/tenants/admin-provision`, { method: "POST", json: body }),
};

/** ─────────────────────────────────────────────────────────────────────────────
 * App
 * ──────────────────────────────────────────────────────────────────────────── */

export default function AppAdmin() {
  // announce active module once on mount
  React.useEffect(() => {
    const label = "Admin";
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { label } }));
    try {
      localStorage.setItem("BHQ_LAST_MODULE", label);
    } catch { }
  }, []);

  /** Prefs */
  const [columns, setColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(COL_STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : ALL_COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: !!c.default }), {} as Record<string, boolean>);
  });
  useEffect(() => {
    const valid = new Set(ALL_COLUMNS.map((c) => String(c.key)));
    const hasStale = Object.keys(columns).some((k) => !valid.has(k));
    if (hasStale) {
      const next: Record<string, boolean> = {};
      ALL_COLUMNS.forEach((c) => {
        next[String(c.key)] = !!columns[String(c.key)];
      });
      setColumns(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sorts, setSorts] = useState<SortRule[]>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [q, setQ] = useState<string>(() => localStorage.getItem(Q_STORAGE_KEY) || "");
  const dq = useDebounced(q, 250);

  const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY) || 25));
  const [page, setPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(() => localStorage.getItem(SHOW_FILTERS_STORAGE_KEY) === "1");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  /** Data + drawer state */
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<TenantRow[]>([]);

  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"overview" | "users" | "billing" | "audit">("overview");

  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [draft, setDraft] = useState<Partial<TenantRow> | null>(null);
  const [billing, setBilling] = useState<BillingDTO>(null);
  const [billingDraft, setBillingDraft] = useState<BillingPatchBody>({});
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [drawerError, setDrawerError] = useState<string>("");

  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerEmail, setOwnerEmail] = useState<string>("");

  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);

  const [me, setMe] = useState<SessionUser | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  // Load current session user (for Super Admin gating)
  useEffect(() => {
    let ignore = false;
    getSessionUser()
      .then((res) => {
        if (!ignore) setMe(res.user || null);
      })
      .catch(() => {
        if (!ignore) setMe(null);
      });
    return () => {
      ignore = true;
    };
  }, []);

  /** Persist prefs */
  useEffect(() => {
    localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);
  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sorts));
  }, [sorts]);
  useEffect(() => {
    localStorage.setItem(Q_STORAGE_KEY, q);
  }, [q]);
  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);
  useEffect(() => {
    localStorage.setItem(SHOW_FILTERS_STORAGE_KEY, showFilters ? "1" : "0");
  }, [showFilters]);

  /** Fetch list */
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    const sortParam = sorts
      .map((s) => `${s.dir === "desc" ? "-" : ""}${String(s.key)}`)
      // only allow what API accepts; ignore unknowns
      .filter((k) => ["name", "createdAt", "updatedAt"].includes(k.replace(/^-/, "")))
      .join(",");
    API.listTenants({
      q: dq || undefined,
      limit: pageSize,
      page,
      sort: sortParam || undefined,
    })
      .then((res) => {
        if (ignore) return;
        const items = res.items || [];
        setRows(items);
        setTotal(res.total ?? items.length ?? 0);
      })
      .catch((e: any) => {
        if (!ignore) setError(e?.message || "Failed to load tenants");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [dq, pageSize, page, sorts]);

  // Load selected tenant + billing + owner for drawer
  useEffect(() => {
    if (!isDrawerOpen || selectedId == null) return;
    let ignore = false;
    setDrawerLoading(true);
    setDrawerError("");
    setTenant(null);
    setBilling(null);
    setOwnerName("");
    setOwnerEmail("");

    Promise.all([
      API.getTenant(selectedId),
      API.getBilling(selectedId),
      // try OWNER first, then ADMIN as a fallback
      API.listUsers(selectedId, { role: "OWNER", page: 1, limit: 5 }).catch(() => ({ items: [], total: 0 })),
      API.listUsers(selectedId, { role: "ADMIN", page: 1, limit: 5 }).catch(() => ({ items: [], total: 0 })),
    ])
      .then(([dto, bill, ownersRes, adminsRes]) => {
        if (ignore) return;
        setTenant(dto);
        setBilling(bill);
        setBillingDraft({});

        const owners = ownersRes?.items ?? [];
        const admins = adminsRes?.items ?? [];
        const picked = owners[0] ?? admins[0] ?? null;

        setOwnerName(picked?.name || picked?.email || "");
        setOwnerEmail(picked?.email || "");
      })
      .catch((e: any) => {
        if (!ignore) setDrawerError(e?.message || "Failed to load tenant");
      })
      .finally(() => {
        if (!ignore) setDrawerLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isDrawerOpen, selectedId, drawerRefreshKey]);

  /** Derived rows: (client-side) filter + sort + page */
  const dFilters = useDebounced(filters, 250);

  const filteredRows = useMemo(() => {
    const text = (dFilters.__text || "").trim().toLowerCase();
    const inRange = (iso?: string | null, start?: string, end?: string) => {
      if (!start && !end) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (start) {
        const s = new Date(start).getTime();
        if (!Number.isNaN(s) && t < s) return false;
      }
      if (end) {
        const e = new Date(end).getTime();
        if (!Number.isNaN(e) && t > e) return false;
      }
      return true;
    };

    return rows.filter((r) => {
      if (text) {
        const hay = [r.name, r.primaryEmail || "", r.billing?.plan || "", r.billing?.status || ""].map((v) =>
          String(v || "").toLowerCase()
        );
        if (!hay.some((h) => h.includes(text))) return false;
      }
      const emailQ = (dFilters.primaryEmail || "").toLowerCase();
      if (emailQ && !String(r.primaryEmail || "").toLowerCase().includes(emailQ)) return false;
      if (!inRange(r.createdAt, dFilters.createdAtStart, dFilters.createdAtEnd)) return false;
      if (!inRange(r.updatedAt, dFilters.updatedAtStart, dFilters.updatedAtEnd)) return false;

      return true;
    });
  }, [rows, dFilters]);

  const sortedRows = useMemo(() => {
    if (sorts.length === 0) return filteredRows;
    const copy = [...filteredRows];
    const comps = sorts
      .map((s) => {
        const field = String(s.key);
        const dir = s.dir === "asc" ? 1 : -1;
        // only fields API allows; others are ignored here to mirror server
        if (!["name", "createdAt", "updatedAt"].includes(field)) return null;
        return (a: TenantRow, b: TenantRow) => {
          const av = (a as any)[field] ?? "";
          const bv = (b as any)[field] ?? "";
          if (av === bv) return 0;
          return av > bv ? dir : -dir;
        };
      })
      .filter(Boolean) as ((a: TenantRow, b: TenantRow) => number)[];
    if (!comps.length) return copy;
    copy.sort((a, b) => {
      for (const cmp of comps) {
        const r = cmp(a, b);
        if (r !== 0) return r;
      }
      return 0;
    });
    return copy;
  }, [filteredRows, sorts]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(pageCount, Math.max(1, page));
  const pageRows = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, clampedPage, pageSize]);

  /** Handlers */
  const toggleColumn = (k: string) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }));
  const cycleSort = (key: keyof TenantRow, withShift: boolean) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      if (!withShift) {
        if (idx === -1) return [{ key, dir: "asc" }];
        if (prev[idx].dir === "asc") return [{ key, dir: "desc" }];
        return [];
      }
      if (idx === -1) return [...prev, { key, dir: "asc" }];
      const cur = prev[idx];
      if (cur.dir === "asc") {
        const copy = prev.slice();
        copy[idx] = { key, dir: "desc" };
        return copy;
      }
      const copy = prev.slice();
      copy.splice(idx, 1);
      return copy;
    });
    setPage(1);
  };
  const toggleSelectAll = () =>
    setSelected((prev) => (prev.size === pageRows.length ? new Set() : new Set(pageRows.map((r) => r.id))));
  const toggleSelect = (id: ID) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /** Visible cols + drawer data */
  const visibleCols = useMemo(() => ALL_COLUMNS.filter((c) => columns[String(c.key)]), [columns]);
  const d = useMemo(() => (tenant ? { ...tenant, ...(draft || {}) } : null), [tenant, draft]);

  /** ───────────────────────────────── UI ───────────────────────────────── */
  return (
    <>
      <div className="space-y-3">
        {error && (
          <div className="rounded-md border border-hairline bg-surface-strong px-3 py-2 text-sm text-secondary">
            {error}
          </div>
        )}

        <components.Card className="bhq-components.Card bg-surface/80 bg-gradient-to-b from-[hsl(var(--glass))/65] to-[hsl(var(--glass-strong))/85] backdrop-blur-sm border border-hairline transition-shadow">
          {/* Toolbar */}
          <div className="bhq-section-fixed p-4 sm:p-5 bg-surface bg-gradient-to-b from-[hsl(var(--glass))/35] to-[hsl(var(--glass-strong))/55] rounded-t-xl overflow-hidden">
            <div className="flex items-center gap-3 justify-between min-w-0">
              {/* Search (fills available space) */}
              <div className="pr-2 flex-1 min-w-0">
                <div className="relative w-full">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  <components.Input
                    value={q}
                    onChange={(e) => {
                      const v = e.currentTarget?.value ?? "";
                      setQ(v);
                      setPage(1);
                    }}
                    placeholder="Search name, email, plan/status…"
                    aria-label="Search tenants"
                    className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] focus:outline-none"
                  />

                  {q && (
                    <components.Button
                      type="components.Button"
                      aria-label="Clear search"
                      onClick={() => setQ("")}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </components.Button>
                  )}

                  <span aria-hidden className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-px bg-hairline" />

                  <components.Button
                    type="components.Button"
                    aria-label="Toggle filters"
                    aria-pressed={showFilters ? "true" : "false"}
                    onClick={(e) => {
                      setShowFilters((v) => !v);
                      (e.currentTarget as HTMLButtonElement).blur();
                    }}
                    className={[
                      "absolute right-2 top-1/2 -translate-y-1/2",
                      "inline-grid place-items-center h-7 w-7 rounded-full",
                      showFilters ? "bg-[hsl(var(--brand-orange))] text-black" : "text-secondary hover:bg-white/10 focus:bg-white/10",
                    ].join(" ")}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="4" y1="7" x2="14" y2="7" />
                      <circle cx="18" cy="7" r="1.5" fill="currentColor" />
                      <line x1="4" y1="12" x2="11" y2="12" />
                      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                      <line x1="4" y1="17" x2="12" y2="17" />
                      <circle cx="16" cy="17" r="1.5" fill="currentColor" />
                    </svg>
                  </components.Button>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex-none">
                {me?.isSuperAdmin && (
                  <components.Button onClick={() => setCreateOpen(true)}>
                    New tenant
                  </components.Button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bhq-section-fixed mt-2 rounded-xl border border-hairline bg-surface-strong/70 p-3 sm:p-4">
              <FilterRow columns={columns} filters={filters} onChange={setFilters} />
              {Object.entries(filters).some(([, v]) => !!v) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {Object.entries(filters)
                    .filter(([, v]) => !!v)
                    .map(([k, v]) => (
                      <components.Button
                        key={k}
                        type="components.Button"
                        onClick={() => setFilters({ ...filters, [k]: "" })}
                        className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2 py-0.5 text-xs"
                        title={`${k}: ${v}`}
                      >
                        <span className="max-w-[16ch] truncate">
                          {k}: {v}
                        </span>
                        <span aria-hidden>×</span>
                      </components.Button>
                    ))}
                  <components.Button variant="outline" size="sm" onClick={() => setFilters({})}>
                    Clear all
                  </components.Button>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="bhq-table overflow-hidden" data-admin-align-top>
            <div className="overflow-x-auto overscroll-contain">
              <table className="min-w-max w-full text-sm">
                <thead className="sticky top-0 z-10 bg-surface-strong border-b border-hairline">
                  <tr className="text-sm">
                    <th className="px-3 py-2 w-10 text-center">
                      <components.Input
                        type="checkbox"
                        aria-label="Select all"
                        checked={pageRows.length > 0 && selected.size === pageRows.length}
                        onChange={toggleSelectAll}
                      />
                    </th>

                    {visibleCols.map((c) => {
                      const active = sorts.find((s) => s.key === c.key);
                      const ariaSort = active ? (active.dir === "asc" ? "ascending" : "descending") : "none";
                      return (
                        <th
                          key={String(c.key)}
                          className={[
                            "px-3 py-3 cursor-pointer select-none transition-colors text-center",
                            active ? "text-primary" : "text-secondary",
                            "hover:bg-[hsl(var(--brand-orange))]/12",
                          ].join(" ")}
                          onClick={(e) => cycleSort(c.key, (e as any).shiftKey)}
                          role="components.Button"
                          aria-sort={ariaSort}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") cycleSort(c.key, e.shiftKey);
                          }}
                          title={active ? `${c.label} (${active.dir})` : `Sort by ${c.label}`}
                        >
                          <div className="inline-flex items-center gap-1">
                            <span>{c.label}</span>
                            {active ? (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-orange))]" />
                            ) : (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-transparent" />
                            )}
                          </div>
                        </th>
                      );
                    })}

                    <th className="px-3 py-2 w-16 text-center">
                      <ColumnsPopover columns={columns} onToggle={toggleColumn} onSet={setColumns} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-3 py-2 text-center">
                          <div className="h-4 w-4 rounded bg-surface-strong inline-block" />
                        </td>
                        {visibleCols.map((c, j) => (
                          <td key={`${i}-${j}`} className="px-3 py-2 text-center">
                            <div className="h-4 w-[70%] rounded bg-surface-strong mx-auto" />
                          </td>
                        ))}
                        <td className="px-3 py-2" />
                      </tr>
                    ))}

                  {!loading && pageRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-8" colSpan={visibleCols.length + 2}>
                        <components.EmptyState title="No tenants match your filters" description="Try adjusting filters." />
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    pageRows.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => {
                          setSelectedId(r.id);
                          setIsDrawerOpen(true);
                          setDrawerTab("overview");
                          setDrawerRefreshKey((k) => k + 1);
                        }}
                        className="cursor-pointer transition-colors hover:bg-[hsl(var(--brand-orange))]/8"
                      >
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <components.Input
                            type="checkbox"
                            aria-label={`Select ${r.name || r.id}`}
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        {visibleCols.map((c) => (
                          <td key={`${r.id}-${String(c.key)}`} className="px-3 py-2 text-sm text-center">
                            {c.render ? c.render(r) : (r as any)[c.key] ?? ""}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()} />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bhq-section-fixed flex items-start justify-between px-3 py-2 text-sm">
            <div className="flex flex-col items-start">
              <div className="text-secondary">
                Showing {pageRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1} to{" "}
                {Math.min(clampedPage * pageSize, total)} of {total}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="hidden sm:flex items-center gap-2 text-xs text-secondary">
                <span>Rows</span>
                <div className="relative">
                  <select
                    className="appearance-none pr-8 bg-surface-strong border border-hairline rounded px-2 py-1 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                    value={String(pageSize)}
                    onChange={(e) => {
                      const v = Number(getEventValue(e));
                      setPageSize(v);
                      setPage(1);
                    }}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </label>
              <components.Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={clampedPage === 1}>
                Prev
              </components.Button>
              <div>Page {clampedPage} of {pageCount}</div>
              <components.Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={clampedPage === pageCount}>
                Next
              </components.Button>
            </div>
          </div>
        </components.Card>
      </div>

      {/* Drawer */}
      {isDrawerOpen && selectedId != null && (
        <AnchoredCenterModal
          onClose={() => {
            setIsDrawerOpen(false);
            setDrawerEditing(false);
            setDraft(null);
            setBillingDraft({});
          }}
          title={tenant?.name || String(selectedId ?? "") || "Tenant"}
        >
          {/* Drawer header (tabs + actions) */}
          <div className="border-b border-hairline mb-3 px-4 bg-surface">
            <div className="flex items-center gap-3 py-2">
              <div className="flex gap-2">
                <TabButton active={drawerTab === "overview"} onClick={() => setDrawerTab("overview")}>Overview</TabButton>
                <TabButton active={drawerTab === "users"} onClick={() => setDrawerTab("users")}>Users</TabButton>
                <TabButton active={drawerTab === "billing"} onClick={() => setDrawerTab("billing")}>Billing</TabButton>
                <TabButton active={drawerTab === "audit"} onClick={() => setDrawerTab("audit")}>Audit</TabButton>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {drawerTab === "overview" && (
                  <>
                    {drawerEditing ? (
                      <>
                        <components.Button
                          onClick={async () => {
                            if (!selectedId) return;
                            try {
                              await API.patchTenant(selectedId, {
                                name: (draft?.name ?? tenant?.name) as string,
                                primaryEmail:
                                  draft?.primaryEmail === undefined
                                    ? (tenant?.primaryEmail ?? null)
                                    : (draft?.primaryEmail as string | null),
                              });
                              setDraft(null);
                              setDrawerEditing(false);
                              setDrawerRefreshKey((k) => k + 1);
                            } catch (e: any) {
                              alert(e?.message || "Save failed");
                            }
                          }}
                        >
                          Save
                        </components.Button>
                        <components.Button variant="outline" onClick={() => { setDraft(null); setDrawerEditing(false); }}>
                          Cancel
                        </components.Button>
                      </>
                    ) : (
                      <components.Button onClick={() => setDrawerEditing(true)}>
                        Edit
                      </components.Button>
                    )}
                  </>
                )}
                <div className="text-xs text-secondary">{drawerLoading ? "Loading…" : drawerError || ""}</div>
              </div>
            </div>
          </div>

          {/* Drawer body (tabs) */}
          {drawerTab === "overview" && (
            <div className="p-4">
              <div className="mx-auto w-full max-w-none space-y-4">
                <SectionCard title="Tenant">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FieldRow label="Name">
                      {drawerEditing ? (
                        <components.Input
                          className="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] text-primary placeholder:text-secondary"
                          value={String(d?.name ?? "")}
                          onChange={(e) => setDraft((p) => ({ ...(p || {}), name: getEventValue(e) }))}
                        />
                      ) : (
                        <span className="truncate text-primary">{tenant?.name || "—"}</span>
                      )}
                    </FieldRow>

                    <FieldRow label="Owner" className="sm:col-span-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-primary whitespace-normal break-words"
                          title={ownerName}
                        >
                          {ownerName || "—"}
                        </span>
                        {ownerEmail && (
                          <span
                            className="text-secondary text-xs whitespace-normal break-all"
                            title={ownerEmail}
                          >
                            ({ownerEmail})
                          </span>
                        )}
                      </div>
                    </FieldRow>
                  </div>
                </SectionCard>

                <SectionCard title="Roll-ups">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat label="Users" value={<span className="tabular-nums">{tenant?.usersCount ?? 0}</span>} />
                    <MiniStat label="Organizations" value={<span className="tabular-nums">{tenant?.organizationsCount ?? 0}</span>} />
                    <MiniStat label="Contacts" value={<span className="tabular-nums">{tenant?.contactsCount ?? 0}</span>} />
                    <MiniStat label="Animals" value={<span className="tabular-nums">{tenant?.animalsCount ?? 0}</span>} />
                  </div>
                </SectionCard>

                <SectionCard title="Dates">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MiniStat label="Created" value={formatDate(tenant?.createdAt)} />
                    <MiniStat label="Updated" value={formatDate(tenant?.updatedAt)} />
                    <MiniStat
                      label="Billing period end"
                      value={tenant?.billing?.currentPeriodEnd ? formatDate(tenant.billing.currentPeriodEnd) : "—"}
                    />
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {drawerTab === "users" && selectedId != null && (
            <div className="p-4">
              <TenantUsers tenantId={selectedId} />
            </div>
          )}

          {drawerTab === "billing" && (
            <div className="p-4 space-y-4">
              <SectionCard
                title="Billing"
                right={
                  <div className="flex gap-2">
                    <components.Button
                      onClick={async () => {
                        if (!selectedId) return;
                        try {
                          const body: BillingPatchBody = {
                            provider: billingDraft.provider !== undefined ? billingDraft.provider : (billing?.provider ?? null),
                            customerId: billingDraft.customerId !== undefined ? billingDraft.customerId : (billing?.customerId ?? null),
                            subscriptionId: billingDraft.subscriptionId !== undefined ? billingDraft.subscriptionId : (billing?.subscriptionId ?? null),
                            plan: billingDraft.plan !== undefined ? billingDraft.plan : (billing?.plan ?? null),
                            status: billingDraft.status !== undefined ? billingDraft.status : (billing?.status ?? null),
                            currentPeriodEnd: billingDraft.currentPeriodEnd !== undefined ? billingDraft.currentPeriodEnd : (billing?.currentPeriodEnd ?? null),
                          };
                          const saved = await API.patchBilling(selectedId, body);
                          setBilling(saved);
                          setBillingDraft({});
                        } catch (e: any) {
                          alert(e?.message || "Save failed");
                        }
                      }}
                    >
                      Save
                    </components.Button>
                    <components.Button variant="outline" onClick={() => setBillingDraft({})}>Reset</components.Button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Labeled value={billingDraft.provider ?? billing?.provider ?? ""} label="Provider" onChange={(v) => setBillingDraft((p) => ({ ...p, provider: v || null }))} />
                  <Labeled value={billingDraft.plan ?? billing?.plan ?? ""} label="Plan" onChange={(v) => setBillingDraft((p) => ({ ...p, plan: v || null }))} />
                  <Labeled value={billingDraft.status ?? billing?.status ?? ""} label="Status" onChange={(v) => setBillingDraft((p) => ({ ...p, status: v || null }))} />
                  <Labeled value={billingDraft.customerId ?? billing?.customerId ?? ""} label="Customer ID" onChange={(v) => setBillingDraft((p) => ({ ...p, customerId: v || null }))} />
                  <Labeled value={billingDraft.subscriptionId ?? billing?.subscriptionId ?? ""} label="Subscription ID" onChange={(v) => setBillingDraft((p) => ({ ...p, subscriptionId: v || null }))} />
                  <Labeled
                    value={billingDraft.currentPeriodEnd ?? billing?.currentPeriodEnd ?? ""}
                    label="Current Period End (ISO or empty)"
                    onChange={(v) => setBillingDraft((p) => ({ ...p, currentPeriodEnd: v || null }))}
                    placeholder="2025-01-31T23:59:59.000Z"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <MiniStat label="Created" value={formatOrUnknown(billing?.createdAt)} />
                  <MiniStat label="Updated" value={formatOrUnknown(billing?.updatedAt)} />
                </div>
              </SectionCard>
            </div>
          )}

          {drawerTab === "audit" && (
            <div className="p-4 space-y-4">
              <SectionCard title="Dates">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MiniStat label="Created" value={formatOrUnknown(tenant?.createdAt)} />
                  <MiniStat label="Last Modified" value={formatOrUnknown(tenant?.updatedAt)} />
                </div>
              </SectionCard>
              <SectionCard title="Change Log">
                <div className="text-secondary text-sm">No audit entries (placeholder).</div>
              </SectionCard>
            </div>
          )}
        </AnchoredCenterModal>
      )}
      {createOpen && (
        <ProvisionTenantModal
          onClose={() => setCreateOpen(false)}
          onCreated={(tenantId) => {
            setCreateOpen(false);
            setPage(1);
            setSelectedId(tenantId);
            setIsDrawerOpen(true);
            setDrawerTab("overview");
            setDrawerRefreshKey((k) => k + 1);
          }}
        />
      )}
      {/* === END #5 === */}
    </>
  );
}

/** ───────────────────────── Users tab ───────────────────────── */

function TenantUsers({ tenantId }: { tenantId: ID }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [items, setItems] = React.useState<TenantUserDTO[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(50);

  const [addEmail, setAddEmail] = React.useState("");
  const [addName, setAddName] = React.useState("");
  const [addRole, setAddRole] = React.useState<TenantUserDTO["role"]>("MEMBER");

  const [activeUser, setActiveUser] = React.useState<TenantUserDTO | null>(null);

  const reload = React.useCallback(() => {
    setLoading(true);
    setErr("");
    API.listUsers(tenantId, { page, limit })
      .then((res) => setItems(res.items || []))
      .catch((e: any) => setErr(e?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [tenantId, page, limit]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <div className="text-secondary text-sm">Loading users…</div>;
  if (err) return <div className="text-red-400 text-sm">Error: {err}</div>;

  return (
    <div className="space-y-4 text-primary">
      {/* Add / Invite */}
      <components.Card className="p-3 border border-hairline bg-surface">
        <div className="text-xs uppercase tracking-wide text-secondary mb-2">Add / Invite</div>
        <div className="flex flex-nowrap items-center gap-2">
          <components.Input
            placeholder="email@tenant.test"
            value={addEmail}
            onChange={(e) => setAddEmail(e.currentTarget.value)}
            className="h-10 min-w-0 flex-[2_1_0%] text-primary placeholder:text-secondary"
          />
          <components.Input
            placeholder="Name (optional)"
            value={addName}
            onChange={(e) => setAddName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !addEmail) {
                e.preventDefault();
              }
            }}
            className="h-10 min-w-0 flex-[1.2_1_0%] text-primary placeholder:text-secondary"
          />
          <components.Button
            className="h-10 px-5 flex-none"
            onClick={async () => {
              try {
                if (!addEmail) throw new Error("Email is required");
                await API.addUser(tenantId, { email: addEmail, name: addName || undefined, role: addRole });
                setAddEmail(""); setAddName(""); setAddRole("MEMBER");
                reload();
              } catch (e: any) {
                alert(e?.message || "Add failed");
              }
            }}
          >
            Add
          </components.Button>
        </div>
      </components.Card>

      {/* Users */}
      <components.Card className="p-3 border border-hairline bg-surface">
        <div className="text-xs uppercase tracking-wide text-secondary mb-2">Users</div>
        <div className="overflow-hidden rounded border border-hairline">
          <table className="w-full text-sm">
            <thead className="text-secondary bg-surface-strong">
              <tr>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {items.map((u) => (
                <tr
                  key={u.userId}
                  className="hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
                  onClick={() => setActiveUser(u)}
                >
                  <td className="px-3 py-2 text-primary">
                    <div className="flex items-center gap-2">
                      <span className="break-all">{u.email}</span>

                      {u.isSuperAdmin && (
                        <span
                          className="inline-flex items-center text-[10px] leading-4 px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/40 text-[hsl(var(--brand-orange))]"
                          title="Global platform role"
                        >
                          Super Admin
                        </span>
                      )}

                      {u.verified && (
                        <span
                          className="inline-flex items-center text-[10px] leading-4 px-1 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                          title="Email verified"
                        >
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-primary">{u.name || "—"}</td>
                  <td className="px-3 py-2 text-primary">{u.role}</td>
                  <td className="px-3 py-2 text-primary">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="px-3 py-6 text-secondary" colSpan={4}>No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </components.Card>

      {/* Per-user details modal */}
      {activeUser && (
        <UserDetailsModal
          tenantId={tenantId}
          user={activeUser}
          onClose={() => setActiveUser(null)}
          onChanged={async () => { await reload(); }}
        />
      )}
    </div>
  );
}

function UserDetailsModal({
  tenantId,
  user,
  onClose,
  onChanged,
}: {
  tenantId: ID;
  user: TenantUserDTO;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [working, setWorking] = React.useState(false);
  const [role, setRole] = React.useState<TenantUserDTO["role"]>(user.role);
  const [verified, setVerified] = React.useState(!!user.verified);
  const [newPassword, setNewPassword] = React.useState("");
  const [pwErr, setPwErr] = React.useState("");

  const doSetPassword = async () => {
    try {
      setPwErr("");
      if (!newPassword || newPassword.length < 8) {
        setPwErr("Password must be at least 8 characters.");
        return;
      }
      setWorking(true);
      await API.setPassword(tenantId, user.userId, newPassword);
      setNewPassword("");
      alert("Password updated.");
    } catch (e: any) {
      setPwErr(e?.message || "Set password failed");
    } finally {
      setWorking(false);
    }
  };
  const doSetRole = async () => {
    try {
      setWorking(true);
      await API.setRole(tenantId, user.userId, role);
      await onChanged();
    } catch (e: any) {
      alert(e?.message || "Role update failed");
    } finally {
      setWorking(false);
    }
  };

  const doVerify = async () => {
    try {
      setWorking(true);
      await API.verifyEmail(tenantId, user.userId);
      setVerified(true);
      await onChanged();
    } catch (e: any) {
      alert(e?.message || "Verify failed");
    } finally {
      setWorking(false);
    }
  };

  const doReset = async () => {
    try {
      setWorking(true);
      await API.resetPassword(tenantId, user.userId);
      alert("Password reset email sent.");
    } catch (e: any) {
      alert(e?.message || "Reset failed");
    } finally {
      setWorking(false);
    }
  };

  const doRemove = async () => {
    if (!confirm(`Remove ${user.email} from tenant?`)) return;
    try {
      setWorking(true);
      await API.removeUser(tenantId, user.userId);
      await onChanged();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Remove failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <AnchoredCenterModal onClose={onClose} title={user.email}>
      <div className="p-4 space-y-4 text-primary">
        <SectionCard title="User">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow label="Email"><span className="break-all">{user.email}</span></FieldRow>
            <FieldRow label="Name"><span className="break-words">{user.name || "—"}</span></FieldRow>
            <FieldRow label="Verified"><span>{verified ? "Yes" : "No"}</span></FieldRow>
            <FieldRow label="Created"><span>{formatDate(user.createdAt)}</span></FieldRow>
          </div>
        </SectionCard>

        <SectionCard
          title="Access"
          right={
            <div className="flex items-center gap-2">
              {!verified && <components.Button variant="outline" onClick={doVerify} disabled={working}>Verify</components.Button>}
              <components.Button variant="outline" onClick={doReset} disabled={working}>Reset PW</components.Button>
              <components.Button /* ...remove components.Button... */>
                <TrashIcon className="h-4 w-4" />
              </components.Button>
            </div>
          }
        >
          {/* 👉 INSERT THIS BLOCK (manual password set) */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-3 mb-3">
            <div className="text-sm text-secondary">Set password</div>
            <div className="flex items-center gap-2">
              <components.Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
                placeholder="New password"
                className="w-full"
              />
              {!!pwErr && <span className="text-xs text-red-400">{pwErr}</span>}
            </div>
            <components.Button onClick={doSetPassword} disabled={working || !newPassword}>Save</components.Button>
          </div>

          {/* (existing Role grid stays as-is, below) */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="text-sm text-secondary">Role</div>
            <select
              className="h-10 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              value={role}
              onChange={(e) => setRole(e.currentTarget.value as TenantUserDTO["role"])}
            >
              {["OWNER", "ADMIN", "MEMBER", "BILLING", "VIEWER"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <components.Button onClick={doSetRole} disabled={working || role === user.role}>Save</components.Button>
          </div>
        </SectionCard>
      </div>
    </AnchoredCenterModal>
  );
}

/** ───────────────── New Tenant (trimmed) ───────────────── */

function ProvisionTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (tenantId: number) => void;
}) {
  // Tenant
  const [name, setName] = useState("");

  // Owner
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [verify, setVerify] = useState(true);

  // Owner → Advanced
  const [makeDefault, setMakeDefault] = useState(false);
  const [ownerAdvancedOpen, setOwnerAdvancedOpen] = useState(false);

  // Billing (optional)
  const [billingOpen, setBillingOpen] = useState(false);
  const [advancedBillingOpen, setAdvancedBillingOpen] = useState(false);

  // Minimal billing fields
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");

  // Advanced billing
  const [provider, setProvider] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState("");

  // UX state
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState("");

  const missingName = !name.trim();
  const missingOwnerEmail = !ownerEmail.trim();

  const submit = async () => {
    try {
      setWorking(true);
      setErr("");
      if (!name || !ownerEmail) throw new Error("Tenant name and owner email are required.");

      const billing =
        plan || status || provider || customerId || subscriptionId || currentPeriodEnd
          ? {
            plan: plan || null,
            status: status || null,
            provider: provider || null,
            customerId: customerId || null,
            subscriptionId: subscriptionId || null,
            currentPeriodEnd: currentPeriodEnd || null,
          }
          : undefined;

      const res = await API.adminProvisionTenant({
        tenant: { name, primaryEmail: ownerEmail || null },
        owner: { email: ownerEmail, name: ownerName || null, verify, makeDefault },
        billing,
      });

      onCreated((res as any).tenant.id);
    } catch (e: any) {
      const msg = String(e?.message || "");
      const lower = msg.toLowerCase();
      if (lower.includes("csrf") || lower.includes("xsrf") || lower.includes("forbidden") || lower.includes("403")) {
        setErr("CSRF check failed. Refresh the page and try again.");
      } else {
        setErr(msg || "Create failed");
      }
    } finally {
      setWorking(false);
    }
  };

  return (
    <AnchoredCenterModal onClose={onClose} title="New tenant">
      <div className="p-4 space-y-4">
        {err && <div className="text-red-400 text-sm">{err}</div>}

        {/* Tenant */}
        <SectionCard title="Tenant">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Labeled label="Name" value={name} onChange={setName} />
              {missingName && <div className="mt-1 text-xs text-red-400">Tenant name is required</div>}
            </div>
          </div>
        </SectionCard>

        {/* Owner */}
        <SectionCard
          title="Owner user"
          right={
            <components.Button
              className="text-xs text-secondary hover:underline"
              onClick={() => setOwnerAdvancedOpen((v) => !v)}
            >
              {ownerAdvancedOpen ? "Hide advanced" : "Advanced"}
            </components.Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Labeled label="Owner email" value={ownerEmail} onChange={setOwnerEmail} />
              {missingOwnerEmail && <div className="mt-1 text-xs text-red-400">Owner email is required</div>}
            </div>
            <Labeled label="Owner name (optional)" value={ownerName} onChange={setOwnerName} />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <components.Input type="checkbox" checked={verify} onChange={(e) => setVerify(e.currentTarget.checked)} />
              Verify email now
            </label>

            {ownerAdvancedOpen && (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <components.Input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.currentTarget.checked)}
                />
                Make this the user’s default tenant
              </label>
            )}
          </div>
        </SectionCard>

        {/* Billing (optional) */}
        <SectionCard
          title="Billing (optional)"
          right={
            <div className="flex items-center gap-3">
              <components.Button
                className="text-xs text-secondary hover:underline"
                onClick={() => setAdvancedBillingOpen((v) => !v)}
                disabled={!billingOpen}
                title={billingOpen ? "More billing fields" : "Open billing to access advanced"}
              >
                {advancedBillingOpen ? "Hide advanced" : "Advanced"}
              </components.Button>
              <components.Button variant="outline" size="sm" onClick={() => setBillingOpen((v) => !v)}>
                {billingOpen ? "Remove billing" : "Add billing"}
              </components.Button>
            </div>
          }
        >
          {billingOpen ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Labeled label="Plan" value={plan} onChange={setPlan} />
                <Labeled label="Status" value={status} onChange={setStatus} />
                <Labeled label="Customer ID" value={customerId} onChange={setCustomerId} />
              </div>

              {advancedBillingOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Labeled label="Provider" value={provider} onChange={setProvider} />
                  <Labeled label="Subscription ID" value={subscriptionId} onChange={setSubscriptionId} />
                  <Labeled
                    label="Current period end (ISO)"
                    value={currentPeriodEnd}
                    onChange={setCurrentPeriodEnd}
                    placeholder="2025-01-31T23:59:59.000Z"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-secondary text-sm">No billing will be set up during creation.</div>
          )}
        </SectionCard>

        <div className="flex justify-end gap-2">
          <components.Button variant="outline" onClick={onClose} disabled={working}>Cancel</components.Button>
          <components.Button onClick={submit} disabled={working || missingName || missingOwnerEmail}>
            {working ? "Creating…" : "Create tenant"}
          </components.Button>
        </div>
      </div>
    </AnchoredCenterModal>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** ───────────────────────── Small UI bits ───────────────────────── */

function Labeled({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary mb-1">{label}</label>
      <components.Input
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        className="text-primary placeholder:text-secondary"
      />
    </div>
  );
}

function FieldRow({ label, children, className = "" }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={["grid grid-cols-[auto_1fr] items-center gap-x-2", className].join(" ")}>
      <div className="text-sm text-secondary whitespace-nowrap">{label}:</div>
      <div className="min-w-0 text-sm leading-5 text-primary">{children}</div>
    </div>
  );
}

function SectionCard({ title, children, right, className = "" }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={["rounded-xl border border-hairline bg-surface p-3", className].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide text-secondary">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-hairline bg-surface px-3 py-2">
      <div className="text-xs text-secondary mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-primary">{value}</div>
    </div>
  );
}

function FilterRow({
  columns,
  filters,
  onChange,
}: {
  columns: Record<string, boolean>;
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...filters, [k]: v });
  const visible = ALL_COLUMNS.filter((c) => columns[c.key]);
  const textCols = visible.filter((c) => c.type === "text");
  const dateCols = visible.filter((c) => c.type === "date");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">Search all fields</label>
        <components.Input placeholder="Name, email…" value={filters.__text || ""} onChange={(e) => set("__text", getEventValue(e))} className="w-full" />
      </div>

      {textCols.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["name", "primaryEmail"].filter((k) => textCols.some((c) => c.key === k)).map((k) => {
            const label = k === "primaryEmail" ? "Owner" : k[0].toUpperCase() + k.slice(1);
            const v = (filters as any)[k] || "";
            return (
              <div key={k}>
                <label className="block text-xs font-medium text-secondary mb-1">{label}</label>
                <components.Input placeholder={`Filter ${label}`} value={v} onChange={(e) => set(k, getEventValue(e))} className="w-full" />
              </div>
            );
          })}
        </div>
      )}

      {dateCols.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dateCols.map((c) => {
            const k = String(c.key);
            return (
              <div key={k} className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label} start</label>
                  <components.Input type="date" value={(filters as any)[`${k}Start`] || ""} onChange={(e) => set(`${k}Start`, getEventValue(e))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label} end</label>
                  <components.Input type="date" value={(filters as any)[`${k}End`] || ""} onChange={(e) => set(`${k}End`, getEventValue(e))} className="w-full" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <components.Button variant="outline" size="sm" onClick={() => onChange({})}>
          Clear
        </components.Button>
      </div>
    </div>
  );
}

function ColumnsPopover({
  columns,
  onToggle,
  onSet,
}: {
  columns: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSet: (next: Record<string, boolean>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const W = 320;
    const PAD = 12;

    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const right = Math.min(window.innerWidth - PAD, r.right);
      const left = Math.max(PAD, right - W);
      const estH = 360;
      const below = r.bottom + 8;
      const above = Math.max(PAD, r.top - estH - 8);
      const top = below + estH + PAD > window.innerHeight ? above : Math.min(window.innerHeight - PAD, below);
      setPos({ top, left });
    };

    const getScrollParents = (el: HTMLElement | null) => {
      const out: HTMLElement[] = [];
      let p = el?.parentElement as HTMLElement | null;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) out.push(p);
        p = p.parentElement;
      }
      return out;
    };

    const parents = getScrollParents(btnRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach((n) => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach((n) => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  const selectAll = () => {
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = true));
    onSet(next);
  };
  const clearAll = () => {
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = false));
    onSet(next);
  };
  const setDefault = () => {
    const ON = new Set(["name", "primaryEmail", "usersCount", "animalsCount", "createdAt"]);
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = ON.has(String(c.key))));
    onSet(next);
  };

  const menu =
    open && pos
      ? createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2147483644,
              background: "transparent",
              pointerEvents: "auto",
            }}
          />
          <div
            role="menu"
            data-popover="columns"
            className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
            style={{
              position: "fixed",
              zIndex: 2147483645,
              top: pos.top!,
              left: pos.left!,
              right: "auto",
              bottom: "auto",
              width: 320,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: 360,
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="text-xs font-medium uppercase text-secondary">Show columns</div>
              <div className="flex items-center gap-3">
                <a role="components.Button" tabIndex={0} onClick={selectAll} className="text-xs font-medium hover:underline" style={{ color: "hsl(24 95% 54%)" }}>
                  All
                </a>
                <a role="components.Button" tabIndex={0} onClick={setDefault} className="text-xs font-medium hover:underline" style={{ color: "hsl(190 90% 45%)" }}>
                  Default
                </a>
                <a role="components.Button" tabIndex={0} onClick={clearAll} className="text-xs font-medium text-secondary hover:underline">
                  Clear
                </a>
              </div>
            </div>

            {ALL_COLUMNS.map((c) => {
              const k = String(c.key);
              const checked = !!columns[k];
              return (
                <label
                  key={k}
                  data-col={k}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={checked ? "true" : "false"}
                  className="flex items-center gap-2 w-full min-w-0 px-2 py-1.5 text-[13px] leading-5 rounded hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
                  onClick={() => onToggle(k)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onToggle(k);
                    }
                  }}
                >
                  <components.Input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[hsl(var(--brand-orange))]"
                    aria-label={c.label}
                    checked={checked}
                    onChange={() => onToggle(k)}
                  />
                  <span className="truncate text-primary">{c.label}</span>
                </label>
              );
            })}

            <div className="flex justify-end pt-2">
              <components.Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Close
              </components.Button>
            </div>
          </div>
        </>,
        getOverlayRoot()
      )
      : null;

  return (
    <div className="relative inline-flex">
      <components.Button
        ref={btnRef as any}
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-9 w-9"
        title="Choose columns"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="10" y="4" width="5" height="16" rx="1.5" />
          <rect x="17" y="4" width="4" height="16" rx="1.5" />
        </svg>
      </components.Button>
      {menu}
    </div>
  );
}

/** DetailsDrawer + helpers */

function getOverlayRoot(): HTMLElement {
  let el = document.getElementById("bhq-top-layer") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "bhq-top-layer";
    el.style.position = "relative";
    el.style.zIndex = "2147483646";
    document.body.appendChild(el);
  }
  return el;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <components.Button
      onClick={onClick}
      className={[
        "relative px-3 py-2 text-sm rounded-t-md transition",
        active ? "bg-surface text-primary border-x border-t border-hairline" : "text-secondary hover:bg-[hsl(var(--brand-orange))]/12",
      ].join(" ")}
    >
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-px bg-[hsl(var(--brand-orange))]" />}
    </components.Button>
  );
}

function AnchoredCenterModal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const [padTop, setPadTop] = React.useState(24);
  const [maxH, setMaxH] = React.useState(Math.max(320, window.innerHeight - 48));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  React.useEffect(() => {
    const PADDING_BTM = 24;
    const GAP = 8;

    const compute = () => {
      const anchor =
        document.querySelector<HTMLElement>("[data-admin-align-top]") ||
        document.body;

      const rect = anchor.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset || 0;

      // Align modal's top to the table block's top (plus a tiny gap).
      const topPx = Math.max(12, Math.round(rect.top + scrollY + GAP));
      const available = Math.round(window.innerHeight - (topPx - scrollY) - PADDING_BTM);

      setPadTop(topPx);
      setMaxH(Math.max(280, available));
    };

    compute();
    const onScroll = () => compute();
    const onResize = () => compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // If layout shifts (filters open/close, etc.), recompute.
    const obs = new MutationObserver(compute);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      obs.disconnect();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[2147483647]">
      {/* Dimmer with blur to match Contacts feel */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-saturate-150"
        onClick={onClose}
        aria-hidden
      />

      {/* Flex wrapper for horizontal centering; top spacing via padding */}
      <div
        className="fixed inset-0 p-4 flex justify-center items-start pointer-events-none"
        style={{ paddingTop: padTop }}
      >
        <section
          role="dialog"
          aria-modal="true"
          className={[
            "pointer-events-auto",
            "bg-surface border border-hairline rounded-xl shadow-2xl",
            "flex flex-col shrink-0 box-border"
          ].join(" ")}
          style={{ width: "min(760px, 96vw)", maxHeight: maxH }}
        >
          <header className="flex items-center gap-2 px-4 py-3 border-b border-hairline rounded-t-xl">
            <div className="font-medium truncate text-primary">{title}</div>
            <components.Button
              type="components.Button"
              onClick={onClose}
              className="ml-auto inline-grid place-items-center h-8 w-8 rounded text-secondary hover:text-primary hover:bg-white/10 focus:outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </components.Button>
          </header>

          <div className="flex-1 overflow-auto text-primary">{children}</div>
        </section>
      </div>
    </div>,
    getOverlayRoot()
  );
}

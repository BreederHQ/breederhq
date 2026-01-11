// apps/platform/src/features/useDashboardDataV2.ts
// Enhanced dashboard data hook - loads all dashboard data in parallel from real APIs
// NOTE: This hook bypasses the dashboardRemoteEnabled() gate for critical endpoints

import * as React from "react";
import {
  api,
  type PlanRow,
  type DashboardKPI,
  type DashboardFeedItem,
  type DashboardCounts,
  type AlertItem,
  type AgendaItem,
  type OffspringGroupSummary,
  type WaitlistPressure,
  type FinanceSummary,
} from "../api";

// Direct fetch helper that bypasses the gate
async function directFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    // Resolve scope headers
    const w = (typeof window !== "undefined" ? window : {}) as any;
    const rtTid = Number(w?.__BHQ_TENANT_ID__);
    let lsTid = NaN;
    try { lsTid = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN"); } catch {}
    const tenantId = (Number.isFinite(rtTid) && rtTid > 0 && rtTid) || (Number.isFinite(lsTid) && lsTid > 0 && lsTid) || undefined;

    const rtOid = Number(w?.__BHQ_ORG_ID__);
    let lsOid = NaN;
    try { lsOid = Number(localStorage.getItem("BHQ_ORG_ID") || "NaN"); } catch {}
    const orgId = (Number.isFinite(rtOid) && rtOid > 0 && rtOid) || (Number.isFinite(lsOid) && lsOid > 0 && lsOid) || undefined;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (tenantId) headers["x-tenant-id"] = String(tenantId);
    if (orgId) headers["x-org-id"] = String(orgId);

    const res = await fetch(`/api/v1${path}`, { credentials: "include", headers });
    if (!res.ok) return fallback;
    const data = await res.json();
    return data as T;
  } catch {
    return fallback;
  }
}

// Local type definition for StageWindows (avoids external dependency)
type StageWindows = {
  key: string;
  full: { start: Date; end: Date };
  likely?: { start: Date; end: Date };
};

// ─────────────────── Re-export types ───────────────────

export type { AlertItem, AgendaItem, OffspringGroupSummary, WaitlistPressure, FinanceSummary };
export type { AlertSeverity, AgendaItemKind, WaitlistPressureStatus } from "../api";

// ─────────────────── Types ───────────────────

export type WindowsMap = Record<string, StageWindows[]>;

export type DashboardHandlers = {
  onQuickAction: (action: string) => void;
  onCompleteTask: (id: string | number) => void;
  onDismissAlert: (id: string) => void;
  onCompleteAgendaItem: (id: string) => void;
};

export type DashboardDataV2 = {
  // Core metrics
  counts: DashboardCounts;
  plans: PlanRow[];
  windows: WindowsMap;

  // Urgency
  alerts: AlertItem[];
  todaysAgenda: AgendaItem[];

  // Operations
  offspringGroups: OffspringGroupSummary[];
  waitlistPressure: WaitlistPressure;

  // Financial
  financeSummary: FinanceSummary | null;

  // Trends
  kpis: DashboardKPI[];
  feed: DashboardFeedItem[];

  // Meta
  loading: boolean;
  error: string | null;
  handlers: DashboardHandlers;
  refresh: () => void;
};

// ─────────────────── Helpers ───────────────────

function toDate(x: unknown): Date | null {
  if (x instanceof Date && !isNaN(x.getTime())) return x;
  if (typeof x === "string" || typeof x === "number") {
    const d = new Date(x);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function cleanWindows(win: unknown): StageWindows[] {
  const arr = Array.isArray(win) ? (win as any[]) : [];
  const out: StageWindows[] = [];
  for (const w of arr) {
    if (!w || !w.full) continue;
    const s = toDate(w.full.start);
    const e = toDate(w.full.end);
    if (!s || !e) continue;
    const likely =
      w.likely && toDate(w.likely.start) && toDate(w.likely.end)
        ? { start: toDate(w.likely.start) as Date, end: toDate(w.likely.end) as Date }
        : undefined;
    out.push({ key: w.key, full: { start: s, end: e }, likely });
  }
  return out;
}

const DISMISSED_ALERTS_KEY = "bhq_dismissed_alerts";

function getDismissedAlerts(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {}
  return new Set();
}

function saveDismissedAlert(id: string): void {
  try {
    const dismissed = getDismissedAlerts();
    dismissed.add(id);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...dismissed]));
  } catch {}
}

// Default empty states
const DEFAULT_COUNTS: DashboardCounts = {
  animals: 0,
  activeCycles: 0,
  littersInCare: 0,
  upcomingBreedings: 0,
};

const DEFAULT_WAITLIST_PRESSURE: WaitlistPressure = {
  totalWaitlist: 0,
  activeWaitlist: 0,
  pendingWaitlist: 0,
  totalAvailable: 0,
  expectedNext90Days: 0,
  ratio: 0,
  status: "balanced",
  bySpecies: [],
};

// ─────────────────── Hook ───────────────────

export function useDashboardDataV2(): DashboardDataV2 {
  const [counts, setCounts] = React.useState<DashboardCounts>(DEFAULT_COUNTS);
  const [plans, setPlans] = React.useState<PlanRow[]>([]);
  const [windows, setWindows] = React.useState<WindowsMap>({});
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [todaysAgenda, setTodaysAgenda] = React.useState<AgendaItem[]>([]);
  const [kpis, setKpis] = React.useState<DashboardKPI[]>([]);
  const [feed, setFeed] = React.useState<DashboardFeedItem[]>([]);
  const [financeSummary, setFinanceSummary] = React.useState<FinanceSummary | null>(null);
  const [offspringGroups, setOffspringGroups] = React.useState<OffspringGroupSummary[]>([]);
  const [waitlistPressure, setWaitlistPressure] = React.useState<WaitlistPressure>(DEFAULT_WAITLIST_PRESSURE);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(() => getDismissedAlerts());
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Filter out dismissed alerts
  const filteredAlerts = React.useMemo(
    () => alerts.filter((a) => !dismissedAlerts.has(a.id)),
    [alerts, dismissedAlerts]
  );

  // Load data
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Parallel load all data from real API endpoints
        // Use directFetch to bypass the dashboardRemoteEnabled gate
        const [
          countsRes,
          plansRes,
          alertsRes,
          agendaRes,
          offspringRes,
          waitlistRes,
          financeRes,
          kpisRes,
          feedRes,
        ] = await Promise.all([
          // Counts - use direct fetch
          directFetch<DashboardCounts>("/dashboard/counts", DEFAULT_COUNTS),

          // Plans - use api.breeding.plans.list directly (not gated)
          api.breeding.plans.list({}).then((r: any) => {
            // Handle various response shapes:
            // - Array directly: [...]
            // - Paginated with items: { items: [...], total, page, limit }
            // - Paginated with data: { data: [...], meta: {...} }
            // - Wrapped: { plans: [...] }
            let plans: PlanRow[] = [];
            if (Array.isArray(r)) {
              plans = r;
            } else if (r?.items && Array.isArray(r.items)) {
              plans = r.items;
            } else if (r?.data && Array.isArray(r.data)) {
              plans = r.data;
            } else if (r?.plans && Array.isArray(r.plans)) {
              plans = r.plans;
            }
            return plans;
          }).catch(() => []),

          // Other dashboard endpoints - use direct fetch to bypass gate
          directFetch<AlertItem[]>("/dashboard/alerts", []),
          directFetch<AgendaItem[]>(`/dashboard/agenda?date=${new Date().toISOString().slice(0, 10)}`, []),
          directFetch<OffspringGroupSummary[]>("/dashboard/offspring-summary", []),
          directFetch<WaitlistPressure>("/dashboard/waitlist-pressure", DEFAULT_WAITLIST_PRESSURE),
          directFetch<FinanceSummary | null>("/finance/summary", null),
          directFetch<DashboardKPI[]>("/dashboard/kpis?window=6m", []),
          directFetch<DashboardFeedItem[]>("/dashboard/feed?limit=25", []),
        ]);

        if (cancelled) return;

        setCounts(countsRes);
        setPlans(plansRes);
        setAlerts(alertsRes);
        setTodaysAgenda(agendaRes);
        setOffspringGroups(offspringRes);
        setWaitlistPressure(waitlistRes);
        setFinanceSummary(financeRes);
        setKpis(kpisRes);
        setFeed(feedRes);

        // Build windows from plans (if plan data includes windows)
        const w: WindowsMap = {};
        for (const plan of plansRes) {
          const id = String(plan?.id ?? "");
          if (!id) continue;
          // Plans may include computed windows in future
          w[id] = [];
        }
        setWindows(w);

      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Handlers
  const handlers = React.useMemo<DashboardHandlers>(
    () => ({
      onQuickAction: (action: string) => {
        console.log("Quick action:", action);
        // Navigation is handled by the component via href
      },

      onCompleteTask: (id: string | number) => {
        // Remove from local state optimistically
        setTodaysAgenda((prev) => prev.filter((t) => t.id !== String(id)));
      },

      onDismissAlert: async (id: string) => {
        // Optimistic update
        saveDismissedAlert(id);
        setDismissedAlerts((prev) => new Set([...prev, id]));

        // Call API to persist dismissal
        await api.dashboard.dismissAlert(id);
      },

      onCompleteAgendaItem: async (id: string) => {
        // Optimistic update
        setTodaysAgenda((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, completed: true } : item
          )
        );

        // Call API to mark complete
        await api.dashboard.completeAgendaItem(id);
      },
    }),
    []
  );

  const refresh = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    counts,
    plans,
    windows,
    alerts: filteredAlerts,
    todaysAgenda,
    offspringGroups,
    waitlistPressure,
    financeSummary,
    kpis,
    feed,
    loading,
    error,
    handlers,
    refresh,
  };
}

import * as React from "react";
import {
  api,
  type PlanRow,
  type DashboardTask as Task,
  type DashboardKPI as KPI,
  type DashboardFeedItem as FeedItem,
  type DashboardCounts as Counts,
} from "../api";
import type { StageWindows } from "@bhq/ui/utils";

export type WindowsMap = Record<string, StageWindows[]>;

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
      w.likely &&
      toDate(w.likely.start) &&
      toDate(w.likely.end)
        ? { start: toDate(w.likely.start) as Date, end: toDate(w.likely.end) as Date }
        : undefined;
    out.push({ key: w.key, full: { start: s, end: e }, likely });
  }
  return out;
}

export function useDashboardData() {
  const [counts, setCounts] = React.useState<Counts | null>(null);
  const [plans, setPlans] = React.useState<PlanRow[]>([]);
  const [windows, setWindows] = React.useState<WindowsMap>({});
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [kpis, setKpis] = React.useState<KPI[]>([]);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [c, p, t, k, f] = await Promise.all([
          api.dashboard.counts(),
          api.dashboard.plans(),
          api.dashboard.tasks(),
          api.dashboard.kpis(),
          api.dashboard.feed(),
        ]);
        if (cancelled) return;

        setCounts(c);
        setPlans(p);

        const w: WindowsMap = {};
        for (const plan of p) {
          const id = String(plan?.id ?? "");
          if (!id) continue;
          const raw = buildStageWindows(plan as any) as StageWindows[] | undefined;
          w[id] = cleanWindows(raw);
        }
        setWindows(w);

        setTasks(t);
        setKpis(k);
        setFeed(f);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlers = React.useMemo(
    () => ({
      onQuickAction: (action: string) => console.log("quick action", action),
      onCompleteTask: (id: string | number) => setTasks(prev => prev.filter(t => t.id !== id)),
    }),
    []
  );

  return {
    loading,
    error,
    counts,
    plans,
    windows,
    tasks,
    kpis,
    feed,
    handlers,
    user: { firstName: "Aaron", greeting: "Good morning" },
  };
}

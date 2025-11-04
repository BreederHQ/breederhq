// apps/platform/src/routes/Dashboard.tsx
import * as React from "react";
import { PageHeader, SectionCard } from "@bhq/ui";
import TodayStrip from "../components/TodayStrip";
import MiniGantt90 from "../components/MiniGantt90";
import UrgentTasks from "../components/UrgentTasks";
import KpiPanel from "../components/KpiPanel";
import ActivityFeed from "../components/ActivityFeed";
import { useDashboardData } from "../features/useDashboardData";
import { api } from "../api";

/* ───────────────── Local styles (copper accent, surfaces, banner, typography) ───────────────── */
function LocalStyles() {
  return (
    <style>{`
:root {
  --copper: #D46A1C;                  /* deeper copper */
  --accent: #E06C1F;                  /* icon glow accent */
  --accent-soft: rgba(224,108,31,.30);/* 30% for soft glow */
  --warm-white: #F5F2EE;              /* headers */
  --cool-text: #B2B6BA;               /* supporting */
  --slate-deep: #111315;              /* primary surface */
  --slate-lite: #171A1C;              /* metric surface */
}

/* Overall vignette tuned to copper */
.bhq-vignette { position: relative; }
.bhq-vignette::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(1200px 600px at 50% -10%, color-mix(in oklab, var(--copper) 22%, transparent), transparent 60%),
    radial-gradient(800px 400px at 80% 120%, color-mix(in oklab, var(--copper) 14%, transparent), transparent 60%);
}

/* Banner behind greeting, with a very subtle vertical light pass */
.c-banner {
  position: relative;
  border-radius: 16px;
  overflow: hidden; /* contain the light pass */
  background:
    radial-gradient(800px 240px at 30% -40%, color-mix(in oklab, var(--copper) 24%, transparent), transparent 55%),
    linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.10));
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--copper) 24%, transparent),
    0 18px 36px -22px rgba(0,0,0,.65);
  will-change: transform;
}

/* Light pass: very faint, slow, vertical sweep */
.c-banner::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: -60%;
  height: 220%;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255,255,255,0.05) 50%,
    transparent 100%
  );
  opacity: .6; /* controlled by animation keyframes below */
  animation: bhqLightPassY 13s linear infinite;
}

@keyframes bhqLightPassY {
  0%   { transform: translateY(-55%); opacity: .0; }
  10%  { opacity: .12; }
  50%  { transform: translateY(0%);  opacity: .06; }
  90%  { opacity: .12; }
  100% { transform: translateY(55%); opacity: .0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .c-banner::after { animation: none; display: none; }
}

/* Card surfaces: two tiers with subtle vertical depth */
.surface-primary :where(.bhq-sectioncard, .bhq-section) {
  background-color: var(--slate-deep) !important;
  background-image: linear-gradient(to bottom, rgba(255,255,255,.02), rgba(0,0,0,.12));
  border-color: color-mix(in oklab, var(--copper) 10%, #1F2326) !important;
}
.surface-secondary :where(.bhq-sectioncard, .bhq-section) {
  background-color: var(--slate-lite) !important;
  background-image: linear-gradient(to bottom, rgba(255,255,255,.03), rgba(0,0,0,.10));
  border-color: color-mix(in oklab, var(--copper) 10%, #22272A) !important;
}

/* Copper linework with hover ramp. Duration set to 150ms. */
.copper-glow {
  border-color: transparent !important;
  box-shadow:
    inset 0 1px 0 0 rgba(255,255,255,.03),
    0 0 0 1px color-mix(in oklab, var(--copper) 34%, transparent),
    0 0 16px -4px color-mix(in oklab, var(--copper) 28%, transparent);
  transition: box-shadow .15s ease-out, filter .15s ease-out, transform .15s ease-out;
  will-change: box-shadow, filter, transform;
}
.copper-glow--hover:hover,
.copper-glow--hover:focus-visible {
  box-shadow:
    inset 0 1px 0 0 rgba(255,255,255,.04),
    0 0 0 1px color-mix(in oklab, var(--copper) 46%, transparent),
    0 0 22px -4px color-mix(in oklab, var(--copper) 36%, transparent);
  filter: brightness(1.02);
}

/* Section title and icons: micro glow + ~10% luminance lift */
.c-section-title { color: var(--warm-white); }
.c-section-title svg {
  color: var(--copper);
  filter:
    brightness(1.10)
    drop-shadow(0 0 1px var(--accent-soft));
  opacity: .95;
}

/* Page header typography */
.c-typography :where(h1, .bhq-pageheader h1) { color: var(--warm-white) !important; }
.c-typography :where(p, .bhq-pageheader-subtitle) { color: var(--cool-text) !important; }

/* KPI tile lift + icon glow */
.bhq-kpi-surface .kpi-card,
.bhq-kpi-surface .kpi,
.bhq-kpi-surface [data-kpi] {
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--copper) 18%, transparent),
    0 10px 18px -12px rgba(0,0,0,.45);
  background-image: linear-gradient(to bottom, rgba(255,255,255,.02), rgba(0,0,0,.12));
}
.bhq-kpi-surface .kpi-card:hover,
.bhq-kpi-surface .kpi:hover,
.bhq-kpi-surface [data-kpi]:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--copper) 28%, transparent),
    0 14px 24px -14px rgba(0,0,0,.55);
  filter: brightness(1.02);
}
.bhq-kpi-surface .kpi-card svg,
.bhq-kpi-surface .kpi svg,
.bhq-kpi-surface [data-kpi] svg {
  filter:
    brightness(1.10)
    drop-shadow(0 0 1px var(--accent-soft));
  opacity: .94;
}
    `}</style>
  );
}

/* ───────────────── Utilities ───────────────── */
function pickName(u: any): string {
  if (!u) return "Breeder";
  const nickname =
    u.nickname ?? u.nick ?? u.preferredName ?? u.preferred_name ?? u.displayName ?? u.display_name;
  const first =
    u.firstName ?? u.given_name ?? u.givenName ?? u.name?.first ?? u.name?.givenName;
  const n = String(nickname ?? "").trim();
  if (n) return n;
  const f = String(first ?? "").trim();
  if (f) return f;
  return "Breeder";
}

/** scope headers so GETs do not 400 */
function resolveScopeHeaders(): HeadersInit {
  const w: any = (typeof window !== "undefined" ? window : {}) as any;

  const rtTid = Number(w?.__BHQ_TENANT_ID__);
  let lsTid = NaN;
  try { lsTid = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN"); } catch {}
  const envTid = Number(((import.meta as any)?.env?.VITE_DEV_TENANT_ID) || "");
  const tenantId =
    (Number.isFinite(rtTid) && rtTid > 0 && rtTid) ||
    (Number.isFinite(lsTid) && lsTid > 0 && lsTid) ||
    (Number.isFinite(envTid) && envTid > 0 && envTid) ||
    undefined;

  const rtOid = Number(w?.__BHQ_ORG_ID__);
  let lsOid = NaN;
  try { lsOid = Number(localStorage.getItem("BHQ_ORG_ID") || "NaN"); } catch {}
  const envOid = Number(((import.meta as any)?.env?.VITE_DEV_ORG_ID) || "");
  const orgId =
    (Number.isFinite(rtOid) && rtOid > 0 && rtOid) ||
    (Number.isFinite(lsOid) && lsOid > 0 && lsOid) ||
    (Number.isFinite(envOid) && envOid > 0 && envOid) ||
    undefined;

  const h = new Headers({ Accept: "application/json" });
  if (tenantId) h.set("x-tenant-id", String(tenantId));
  if (orgId) h.set("x-org-id", String(orgId));
  return h;
}

async function getSessionUserId(): Promise<string> {
  const res = await fetch("/api/v1/session", {
    credentials: "include",
    headers: resolveScopeHeaders(),
  });
  if (!res.ok) throw new Error("session_failed");
  const j = await res.json().catch(() => ({}));
  const id = String(j?.user?.id || "");
  if (!id) throw new Error("no_user_id");
  return id;
}

async function loadNameFromDb(): Promise<string> {
  try {
    const id = await getSessionUserId();
    const res = await fetch(`/api/v1/users/${encodeURIComponent(id)}`, {
      method: "GET",
      credentials: "include",
      headers: resolveScopeHeaders(),
    });
    if (!res.ok) throw new Error("user_failed");
    const u = await res.json().catch(() => ({}));
    return pickName(u);
  } catch {
    return "Breeder";
  }
}

/* ───────────────── Empty card ───────────────── */
function EmptyCard({
  title,
  hint,
  icon = "placeholder",
}: {
  title: string;
  hint?: string;
  icon?: "calendar" | "inbox" | "chart" | "placeholder";
}) {
  const Icon = {
    calendar: (
      <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    inbox: (
      <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 7h14l3 5v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-6l3-5Z" />
      </svg>
    ),
    chart: (
      <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="5" width="3" height="13" />
      </svg>
    ),
    placeholder: (
      <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="m3 17 4.5-4.5a2 2 0 0 1 2.8 0L15 17" />
        <circle cx="14.5" cy="8.5" r="1.5" />
      </svg>
    ),
  }[icon];

  return (
    <div className="rounded-xl border border-dashed border-[rgba(212,106,28,.35)] bg-transparent p-3 text-sm text-secondary flex items-center gap-2 transition-colors hover:border-[rgba(212,106,28,.6)]">
      {Icon}
      <span>{title}</span>
      {hint ? <span className="opacity-80 ml-1"> - {hint}</span> : null}
    </div>
  );
}

/* ───────────────── Visual helpers ───────────────── */
const KPI_SURFACE = "bhq-kpi-surface";

/* Keep content from stretching too wide on ultra-wide screens */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1600px]">{children}</div>;
}

/* Small icons for section titles */
const TitleIcon = {
  calendar: (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  bolt: (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="5" width="3" height="13" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12H18l-3 7L9 5l-3 7H2" />
    </svg>
  ),
};

export default function Dashboard() {
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "dashboard", label: "Dashboard" } })
    );
  }, []);

  const [displayName, setDisplayName] = React.useState<string>("Breeder");
  const [mounted, setMounted] = React.useState(false);

  const prefersReduced = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  React.useEffect(() => {
    setMounted(true);
    let cancelled = false;

    const cached = (window as any)?.platform?.currentUser;
    if (cached && !cancelled) setDisplayName(pickName(cached));

    (async () => {
      const fromDb = await loadNameFromDb();
      if (!cancelled && fromDb && fromDb !== "Breeder") {
        setDisplayName(fromDb);
        return;
      }
      try {
        const me = await api.auth.me();
        const u = (me as any)?.user ?? me;
        if (!cancelled) setDisplayName(pickName(u));
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  const data = useDashboardData();

  const counts = data.counts ?? {
    animals: 0,
    activeCycles: 0,
    littersInCare: 0,
    upcomingBreedings: 0,
  };

  const hasPlansOrWindows =
    (Array.isArray(data.plans) && data.plans.length > 0) ||
    (data.windows && Object.keys(data.windows).length > 0);

  const hasTasks = Array.isArray(data.tasks) && data.tasks.length > 0;
  const hasKpis = Array.isArray(data.kpis) && data.kpis.length > 0;
  const hasFeed = Array.isArray(data.feed) && data.feed.length > 0;

  const appear =
    prefersReduced
      ? ""
      : (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1") +
        " transition-all duration-200";

  return (
    <div className="p-6 bhq-vignette c-typography">
      <LocalStyles />
      <Container>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard"
            subtitle="Operational overview, upcoming work, and program health"
          />

          {/* Greeting + KPI band with banner warmth; TodayStrip owns the salutation */}
          <div className={`${appear} ${KPI_SURFACE}`}>
            <div className="c-banner p-3 rounded-2xl">
              <TodayStrip userFirstName={displayName} counts={counts} />
            </div>
          </div>

          <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${appear}`}>
            {/* Next 90 days - primary surface with copper linework */}
            <SectionCard
              className={`xl:col-span-2 surface-primary copper-glow copper-glow--hover`}
              title={<div className="flex items-center c-section-title">{TitleIcon.calendar}Next 90 days</div>}
              subtitle="Today marker is fixed, chart scrolls under it"
            >
              {hasPlansOrWindows ? (
                <MiniGantt90 plans={data.plans ?? []} windows={data.windows ?? {}} />
              ) : (
                <EmptyCard
                  icon="calendar"
                  title="No breeding windows yet."
                  hint="Lock a cycle on a female to see the next 90 days come alive."
                />
              )}
            </SectionCard>

            {/* Urgent tasks - primary surface */}
            <SectionCard
              className={`surface-primary copper-glow copper-glow--hover`}
              title={<div className="flex items-center c-section-title">{TitleIcon.bolt}Urgent tasks</div>}
              subtitle="Time sensitive items that keep the program moving"
            >
              {hasTasks ? (
                <UrgentTasks tasks={data.tasks ?? []} onComplete={data.handlers.onCompleteTask} />
              ) : (
                <EmptyCard
                  icon="inbox"
                  title="No urgent tasks."
                  hint="You are clear for now. Keep momentum by reviewing follow ups."
                />
              )}
            </SectionCard>
          </div>

          <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${appear}`}>
            {/* KPIs - secondary surface to separate metrics from workflow */}
            <SectionCard
              className={`xl:col-span-2 surface-secondary copper-glow copper-glow--hover`}
              title={<div className="flex items-center c-section-title">{TitleIcon.chart}Program KPIs</div>}
            >
              {hasKpis ? (
                <KpiPanel kpis={data.kpis ?? []} />
              ) : (
                <EmptyCard
                  icon="chart"
                  title="No KPIs yet."
                  hint="As data accumulates, key indicators will light up here."
                />
              )}
            </SectionCard>

            {/* Activity - primary surface */}
            <SectionCard
              className={`surface-primary copper-glow copper-glow--hover`}
              title={<div className="flex items-center c-section-title">{TitleIcon.activity}Recent activity</div>}
            >
              {hasFeed ? (
                <ActivityFeed items={data.feed ?? []} />
              ) : (
                <EmptyCard
                  title="No recent activity."
                  hint="New events and updates will appear here the moment they happen."
                />
              )}
            </SectionCard>
          </div>
        </div>
      </Container>
    </div>
  );
}

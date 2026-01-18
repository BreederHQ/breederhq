// apps/platform/src/pages/Dashboard.tsx
// Mission Control for Breeders - warm, inviting morning coffee experience

import * as React from "react";
import { useDashboardDataV2 } from "../features/useDashboardDataV2";
import {
  AlertBanner,
  TodaysAgenda,
  BreedingPipeline,
  OffspringGroupCards,
  WaitlistGauge,
  FinancialSnapshot,
  QuickActionsHub,
  GreetingBanner,
  BreedingPipelineTile,
  OffspringCountTile,
  WaitlistCountTile,
  FinancesTile,
} from "../components/dashboard";
import KpiPanel from "../components/KpiPanel";
import ActivityFeed from "../components/ActivityFeed";
import ContactFollowUps from "../components/ContactFollowUps";
import { api } from "../api";
import { FoalingDashboardWidget, type FoalingPlanItem } from "../../../marketplace/src/breeder/components/FoalingDashboardWidget";
import { RecordFoalingModal } from "../../../breeding/src/components/RecordFoalingModal";

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STYLES - Warm animations and vibes
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardStyles() {
  return (
    <style>{`
@keyframes bhq-sunrise {
  0% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.8; transform: scale(1); }
}
@keyframes bhq-pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.3), 0 0 40px rgba(255, 107, 53, 0.1); }
  50% { box-shadow: 0 0 30px rgba(255, 107, 53, 0.5), 0 0 60px rgba(255, 107, 53, 0.2); }
}
@keyframes bhq-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
@keyframes bhq-wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
@keyframes bhq-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes bhq-steam {
  0% {
    opacity: 0;
    transform: translateY(0) scaleX(1);
  }
  15% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.6;
    transform: translateY(-20px) scaleX(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scaleX(0.8);
  }
}
.bhq-steam {
  position: absolute;
  width: 8px;
  height: 20px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 50%;
  filter: blur(3px);
  animation: bhq-steam 2s ease-out infinite;
}
.bhq-steam:nth-child(1) { left: 25%; animation-delay: 0s; }
.bhq-steam:nth-child(2) { left: 50%; animation-delay: 0.4s; }
.bhq-steam:nth-child(3) { left: 75%; animation-delay: 0.8s; }
.bhq-hero-glow {
  animation: bhq-pulse-glow 4s ease-in-out infinite;
}
.bhq-float {
  animation: bhq-float 3s ease-in-out infinite;
}
.bhq-wave {
  display: inline-block;
  animation: bhq-wave 2.5s ease-in-out;
  transform-origin: 70% 70%;
}
.bhq-shimmer-text {
  background: linear-gradient(90deg, #ff6b35 0%, #ffaa35 25%, #ff6b35 50%, #ffaa35 75%, #ff6b35 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: bhq-shimmer 3s linear infinite;
}
.bhq-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(255, 107, 53, 0.25);
  border-color: rgba(255, 107, 53, 0.5) !important;
}
.bhq-tile:hover .bhq-tile-icon {
  transform: scale(1.1);
}
@media (prefers-reduced-motion: reduce) {
  .bhq-hero-glow, .bhq-float, .bhq-wave, .bhq-shimmer-text, .bhq-steam { animation: none; }
  .bhq-steam { opacity: 0.3; }
  .bhq-tile:hover { transform: none; }
}
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

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
    cache: "no-store",
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

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function SectionCard({
  children,
  title,
  icon,
  linkText,
  linkHref,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  linkText?: string;
  linkHref?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(60, 60, 60, 0.5)",
        borderRadius: "16px",
        padding: "1.5rem",
      }}
    >
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {icon && <span style={{ color: "#ff6b35", width: "18px", height: "18px" }}>{icon}</span>}
            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>{title}</span>
          </div>
          {linkText && linkHref && (
            <a href={linkHref} style={{ fontSize: "0.75rem", color: "#ff6b35", textDecoration: "none" }}>
              {linkText}
            </a>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: "100%", height: "100%" }}>
    <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="5" width="3" height="13" />
  </svg>
);

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: "100%", height: "100%" }}>
    <path d="M22 12H18l-3 7L9 5l-3 7H2" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "dashboard", label: "Dashboard" } })
    );
  }, []);

  // Get name from window cache (set by App-Platform before Dashboard mounts)
  const displayName = React.useMemo(() => {
    const cached = (window as any)?.platform?.currentUser;
    return cached ? pickName(cached) : "Breeder";
  }, []);

  // Load dashboard data
  const data = useDashboardDataV2();

  const pendingAgenda = data.todaysAgenda.filter((i) => !i.completed).length;
  const completedAgenda = data.todaysAgenda.length - pendingAgenda;
  const activePlans = data.plans.filter((p) => p.status?.toUpperCase() !== "COMPLETE").length;
  const hasKpis = Array.isArray(data.kpis) && data.kpis.length > 0;
  const hasFeed = Array.isArray(data.feed) && data.feed.length > 0;

  // Foaling Dashboard - only show for breeders with HORSE species
  const hasHorseBreeds = data.plans.some((p) => p.species?.toUpperCase() === "HORSE");

  // Convert plans to foaling widget format
  const foalingPlans: FoalingPlanItem[] = React.useMemo(() => {
    return data.plans.map((p) => ({
      id: typeof p.id === "string" ? parseInt(p.id, 10) : p.id,
      name: p.name || "Untitled Plan",
      damName: p.damName ?? null,
      sireName: p.sireName ?? null,
      expectedBirthDate: p.expectedDue ?? p.lockedDueDate ?? null,
      birthDateActual: p.birthDateActual ?? null,
      breedDateActual: p.lockedCycleStart ?? null,
      species: p.species || "",
    }));
  }, [data.plans]);

  // State for recording foaling modal
  const [foalingPlan, setFoalingPlan] = React.useState<FoalingPlanItem | null>(null);

  const handleFoalingSubmit = async (payload: {
    actualBirthDate: string;
    foals: Array<{ sex: "MALE" | "FEMALE"; color?: string; name?: string }>;
  }) => {
    if (!foalingPlan) return;
    try {
      const res = await fetch(`/api/v1/breeding/plans/${foalingPlan.id}/record-foaling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to record foaling");
      setFoalingPlan(null);
      data.refresh();
    } catch (err) {
      console.error("Error recording foaling:", err);
    }
  };

  return (
    <div
      style={{
        background: `
          radial-gradient(ellipse 1000px 500px at 100% 0%, rgba(255, 107, 53, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 600px 400px at 0% 100%, rgba(255, 107, 53, 0.08) 0%, transparent 45%),
          linear-gradient(180deg, #111 0%, #0a0a0a 100%)
        `,
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <DashboardStyles />

      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Alert Banner */}
        {data.alerts.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <AlertBanner
              alerts={data.alerts}
              onDismiss={data.handlers.onDismissAlert}
            />
          </div>
        )}

        {/* Hero Greeting */}
        <div style={{ marginBottom: "2rem" }}>
          <GreetingBanner
            name={displayName}
            pendingTasks={pendingAgenda}
            completedTasks={completedAgenda}
          />
        </div>

        {/* Primary Action Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <BreedingPipelineTile activePlans={activePlans} />
          <OffspringCountTile groupCount={data.offspringGroups.length} />
          <WaitlistCountTile
            pendingCount={data.waitlistPressure.pendingWaitlist ?? 0}
            approvedCount={data.waitlistPressure.activeWaitlist ?? 0}
          />
          <FinancesTile
            outstandingCents={data.financeSummary?.outstandingTotalCents ?? 0}
          />
        </div>

        {/* Today's Agenda + Quick Actions + Contact Follow-ups */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionCard>
              <TodaysAgenda
                userFirstName={displayName}
                items={data.todaysAgenda}
                onComplete={data.handlers.onCompleteAgendaItem}
              />
            </SectionCard>
            {/* Contact Follow-ups - Prominent CRM widget */}
            <ContactFollowUps
              maxItems={5}
              onOpenContact={(partyId, partyKind) => {
                // Navigate to contacts with party drawer open
                window.location.href = `/contacts?partyId=${partyId}&kind=${partyKind}`;
              }}
            />
          </div>
          <SectionCard>
            <QuickActionsHub onAction={data.handlers.onQuickAction} />
          </SectionCard>
        </div>

        {/* Breeding Pipeline Detail */}
        <div style={{ marginBottom: "2rem" }}>
          <SectionCard>
            <BreedingPipeline
              plans={data.plans}
              windows={data.windows}
              maxVisible={6}
              onViewPlan={(id) => {
                window.location.href = `/breeding/${id}`;
              }}
            />
          </SectionCard>
        </div>

        {/* Foaling Dashboard - Only shown for breeders with HORSE species */}
        {hasHorseBreeds && (
          <div style={{ marginBottom: "2rem" }}>
            <FoalingDashboardWidget
              plans={foalingPlans}
              loading={data.loading}
              onRecordFoaling={(plan) => setFoalingPlan(plan)}
              calendarLink="/breeding/foaling"
            />
          </div>
        )}

        {/* Three Column Detail Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <SectionCard>
            <OffspringGroupCards
              groups={data.offspringGroups}
              onViewGroup={(id) => {
                window.location.href = `/offspring/${id}`;
              }}
              loading={data.loading}
            />
          </SectionCard>
          <SectionCard>
            <WaitlistGauge pressure={data.waitlistPressure} loading={data.loading} />
          </SectionCard>
          <SectionCard>
            <FinancialSnapshot summary={data.financeSummary} loading={data.loading} />
          </SectionCard>
        </div>

        {/* KPIs - only show when we have data */}
        {hasKpis && (
        <div style={{ marginBottom: "2rem" }}>
          <SectionCard title="Program KPIs" icon={<ChartIcon />}>
              <KpiPanel kpis={data.kpis} />
          </SectionCard>
        </div>
        )}

        {/* Activity Feed */}
        <div>
          <SectionCard title="Recent Activity" icon={<ActivityIcon />}>
            {hasFeed ? (
              <ActivityFeed items={data.feed} />
            ) : (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
                <div style={{ color: "#fff", fontWeight: 500 }}>No recent activity</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
                  Events and updates will appear here as they happen
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Record Foaling Modal */}
      <RecordFoalingModal
        open={foalingPlan !== null}
        planId={foalingPlan?.id ?? 0}
        damName={foalingPlan?.damName || foalingPlan?.name}
        sireName={foalingPlan?.sireName}
        expectedBirthDate={foalingPlan?.expectedBirthDate}
        breedDateActual={foalingPlan?.breedDateActual}
        onClose={() => setFoalingPlan(null)}
        onSubmit={handleFoalingSubmit}
      />
    </div>
  );
}

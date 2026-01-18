import type { NextCycleProjection } from "./types";

type NextCycleHeroProps = {
  projection: NextCycleProjection;
};

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local date to avoid timezone issues.
 * new Date("2026-01-15") is interpreted as UTC midnight, which can shift the date
 * in timezones behind UTC. This function parses the components manually.
 */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "-";
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = parseLocalDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getCountdownLabel(days: number | null): { text: string; urgency: "normal" | "soon" | "imminent" | "past" } {
  if (days === null) return { text: "Unknown", urgency: "normal" };
  if (days < 0) return { text: `${Math.abs(days)} days ago`, urgency: "past" };
  if (days === 0) return { text: "Today", urgency: "imminent" };
  if (days === 1) return { text: "Tomorrow", urgency: "imminent" };
  if (days <= 7) return { text: `${days} days`, urgency: "imminent" };
  if (days <= 30) return { text: `${days} days`, urgency: "soon" };
  return { text: `${days} days`, urgency: "normal" };
}

export function NextCycleHero({
  projection,
}: NextCycleHeroProps) {
  if (!projection || !projection.projectedHeatStart) {
    return null;
  }

  const daysToHeat = daysUntil(projection.projectedHeatStart);
  const daysToTesting = daysUntil(projection.recommendedTestingStart);
  const heatCountdown = getCountdownLabel(daysToHeat);
  const testingCountdown = getCountdownLabel(daysToTesting);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Heat Expected */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "#1a1a1a",
            border: heatCountdown.urgency === "imminent" ? "1px solid rgba(245, 158, 11, 0.5)" :
                   heatCountdown.urgency === "soon" ? "1px solid rgba(245, 158, 11, 0.3)" :
                   "1px solid rgba(60, 60, 60, 0.5)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
            >
              <svg className="w-5 h-5" style={{ color: "#ff6b35" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            {heatCountdown.urgency === "imminent" && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                style={{ backgroundColor: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}
              >
                Soon
              </span>
            )}
          </div>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Heat Expected</div>
          <div
            className="text-2xl font-bold"
            style={{
              color: heatCountdown.urgency === "imminent" ? "#f59e0b" :
                     heatCountdown.urgency === "soon" ? "#fbbf24" : "#ff6b35"
            }}
          >
            {heatCountdown.text}
          </div>
          <div className="text-sm mt-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>{formatDate(projection.projectedHeatStart)}</div>
        </div>

        {/* Start Testing */}
        {projection.recommendedTestingStart && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "#1a1a1a",
              border: testingCountdown.urgency === "imminent" ? "1px solid rgba(59, 130, 246, 0.5)" :
                     testingCountdown.urgency === "soon" ? "1px solid rgba(59, 130, 246, 0.3)" :
                     "1px solid rgba(60, 60, 60, 0.5)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              {testingCountdown.urgency === "imminent" && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" }}
                >
                  Soon
                </span>
              )}
            </div>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Start Testing</div>
            <div
              className="text-2xl font-bold"
              style={{
                color: testingCountdown.urgency === "imminent" ? "#3b82f6" :
                       testingCountdown.urgency === "soon" ? "#60a5fa" : "#3b82f6"
              }}
            >
              {testingCountdown.text}
            </div>
            <div className="text-sm mt-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>{formatDate(projection.recommendedTestingStart)}</div>
          </div>
        )}

        {/* Ovulation Window */}
        {projection.projectedOvulationWindow && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(60, 60, 60, 0.5)",
            }}
          >
            <div className="mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Ovulation Window</div>
            <div className="text-xl font-bold" style={{ color: "#22c55e" }}>
              {formatShortDate(projection.projectedOvulationWindow.earliest)} - {formatShortDate(projection.projectedOvulationWindow.latest)}
            </div>
            <div className="text-sm mt-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
              Most likely: {formatShortDate(projection.projectedOvulationWindow.mostLikely)}
            </div>
          </div>
        )}
    </div>
  );
}

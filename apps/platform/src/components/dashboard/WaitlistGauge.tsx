// apps/platform/src/components/dashboard/WaitlistGauge.tsx
// Visual gauge showing waitlist demand vs available/expected supply

import * as React from "react";
import type { WaitlistPressure, WaitlistPressureStatus } from "../../features/useDashboardDataV2";

type Props = {
  pressure: WaitlistPressure;
  loading?: boolean;
};

// ─────────────────── Config ───────────────────

const STATUS_CONFIG: Record<WaitlistPressureStatus, { label: string; color: string; description: string }> = {
  low_demand: {
    label: "Low Demand",
    color: "#3b82f6",
    description: "More availability than demand",
  },
  balanced: {
    label: "Balanced",
    color: "#22c55e",
    description: "Healthy demand-to-supply ratio",
  },
  high_demand: {
    label: "High Demand",
    color: "#f59e0b",
    description: "Strong interest - consider expanding",
  },
  oversubscribed: {
    label: "Oversubscribed",
    color: "#ef4444",
    description: "Demand exceeds capacity",
  },
};

// ─────────────────── Components ───────────────────

function GaugeArc({ ratio, status }: { ratio: number; status: WaitlistPressureStatus }) {
  const config = STATUS_CONFIG[status];
  // Clamp ratio to 0-2 for visualization (200% max)
  const clampedRatio = Math.min(2, Math.max(0, ratio));
  // Convert to angle (0 = -90deg, 2 = 90deg)
  const angle = -90 + clampedRatio * 90;

  return (
    <div className="relative w-32 h-16 mx-auto">
      {/* Background arc */}
      <svg className="w-full h-full" viewBox="0 0 100 50">
        {/* Track */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#222222"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Segments */}
        <path
          d="M 10 50 A 40 40 0 0 1 30 15"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 30 15 A 40 40 0 0 1 50 10"
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 50 10 A 40 40 0 0 1 70 15"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 70 15 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#ef4444"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-500"
        style={{
          width: "2px",
          height: "32px",
          marginLeft: "-1px",
          transform: `rotate(${angle}deg)`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full -ml-[3px] -mt-1"
          style={{ backgroundColor: config.color }}
        />
        <div
          className="w-0.5 h-full mx-auto"
          style={{ backgroundColor: config.color }}
        />
      </div>

      {/* Center pivot */}
      <div
        className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -ml-1.5 -mb-1.5 bg-[#222222]"
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[rgba(255,255,255,0.5)]">{label}</span>
      <span className="text-white font-medium tabular-nums">{value}</span>
    </div>
  );
}

function SkeletonGauge() {
  return (
    <div className="animate-pulse">
      <div className="w-32 h-16 mx-auto bg-[#222222] rounded-t-full mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-[#222222] rounded w-full" />
        <div className="h-3 bg-[#222222] rounded w-3/4" />
        <div className="h-3 bg-[#222222] rounded w-2/3" />
      </div>
    </div>
  );
}

// ─────────────────── Main Component ───────────────────

export default function WaitlistGauge({ pressure, loading }: Props) {
  const config = STATUS_CONFIG[pressure.status];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#ff6b35]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-sm font-medium text-white">Waitlist Demand</span>
        </div>
        <SkeletonGauge />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#ff6b35]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-sm font-medium text-white">Waitlist Demand</span>
        </div>
        <a
          href="/waitlist"
          className="text-xs text-[#ff6b35] hover:underline"
        >
          View all
        </a>
      </div>

      {/* Gauge */}
      <div className="py-2">
        <GaugeArc ratio={pressure.ratio} status={pressure.status} />
      </div>

      {/* Status label */}
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
        <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">{config.description}</p>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 pt-2 border-t border-[rgba(60,60,60,0.5)]">
        <StatRow label="On waitlist" value={pressure.activeWaitlist ?? pressure.totalWaitlist} />
        {(pressure.pendingWaitlist ?? 0) > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(255,255,255,0.5)]">Pending your action</span>
            <span className="text-[#f59e0b] font-medium tabular-nums">{pressure.pendingWaitlist}</span>
          </div>
        )}
        <StatRow label="Available now" value={pressure.totalAvailable} />
        <StatRow label="Expected (90 days)" value={pressure.expectedNext90Days} />
      </div>

      {/* Species breakdown if available */}
      {pressure.bySpecies.length > 1 && (
        <div className="pt-2 border-t border-[rgba(60,60,60,0.5)]">
          <div className="text-xs text-[rgba(255,255,255,0.5)] mb-1.5">By species</div>
          <div className="space-y-1">
            {pressure.bySpecies.map((s) => (
              <div key={s.species} className="flex items-center justify-between text-xs">
                <span className="text-white capitalize">{s.species.toLowerCase()}</span>
                <span className="text-[rgba(255,255,255,0.5)]">
                  {s.waitlist} waiting / {s.available + s.expected} supply
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

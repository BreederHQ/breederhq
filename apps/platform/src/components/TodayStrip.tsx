import * as React from "react";
import { Button } from "@bhq/ui";

type Counts = { animals: number; activeCycles: number; littersInCare: number; upcomingBreedings: number };

type Props = {
  /** Already resolved to nickname if present, else firstName */
  userFirstName: string;
  counts: Counts | null;
  onQuickAction?: (action: string) => void;
};

/* ───────────────── Animated greeting styles (slow shimmer, name fade) ───────────────── */
function LocalStyles() {
  return (
    <style>{`
@keyframes bhq-sheen {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes bhq-fadeup {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Shimmer overlay, slowed to 18s (50% slower than 12s) */
.bhq-greeting {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background-blend-mode: screen, normal;
}
.bhq-greeting::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,255,255,0.10) 40%,
    rgba(255,255,255,0.28) 50%,
    rgba(255,255,255,0.10) 60%,
    transparent 100%);
  background-size: 200% 100%;
  animation: bhq-sheen 36s linear infinite;
  opacity: .25;
  pointer-events: none;
}
.bhq-name-appear { animation: bhq-fadeup .6s ease-out both; }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .bhq-greeting::after { animation: none; opacity: .18; }
  .bhq-name-appear { animation: none; opacity: 1; transform: none; }
}
    `}</style>
  );
}

/* ───────────────── Helpers ───────────────── */
function timeGreeting(d = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

export default function TodayStrip({ userFirstName, counts, onQuickAction }: Props) {
  const c: Counts = counts ?? { animals: 0, activeCycles: 0, littersInCare: 0, upcomingBreedings: 0 };
  const name = (userFirstName || "").trim() || "Breeder";
  const salutation = timeGreeting();

  return (
    <div className="flex flex-col gap-5">
      <LocalStyles />

      {/* Greeting hero (now animated here) */}
      <div
        className={[
          "relative rounded-2xl border bhq-greeting",
          "border-[hsl(var(--hairline, 225_10%_22%))]",
          "bg-[hsl(var(--card,225_10%_12%))]",
          // subtle orange wash + depth
          "bg-[linear-gradient(135deg,hsl(24_96%_56%/.18),transparent_60%)]",
          "backdrop-blur-md shadow-[var(--e2,0_1px_0_hsl(0_0%_100%/.03),0_8px_24px_hsl(0_0%_0%/.35))]",
          "px-5 py-4"
        ].join(" ")}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-semibold">
              <span>{salutation} </span>
              <span className="bhq-name-appear">{name}</span>
              <span className="opacity-80">, here is your snapshot.</span>
            </div>
            <div className="text-sm text-[hsl(var(--text-secondary,0_0%_80%))] mt-1">
              Today and the next 90 days
            </div>
          </div>
          {onQuickAction && (
            <div className="hidden md:flex gap-2">
              <Button onClick={() => onQuickAction("newPlan")}>New breeding plan</Button>
              <Button onClick={() => onQuickAction("addAnimal")} variant="secondary">Add animal</Button>
              <Button onClick={() => onQuickAction("logEvent")} variant="secondary">Log event</Button>
              <Button onClick={() => onQuickAction("addContact")} variant="secondary">Add contact</Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Animals" value={c.animals} icon={PawIcon} />
        <Stat label="Active cycles" value={c.activeCycles} icon={CycleIcon} />
        <Stat label="Litters in care" value={c.littersInCare} icon={HeartIcon} />
        <Stat label="Upcoming breedings" value={c.upcomingBreedings} icon={CalendarIcon} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon?: React.FC<{ className?: string }>;
}) {
  return (
    <div
      className={[
        "rounded-2xl border",
        "border-[hsl(var(--hairline,225_10%_22%))]",
        "bg-[hsl(var(--card-soft,225_12%_16%))]",
        "shadow-[var(--e1,0_1px_0_hsl(0_0%_100%/.02),0_2px_8px_hsl(0_0%_0%/.25))]",
        "p-4 transition-transform duration-150 hover:-translate-y-[1px]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {Icon ? <Icon className="w-5 h-5 opacity-80" /> : null}
      </div>
      <div className="text-xs text-[hsl(var(--text-secondary,0_0%_80%))] mt-1 flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "hsl(var(--brand,24_96%_56%))" }}
          aria-hidden
        />
        {label}
      </div>
    </div>
  );
}

/** Tiny, neutral line icons (monochrome so they harmonize in dark) */
function PawIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 13c-3 0-4 2-4 3 0 .6.4 1 1 1h6c.6 0 1-.4 1-1 0-1-1-3-4-3Z" />
      <circle cx="7.5" cy="9" r="1.7" /><circle cx="16.5" cy="9" r="1.7" />
      <circle cx="10" cy="6.5" r="1.6" /><circle cx="14" cy="6.5" r="1.6" />
    </svg>
  );
}
function CycleIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 6.34 4.51L1 10m22 4-5.34 5.49A9 9 0 0 1 3.51 15" />
    </svg>
  );
}
function HeartIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
function CalendarIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

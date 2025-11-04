import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import { SectionCard } from "@bhq/ui";

/** ───────────────── types you likely already have on the plan ─────────────────
 * This component is tolerant: it scans any plan object for keys that start with
 * "expected" and look like dates. You do NOT need a strict type here to use it.
 */
type DateLike = string | Date | number;
type Range = { start: Date; end: Date };

type BreedingPlan = Record<string, any> & {
  id: string | number;
  label?: string;
  name?: string;
};

/** ───────────────── config ───────────────── */
const PX_PER_MONTH = 160; // match Master Gantt default so scales feel consistent

/** simple color ramp so rows are readable even with many expected fields */
const COLORS = [
  "#111827", "#2563eb", "#059669", "#9333ea", "#dc2626",
  "#ea580c", "#16a34a", "#0ea5e9", "#a16207", "#7c3aed",
];

/** ───────────────── utils ───────────────── */

function isValidDateish(v: any): boolean {
  if (v == null) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function toDate(v: DateLike): Date {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}
function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function humanizeKey(k: string): string {
  // expectedPlacementCompleted -> Placement Completed
  const noPrefix = k.replace(/^expected_?/i, "");
  const spaced = noPrefix
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Collect all expected date fields on a plan as single-day anchors */
function extractExpectedAnchors(plan: BreedingPlan) {
  // consider any key that starts with "expected" and is dateish
  const entries = Object.entries(plan)
    .filter(([k, v]) => /^expected/i.test(k) && isValidDateish(v))
    .map(([k, v]) => ({ key: k, label: humanizeKey(k), date: toDate(v as DateLike) }));

  // stable order: by date asc, then key
  entries.sort((a, b) => a.date.getTime() - b.date.getTime() || a.key.localeCompare(b.key));
  return entries;
}

/** Compute chart domain with one empty month of left/right buffer */
function domainWithOneMonthBuffer(dates: Date[]) {
  if (dates.length === 0) {
    const today = new Date();
    const left = startOfMonth(addMonths(today, -1));
    const right = endOfMonth(addMonths(today, 1));
    return { start: left, end: right };
  }
  const min = dates[0];
  const max = dates[dates.length - 1];
  const left = startOfMonth(addMonths(min, -1));
  const right = endOfMonth(addMonths(max, 1));
  return { start: left, end: right };
}

/** Map expected anchors -> BHQGantt rows with 1-day bars */
function rowsFromExpectedAnchors(anchors: { key: string; label: string; date: Date }[]) {
  return anchors.map((a, i) => {
    const color = COLORS[i % COLORS.length];
    // 1-day wide bar so single dates are visible on the timeline
    const bar: { full: Range; likely?: Range; color?: string; id?: string } = {
      full: { start: a.date, end: addDays(a.date, 1) },
      color,
      id: a.key,
    };
    return {
      key: a.key,
      label: a.label,
      bars: [bar],
    };
  });
}

/** Header title helper */
function planTitle(plan: BreedingPlan) {
  return plan.label || plan.name || `Plan #${plan.id}`;
}

/** ───────────────── component ───────────────── */

export default function PerPlanGantt({
  plans,
  className = "",
}: {
  plans: BreedingPlan[];
  className?: string;
}) {
  if (!plans || plans.length === 0) return null;

  return (
    <div className={className} style={{ width: "100%" }}>
      {plans.map((plan, idx) => {
        const anchors = extractExpectedAnchors(plan);
        const dates = anchors.map(a => a.date);
        const domain = domainWithOneMonthBuffer(dates);
        const rows = rowsFromExpectedAnchors(anchors);

        return (
          <SectionCard key={String(plan.id) || idx} title={planTitle(plan)} className="mb-4">
            <div style={{ width: "100%" }}>
              <BHQGantt
                // rows: array of { key, label, bars: [{ full:{start,end}, color? }] }
                rows={rows}
                // date domain
                startDate={domain.start}
                endDate={domain.end}
                // visuals
                pxPerMonth={PX_PER_MONTH}
                style={{ width: "100%" }}
                // keep right gutter tight for full-bleed look
                rightGutterPx={0}
                // optional props that exist on your Gantt:
                // showTodayLine
                // todayLineStyle
                // rowHeight
                // gridMinorTicks="week"
              />
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

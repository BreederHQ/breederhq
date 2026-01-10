import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import "../../styles/gantt.css";

// Local type definitions (these were not properly exported from utils)
type Range = { start: string | Date; end: string | Date };
type StageWindows = Record<string, Range[]>;

/* ───────── types ───────── */

export type BHQGanttStage = {
  key: string;
  label: string;
  baseColor: string; // per-row color, used for solid bar and hatch tint
  hatchLikely?: boolean;
};

export type AvailabilityBand = {
  kind: "risky" | "unlikely";
  range: Range;
  label?: string;
  __color?: string;
};

export type BHQGanttProps = {
  title?: string;
  stages: BHQGanttStage[];
  data: StageWindows[];
  availability?: AvailabilityBand[];
  travel?: AvailabilityBand[];
  horizon: Range;
  today?: Date;
  heightPerRow?: number;
  showToday?: boolean;
  showAvailability?: boolean;
  showTravel?: boolean;
  fitToContent?: boolean;
  rightGutter?: number;
  className?: string;
  style?: React.CSSProperties;

  // visual grid
  showIntraMonthTicks?: boolean;      // default: false
  intraMonthDays?: number[];          // default: [7, 14, 21, 28]
  showIntraMonthLabels?: boolean;
  formatIntraDayLabel?: (d: Date) => string;

  // geometry
  trimEdgeMonths?: boolean;           // if false, do not trim one month on each edge
};

/* ───────── utils ───────── */

function atMidnight(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysDiff(a: Date, b: Date) {
  const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((B - A) / 86400000);
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function toDate(x: any | undefined | null): Date | null {
  if (!x) return null;
  if (x instanceof Date) return x;
  const d = new Date(x as any);
  return isNaN(d.getTime()) ? null : d;
}

type StageWinLoose = {
  key?: string;
  full?: Range;
  likely?: Range | null;
  dot?: Date | string | null;
  fullRange?: Range;
  likelyRange?: Range | null;
  point?: Date | string | null;
  __tooltip?: string;

  // allow both underscored and plain props from callers
  __color?: string;
  __opacity?: number;
  color?: string;
  opacity?: number;
} & Record<string, any>;

function pickRange(obj: any, keys: string[]): Range | null {
  for (const k of keys) {
    const r = obj?.[k];
    if (r && r.start && r.end) {
      const s = toDate(r.start);
      const e = toDate(r.end);
      if (s && e) return { start: s, end: e };
    }
  }
  return null;
}
function pickDate(obj: any, keys: string[]): Date | null {
  for (const k of keys) {
    const d = toDate(obj?.[k]);
    if (d) return d;
  }
  return null;
}

function useCssRightGutter(rootRef: React.RefObject<HTMLElement | null>, fallback: number) {
  const [val, setVal] = React.useState<number>(fallback);
  React.useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const raw = getComputedStyle(el).getPropertyValue("--gantt-right-gutter").trim();
    const n = parseInt(raw || "", 10);
    if (Number.isFinite(n)) setVal(n);
  }, [rootRef]);
  return val;
}

/* ───────── component ───────── */

export default function BHQGantt(props: BHQGanttProps) {
  const {
    title,
    stages,
    data,
    availability = [],
    travel = [],
    horizon,
    today = new Date(),
    heightPerRow = 28,
    showToday = true,
    showAvailability = true,
    showTravel = false,
    fitToContent = true,
    rightGutter,
    className,
    style,

    // grid defaults
    showIntraMonthTicks = false,
    intraMonthDays = [7, 14, 21, 28],
    showIntraMonthLabels = false,
    formatIntraDayLabel = (d: Date) => String(d.getDate()),

    trimEdgeMonths = true,
  } = props;

  const rootRef = React.useRef<HTMLElement>(null as any);
  const frameRef = React.useRef<HTMLDivElement>(null);

  // Tooltip hover state
  const [hoverTooltip, setHoverTooltip] = React.useState<{ text: string; x: number; y: number } | null>(null);


  const LEFT_LABEL_W = 160;
  const MONTH_PX = 160;

  const cssGutter = useCssRightGutter(rootRef, 240);
  const RG = typeof rightGutter === "number" ? rightGutter : cssGutter;

  // track available width in fill mode
  const [frameW, setFrameW] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // base horizon
  const rawStart = atMidnight(toDate(horizon.start) || new Date());
  const rawEndInc = atMidnight(toDate(horizon.end) || new Date());

  // optional trim of one full month on both sides
  let start = rawStart;
  let endInc = rawEndInc;
  if (trimEdgeMonths) {
    start = new Date(rawStart.getFullYear(), rawStart.getMonth() + 1, 1);
    endInc = new Date(rawEndInc.getFullYear(), rawEndInc.getMonth(), 0);
    if (endInc <= start) { start = rawStart; endInc = rawEndInc; }
  }
  const endEx = new Date(endInc.getFullYear(), endInc.getMonth(), endInc.getDate() + 1);

  // columns and width
  const months =
    (endInc.getFullYear() - start.getFullYear()) * 12 +
    (endInc.getMonth() - start.getMonth()) + 1;

  // if fitToContent, use month pixels; else derive from the live frame width
  const contentWFit = Math.max(1, Math.ceil(months * MONTH_PX));
  const contentWFill = Math.max(
    1,
    ((frameW ?? 0) - LEFT_LABEL_W) > 0 ? (frameW! - LEFT_LABEL_W) : contentWFit
  );
  const contentW = fitToContent ? contentWFit : contentWFill;

  const contentStartX = LEFT_LABEL_W;
  const contentEndX = LEFT_LABEL_W + contentW;

  // frame width should end at contentEndX, no empty right strip
  const frameWidthFit = `${LEFT_LABEL_W + contentW}px`;

  const rows = stages.length;
  const baseRowH = heightPerRow;
  const topPad = 20;
  const bottomPad = 16;

  // Pre-calculate max overlaps per stage to determine dynamic row heights
  // We need to analyze the data before calculating frame height
  // IMPORTANT: Group bars by __planId - each planId group counts as ONE bar for overlap detection
  // This ensures risky/unlikely bands layer with their center fill, not stack separately
  const maxOverlapsPerStage = React.useMemo(() => {
    const result: number[] = [];

    for (const stg of stages) {
      const stageData = (data as unknown as StageWinLoose[]).filter(row => {
        const key = (row.key || row.stage || row.name) as string;
        return key === stg.key;
      });

      // Group bars by __planId
      const planIdToRows = new Map<string, StageWinLoose[]>();
      const noPlanIdRows: StageWinLoose[] = [];

      for (const row of stageData) {
        const planId = (row as any).__planId as string | undefined;
        if (planId) {
          if (!planIdToRows.has(planId)) {
            planIdToRows.set(planId, []);
          }
          planIdToRows.get(planId)!.push(row);
        } else {
          noPlanIdRows.push(row);
        }
      }

      // Get the primary bar (highest __z with range) for each planId group
      const primaryBars: StageWinLoose[] = [];

      for (const [, rows] of planIdToRows) {
        let primaryRow: StageWinLoose | null = null;
        let highestZ = -1;
        for (const row of rows) {
          const z = (row as any).__z ?? 0;
          const full = pickRange(row, ["full", "fullRange"]);
          const likely = pickRange(row, ["likely", "likelyRange"]);
          const hasRange = !!(full || likely);
          if (hasRange && z > highestZ) {
            highestZ = z;
            primaryRow = row;
          }
        }
        if (primaryRow) {
          primaryBars.push(primaryRow);
        }
      }

      // Also include bars without __planId as individual primary bars (backwards compat)
      for (const row of noPlanIdRows) {
        const z = (row as any).__z ?? 0;
        const full = pickRange(row, ["full", "fullRange"]);
        const likely = pickRange(row, ["likely", "likelyRange"]);
        const hasRange = !!(full || likely);
        if (hasRange && (z >= 3 || z === 0)) {
          primaryBars.push(row);
        }
      }

      if (primaryBars.length <= 1) {
        result.push(1);
        continue;
      }

      // Get time ranges for overlap detection
      const getRange = (row: StageWinLoose) => {
        const full = pickRange(row, ["full", "fullRange"]);
        const likely = pickRange(row, ["likely", "likelyRange"]);
        const rangeObj = full || likely;
        if (!rangeObj) return null;
        const s = toDate(rangeObj.start);
        const e = toDate(rangeObj.end);
        return s && e ? { start: s.getTime(), end: e.getTime() } : null;
      };

      const ranges = primaryBars.map(getRange);

      // Check overlaps for each primary bar
      let maxOverlap = 1;
      for (let i = 0; i < ranges.length; i++) {
        if (!ranges[i]) continue;
        let overlapCount = 1;
        for (let j = 0; j < ranges.length; j++) {
          if (i !== j && ranges[j]) {
            const a = ranges[i]!;
            const b = ranges[j]!;
            if (a.start < b.end && a.end > b.start) {
              overlapCount++;
            }
          }
        }
        maxOverlap = Math.max(maxOverlap, overlapCount);
      }
      result.push(maxOverlap);
    }

    return result;
  }, [stages, data]);

  // Calculate dynamic row heights based on overlap counts
  // If more than 3 overlaps, expand the row to maintain minimum bar height
  const MIN_BAR_HEIGHT = 8;
  const GAP_BETWEEN_BARS = 2;
  const ROW_PADDING = 12; // 6px top + 6px bottom

  const rowHeights = React.useMemo(() => {
    return maxOverlapsPerStage.map(overlaps => {
      if (overlaps <= 3) {
        return baseRowH;
      }
      // For > 3 overlaps, calculate height needed to maintain MIN_BAR_HEIGHT per bar
      // totalH = overlaps * MIN_BAR_HEIGHT + (overlaps - 1) * GAP_BETWEEN_BARS
      const neededContentH = overlaps * MIN_BAR_HEIGHT + (overlaps - 1) * GAP_BETWEEN_BARS;
      return neededContentH + ROW_PADDING;
    });
  }, [maxOverlapsPerStage, baseRowH]);

  // Calculate cumulative row positions
  const rowYPositions = React.useMemo(() => {
    const positions: number[] = [];
    let y = topPad;
    for (let i = 0; i < rowHeights.length; i++) {
      positions.push(y);
      y += rowHeights[i];
    }
    return positions;
  }, [rowHeights, topPad]);

  const frameH = topPad + rowHeights.reduce((sum, h) => sum + h, 0) + bottomPad;

  // x scale
  const totalDays = Math.max(1, daysDiff(start, endEx));
  const pxPerDay = contentW / totalDays;
  const xOf = (d: Date) =>
    LEFT_LABEL_W + Math.round(pxPerDay * clamp(daysDiff(start, atMidnight(d)), 0, totalDays));

  // month grid
  const monthTicks: { label: string; x: number; mid: number }[] = [];
  {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= endInc) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const x1 = xOf(cur);
      const x2 = xOf(next <= endEx ? next : endEx);
      const mid = Math.round((x1 + x2) / 2);
      const yy = String(cur.getFullYear()).slice(-2);
      const label = `${cur.toLocaleString(undefined, { month: "short" })} - ${yy}`;
      monthTicks.push({ label, x: x1, mid });
      cur.setMonth(cur.getMonth() + 1);
    }
    // final line exactly on the right edge
    monthTicks.push({ label: "", x: contentEndX, mid: contentEndX });
  }

  // normalize incoming rows
  type Part = {
    full?: Range | null;
    likely?: Range | null;
    dot?: Date | null;
    tooltip?: string;
    color?: string;
    opacity?: number;
    __planId?: string;  // Groups related bars (risky, unlikely, center) to render at same y position
    __z?: number;       // Z-order for layering (1=unlikely, 2=risky, 3=center fill)
  };
  const partsByKey = new Map<string, Part[]>();
  for (const s of stages) partsByKey.set(s.key, []);
  for (const row of (data as unknown as StageWinLoose[])) {
    const key = (row.key || row.stage || row.name) as string;
    if (!key || !partsByKey.has(key)) continue;
    const full = pickRange(row, ["full", "fullRange"]);
    const likely = pickRange(row, ["likely", "likelyRange"]);
    const dot = pickDate(row, ["dot", "point"]);
    partsByKey.get(key)!.push({
      full,
      likely,
      dot,
      tooltip: row.__tooltip,
      // 👇 prefer plain props; fall back to underscored ones
      color: (row as any).color ?? (row as any).__color ?? undefined,
      opacity: (row as any).opacity ?? (row as any).__opacity ?? undefined,
      __planId: (row as any).__planId ?? undefined,
      __z: (row as any).__z ?? undefined,
    });
  }

  // width behavior
  const svgStyle: React.CSSProperties = fitToContent
    ? { width: `${LEFT_LABEL_W + contentW}px` }
    : { width: "100%" };

  // viewBox should end at the last column, not include any right gutter
  const viewW = LEFT_LABEL_W + contentW;

  // clip & ids
  const clipId = React.useId();
  const hatchBaseId = React.useId();

  // centerlines
  type Centerline = { x: number; y1: number; y2: number; title?: string; color?: string };
  const centerlines: Centerline[] = [];
  const CENTERLINE_OVERSHOOT = 10;
  const ANCHOR_HIT_W = 28;
  const HIT_Y_PAD = 3;

  return (
    <div
      ref={rootRef as unknown as React.RefObject<HTMLDivElement>}
      className={`bhq-gantt ${className || ""}`}
      style={style}
    >
      {title ? <div className="bhq-gantt__title">{title}</div> : null}

      <div
        ref={frameRef}
        className="bhq-gantt__frame"
        style={{ width: "100%", maxWidth: fitToContent ? frameWidthFit : undefined }}
      >
        {/* Fixed labels column */}
        <div
          className="bhq-gantt__labels-col"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: LEFT_LABEL_W,
            height: frameH,
            zIndex: 2,
            background: "hsl(0 0% 8%)",
            borderRight: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <svg
            width={LEFT_LABEL_W}
            height={frameH}
            viewBox={`0 0 ${LEFT_LABEL_W} ${frameH}`}
            fill="none"
          >
            {stages.map((s, i) => {
              const y = rowYPositions[i];
              const rowH = rowHeights[i];
              const mid = y + rowH / 2;
              return (
                <g key={s.key}>
                  <line className="bhq-gantt__rowline" x1={0} x2={LEFT_LABEL_W} y1={y + rowH} y2={y + rowH} />
                  <text className="bhq-gantt__label" x={12} y={mid + 4}>{s.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Scrollable chart area */}
        <div
          className="bhq-gantt__scroll-area"
          style={{
            marginLeft: LEFT_LABEL_W,
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          <svg
            className="bhq-gantt__svg"
            style={{ width: fitToContent ? `${contentW}px` : "100%", minWidth: contentW, display: "block" }}
            height={frameH}
            viewBox={`0 0 ${contentW} ${frameH}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Gantt timeline"
            fill="none"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={0} y={0} width={contentW} height={frameH} />
              </clipPath>
            </defs>

            {/* month grid */}
            <g clipPath={`url(#${clipId})`}>
              {monthTicks.map((t, i) => {
                const adjX = t.x - LEFT_LABEL_W;
                const adjMid = t.mid - LEFT_LABEL_W;
                return (
                  <g key={`m-${i}`}>
                    <line className="bhq-gantt__grid-month" x1={adjX} x2={adjX} y1={0} y2={frameH} />
                    {t.label ? (
                      <text className="bhq-gantt__month" x={adjMid} y={14} textAnchor="middle">
                        {t.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* optional inner ticks */}
            {showIntraMonthTicks && (
              <g clipPath={`url(#${clipId})`}>
                {monthTicks.slice(0, -1).map((t, i) => {
                  const cur = new Date(start.getFullYear(), start.getMonth() + i, 1);
                  const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
                  const xStart = xOf(cur) - LEFT_LABEL_W;
                  const xEnd = Math.min(xOf(next), contentEndX) - LEFT_LABEL_W;
                  return (intraMonthDays || []).map(day => {
                    const d = new Date(cur.getFullYear(), cur.getMonth(), day);
                    if (d < cur || d >= next) return null;
                    const x = clamp(xOf(d) - LEFT_LABEL_W, xStart, xEnd);
                    return (
                      <g key={`step-${i}-${day}`}>
                        <line className="bhq-gantt__grid-step" x1={x} x2={x} y1={0} y2={frameH} />
                        {showIntraMonthLabels ? (
                          <text className="bhq-gantt__ticklabel" x={x + 2} y={14}>
                            {formatIntraDayLabel(d)}
                          </text>
                        ) : null}
                      </g>
                    );
                  });
                })}
              </g>
            )}

            {/* baselines */}
            {stages.map((s, i) => {
              const y = rowYPositions[i];
              const rowH = rowHeights[i];
              return (
                <g key={s.key}>
                  <line className="bhq-gantt__rowline" x1={0} x2={contentW} y1={y + rowH} y2={y + rowH} />
                </g>
              );
            })}

            {/* availability spans across all rows */}
            {showAvailability &&
              [...(availability?.length ? availability : showTravel ? travel : [])]
                .sort(a => a.kind === "risky" ? 1 : -1)
                .map((a, i) => {
                  const s = toDate(a.range.start);
                  const e = toDate(a.range.end);
                  if (!s || !e) return null;
                  const x1 = xOf(s) - LEFT_LABEL_W;
                  const x2 = Math.min(xOf(e), contentEndX) - LEFT_LABEL_W;
                  const w = Math.max(1, x2 - x1);
                  const y = topPad + 0.5;
                  const totalRowsH = rowHeights.reduce((sum, h) => sum + h, 0);
                  const h = totalRowsH - 1;
                  const cls = `bhq-gantt__availability ${a.kind}`;
                  const clsOutline = `bhq-gantt__availability-outline ${a.kind}`;
                  return (
                    <g key={`av-${i}`} className="bhq-gantt__availabilitywrap" clipPath={`url(#${clipId})`}>
                      <rect
                        className={cls}
                        x={x1}
                        y={y}
                        width={w}
                        height={h}
                        onMouseEnter={(e) => a.label && setHoverTooltip({ text: a.label, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => a.label && setHoverTooltip({ text: a.label, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoverTooltip(null)}
                        style={{ cursor: a.label ? "default" : undefined }}
                      />
                      <rect className={clsOutline} fill="none" x={x1} y={y} width={w} height={h} />
                    </g>
                  );
                })}

            {/* bars + hatches, centerlines collected for top layer */}
            <g clipPath={`url(#${clipId})`}>
              {stages.map((s, i) => {
                const parts = partsByKey.get(s.key) || [];
                const rowH = rowHeights[i];
                const rowTop = rowYPositions[i] + 6;
                const totalH = rowH - 12;

                // Helper to get bar time range
                const getBarRange = (p: typeof parts[0]) => {
                  const start = p.full?.start || p.likely?.start;
                  const end = p.full?.end || p.likely?.end;
                  return start && end ? { start: new Date(start as any).getTime(), end: new Date(end as any).getTime() } : null;
                };

                // Check if two bars overlap in time
                const barsOverlap = (a: typeof parts[0], b: typeof parts[0]) => {
                  const rangeA = getBarRange(a);
                  const rangeB = getBarRange(b);
                  if (!rangeA || !rangeB) return false;
                  return rangeA.start < rangeB.end && rangeA.end > rangeB.start;
                };

                // Group bars by __planId - bars with the same planId should render at the same y position
                // This allows risky edges, unlikely hatches, and center fills to layer on top of each other
                const planIdToIndices = new Map<string, number[]>();
                const noPlanIdIndices: number[] = [];

                for (let j = 0; j < parts.length; j++) {
                  const planId = parts[j].__planId;
                  if (planId) {
                    if (!planIdToIndices.has(planId)) {
                      planIdToIndices.set(planId, []);
                    }
                    planIdToIndices.get(planId)!.push(j);
                  } else {
                    noPlanIdIndices.push(j);
                  }
                }

                // For each planId group, find the "primary" bar (highest __z with a range)
                // This will be used for overlap detection between different plans
                const primaryBarIndices: number[] = [];
                const barToPlanGroup = new Map<number, string>();

                for (const [planId, indices] of planIdToIndices) {
                  // Find the primary bar in this group (highest __z with a range)
                  let primaryIdx = -1;
                  let highestZ = -1;
                  for (const idx of indices) {
                    const p = parts[idx];
                    const z = p.__z ?? 0;
                    const hasRange = !!(p.full || p.likely);
                    if (hasRange && z > highestZ) {
                      highestZ = z;
                      primaryIdx = idx;
                    }
                  }
                  if (primaryIdx >= 0) {
                    primaryBarIndices.push(primaryIdx);
                  }
                  // Map all bars in this group to the planId
                  for (const idx of indices) {
                    barToPlanGroup.set(idx, planId);
                  }
                }

                // Also include bars without __planId as individual primary bars (backwards compat)
                for (const idx of noPlanIdIndices) {
                  const p = parts[idx];
                  const z = p.__z ?? 0;
                  const hasRange = !!(p.full || p.likely);
                  if (hasRange && (z >= 3 || z === 0)) {
                    primaryBarIndices.push(idx);
                  }
                }

                // Compute overlaps among primary bars only
                const overlapCounts: number[] = parts.map(() => 1);
                const slotIndex: number[] = parts.map(() => 0);

                for (let pi = 0; pi < primaryBarIndices.length; pi++) {
                  const j = primaryBarIndices[pi];
                  let overlappingPrimaries: number[] = [j];

                  for (let pk = 0; pk < primaryBarIndices.length; pk++) {
                    const k = primaryBarIndices[pk];
                    if (j !== k && barsOverlap(parts[j], parts[k])) {
                      overlappingPrimaries.push(k);
                    }
                  }

                  overlapCounts[j] = overlappingPrimaries.length;
                  overlappingPrimaries.sort((a, b) => a - b);
                  slotIndex[j] = overlappingPrimaries.indexOf(j);
                }

                // Pre-calculate y positions for primary bars
                const primaryBarPositions = new Map<number, { y: number; h: number; cornerRadius: number }>();
                for (const pi of primaryBarIndices) {
                  const numOverlaps = overlapCounts[pi];
                  const slot = slotIndex[pi];
                  const hasOverlaps = numOverlaps > 1;
                  const gap = hasOverlaps ? 2 : 0;
                  const barH = hasOverlaps
                    ? Math.max(8, (totalH - gap * (numOverlaps - 1)) / numOverlaps)
                    : totalH;
                  const y = hasOverlaps ? rowTop + slot * (barH + gap) : rowTop;
                  const cornerRadius = hasOverlaps ? Math.min(4, barH / 2) : 6;
                  primaryBarPositions.set(pi, { y, h: barH, cornerRadius });
                }

                // Map planId groups to their primary bar's position
                const planIdToPosition = new Map<string, { y: number; h: number; cornerRadius: number }>();
                for (const [planId, indices] of planIdToIndices) {
                  // Find the primary bar for this group
                  for (const idx of indices) {
                    if (primaryBarPositions.has(idx)) {
                      planIdToPosition.set(planId, primaryBarPositions.get(idx)!);
                      break;
                    }
                  }
                }

                return (
                  <g key={`bars-${s.key}`}>
                    {parts.map((p, j) => {
                      const items: React.ReactNode[] = [];

                      // Calculate y position and height
                      // All bars with the same __planId render at the same y position (layered)
                      // This creates: unlikely (bottom) → risky (middle) → center fill (top)
                      let y: number;
                      let h: number;
                      let cornerRadius: number;

                      const planId = barToPlanGroup.get(j);
                      if (planId && planIdToPosition.has(planId)) {
                        // Bar belongs to a planId group - use the group's position
                        const pos = planIdToPosition.get(planId)!;
                        y = pos.y;
                        h = pos.h;
                        cornerRadius = pos.cornerRadius;
                      } else if (primaryBarPositions.has(j)) {
                        // Bar is a primary bar without planId
                        const pos = primaryBarPositions.get(j)!;
                        y = pos.y;
                        h = pos.h;
                        cornerRadius = pos.cornerRadius;
                      } else {
                        // Fallback: use full row height
                        y = rowTop;
                        h = totalH;
                        cornerRadius = 6;
                      }

                      // likely, hatched
                      if (p.likely?.start && p.likely?.end) {
                        const x1 = xOf(p.likely.start as Date) - LEFT_LABEL_W;
                        const x2 = Math.min(xOf(p.likely.end as Date), contentEndX) - LEFT_LABEL_W;
                        const w = Math.max(1, x2 - x1);

                        const localPatId = `${hatchBaseId}-${s.key}-${j}`;
                        const localClipId = `${hatchBaseId}-clip-${s.key}-${j}`;

                        // Use datum color if provided, otherwise fall back to stage baseColor
                        const hatchColor = (p as any).color || s.baseColor;

                        items.push(
                          <pattern
                            id={localPatId}
                            key={`pat-${j}`}
                            patternUnits="userSpaceOnUse"
                            width="8"
                            height="8"
                            patternTransform="rotate(35)"
                          >
                            <path
                              d="M0 -2 L0 10"
                              stroke={hatchColor}
                              strokeOpacity="0.55"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            />
                          </pattern>
                        );

                        items.push(
                          <clipPath id={localClipId} key={`clip-${j}`}>
                            <rect x={x1} y={y} width={w} height={h} rx={cornerRadius} ry={cornerRadius} />
                          </clipPath>
                        );

                        items.push(
                          <rect
                            key={`likely-hatch-${j}`}
                            x={x1}
                            y={y}
                            width={w}
                            height={h}
                            rx={cornerRadius}
                            ry={cornerRadius}
                            fill={`url(#${localPatId})`}
                            clipPath={`url(#${localClipId})`}
                            className="bhq-gantt__likely"
                            onMouseEnter={(e) => p.tooltip && setHoverTooltip({ text: p.tooltip, x: e.clientX, y: e.clientY })}
                            onMouseMove={(e) => p.tooltip && setHoverTooltip({ text: p.tooltip, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoverTooltip(null)}
                            style={{ cursor: p.tooltip ? "default" : undefined }}
                          />
                        );

                        items.push(
                          <rect
                            key={`likely-outline-${j}`}
                            x={x1}
                            y={y}
                            width={w}
                            height={h}
                            rx={cornerRadius}
                            ry={cornerRadius}
                            fill="none"
                            stroke={hatchColor}
                            strokeWidth={1.2}
                            opacity={0.45}
                          />
                        );
                      }

                      // solid inner (center fill or risky bands depending on caller)
                      if (p.full?.start && p.full?.end) {
                        const x1 = xOf(p.full.start as Date) - LEFT_LABEL_W;
                        const x2 = Math.min(xOf(p.full.end as Date), contentEndX) - LEFT_LABEL_W;
                        const fillColor = (p as any).color || s.baseColor;
                        const fillOpacity = (p as any).opacity ?? 1;
                        items.push(
                          <rect
                            key={`full-${j}`}
                            className="bhq-gantt__bar"
                            x={x1}
                            y={y}
                            width={Math.max(1, x2 - x1)}
                            height={h}
                            rx={cornerRadius}
                            ry={cornerRadius}
                            fill={fillColor}
                            opacity={fillOpacity}
                            stroke="none"
                            onMouseEnter={(e) => p.tooltip && setHoverTooltip({ text: p.tooltip, x: e.clientX, y: e.clientY })}
                            onMouseMove={(e) => p.tooltip && setHoverTooltip({ text: p.tooltip, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoverTooltip(null)}
                            style={{ cursor: p.tooltip ? "default" : undefined }}
                          />
                        );
                      }

                      // centerline
                      if (p.dot) {
                        const d0 = atMidnight(p.dot);
                        const x = xOf(d0) - LEFT_LABEL_W;
                        centerlines.push({
                          x,
                          y1: y - CENTERLINE_OVERSHOOT,
                          y2: y + h + CENTERLINE_OVERSHOOT,
                          title: p.tooltip,
                          color: p.color,
                        });
                      }

                      return items;
                    })}
                  </g>
                );
              })}

              {/* today */}
              {showToday && today && today >= start && today <= endInc ? (
                <line className="bhq-gantt__today" x1={xOf(today) - LEFT_LABEL_W} x2={xOf(today) - LEFT_LABEL_W} y1={0} y2={frameH} />
              ) : null}
            </g>

            {/* top layer centerlines with hit area */}
            <g>
              {centerlines.map((c, i) => {
                const hx = Math.max(0, c.x - ANCHOR_HIT_W / 2);
                const y1 = c.y1 - HIT_Y_PAD;
                const y2 = c.y2 + HIT_Y_PAD;
                return (
                  <g key={`ctr-${i}`}>
                    <line
                      className="bhq-gantt__centerline"
                      x1={c.x}
                      x2={c.x}
                      y1={c.y1}
                      y2={c.y2}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={c.color ? { stroke: c.color } : undefined}
                    />
                    <rect
                      x={hx}
                      y={y1}
                      width={ANCHOR_HIT_W}
                      height={y2 - y1}
                      fill="transparent"
                      pointerEvents="auto"
                      onMouseEnter={(e) => c.title && setHoverTooltip({ text: c.title, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => c.title && setHoverTooltip({ text: c.title, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                      style={{ cursor: c.title ? "default" : undefined }}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Custom tooltip overlay - follows mouse, styled with neon amber glow */}
      {hoverTooltip && (
        <TooltipPrimitive.Provider>
          <TooltipPrimitive.Root open>
            <TooltipPrimitive.Trigger asChild>
              <div
                style={{
                  position: "fixed",
                  left: hoverTooltip.x,
                  top: hoverTooltip.y,
                  width: 1,
                  height: 1,
                  pointerEvents: "none",
                }}
              />
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                side="top"
                align="center"
                sideOffset={8}
                className="z-50 px-3 py-2 text-sm bg-zinc-900 rounded-lg border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-in fade-in-0 zoom-in-95"
              >
                {(() => {
                  // Parse tooltip format: "[Plan Name] Phase: Date → Date" or "Phase: Date → Date"
                  const text = hoverTooltip.text;

                  // Check for [Plan Name] prefix pattern
                  const bracketMatch = text.match(/^\[([^\]]+)\]\s*(.+)$/);
                  if (bracketMatch) {
                    const planName = bracketMatch[1];
                    const rest = bracketMatch[2];

                    // Check for phase range pattern like "Birth → Placement: Dec 28, 2025 → Mar 18, 2026"
                    // Convert to "Birth Dec 28, 2025 → Placement Mar 18, 2026"
                    const phaseRangeMatch = rest.match(/^(.+?)\s*→\s*(.+?):\s*(.+?)\s*→\s*(.+)$/);
                    if (phaseRangeMatch) {
                      const [, phase1, phase2, date1, date2] = phaseRangeMatch;
                      return (
                        <>
                          <span className="font-semibold text-amber-400">{planName}</span>
                          <span className="text-zinc-400"> - </span>
                          <span className="text-zinc-100">{phase1}</span>
                          <span className="text-zinc-300"> {date1}</span>
                          <span className="text-zinc-400"> → </span>
                          <span className="text-zinc-100">{phase2}</span>
                          <span className="text-zinc-300"> {date2}</span>
                        </>
                      );
                    }

                    // Single phase with date: "Cycle Start: Jan 15, 2026"
                    const singlePhaseMatch = rest.match(/^(.+?):\s*(.+)$/);
                    if (singlePhaseMatch) {
                      const [, phase, date] = singlePhaseMatch;
                      return (
                        <>
                          <span className="font-semibold text-amber-400">{planName}</span>
                          <span className="text-zinc-400"> - </span>
                          <span className="text-zinc-100">{phase}</span>
                          <span className="text-zinc-300"> {date}</span>
                        </>
                      );
                    }

                    // No colon, just show plan name and rest
                    return (
                      <>
                        <span className="font-semibold text-amber-400">{planName}</span>
                        <span className="text-zinc-400"> - </span>
                        <span className="text-zinc-100">{rest}</span>
                      </>
                    );
                  }

                  // No bracket prefix - check for phase range pattern
                  const phaseRangeMatch = text.match(/^(.+?)\s*→\s*(.+?):\s*(.+?)\s*→\s*(.+)$/);
                  if (phaseRangeMatch) {
                    const [, phase1, phase2, date1, date2] = phaseRangeMatch;
                    return (
                      <>
                        <span className="font-semibold text-amber-400">{phase1}</span>
                        <span className="text-zinc-300"> {date1}</span>
                        <span className="text-zinc-400"> → </span>
                        <span className="font-semibold text-amber-400">{phase2}</span>
                        <span className="text-zinc-300"> {date2}</span>
                      </>
                    );
                  }

                  // Simple label: value format
                  const colonIdx = text.indexOf(":");
                  if (colonIdx > 0) {
                    const label = text.slice(0, colonIdx);
                    const details = text.slice(colonIdx + 1).trim();
                    return (
                      <>
                        <span className="font-semibold text-amber-400">{label}</span>
                        <span className="text-zinc-300"> {details}</span>
                      </>
                    );
                  }
                  return <span className="text-zinc-100">{text}</span>;
                })()}
                <TooltipPrimitive.Arrow className="fill-zinc-900" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      )}
    </div>
  );
}

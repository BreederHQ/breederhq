// packages/ui/src/components/Gantt/Gantt.tsx
import * as React from "react";
import type { StageWindows, Range } from "../../utils";
import "../../styles/gantt.css";

/* ───────────────── types ───────────────── */

export type BHQGanttStage = {
  key: string;
  label: string;
  baseColor: string;
  hatchLikely?: boolean;
};

export type AvailabilityBand = {
  kind: "risk" | "unlikely";
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
};

/* ───────────────── utils ───────────────── */

function atMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function daysDiff(a: Date, b: Date) {
  const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((B - A) / 86400000);
}
function monthsDiff(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
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
  __color?: string;
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

/* ───────────────── component ───────────────── */

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
  } = props;

  const rootRef = React.useRef<HTMLElement>(null as any);

  const LEFT_LABEL_W = 160;
  const MONTH_PX = 160;

  const cssGutter = useCssRightGutter(rootRef, 240);
  const RG = typeof rightGutter === "number" ? rightGutter : cssGutter;

  const start = atMidnight(toDate(horizon.start) || new Date());
  const end = atMidnight(toDate(horizon.end) || new Date());
  const months = clamp(monthsDiff(start, end), 0, 240);
  const contentW = Math.max(1, Math.ceil(months * MONTH_PX));
  const plotW = LEFT_LABEL_W + contentW + RG;

  const rows = stages.length;
  const rowH = heightPerRow;
  const topPad = 20;
  const bottomPad = 16;
  const frameH = topPad + rows * rowH + bottomPad;

  const totalDays = Math.max(1, daysDiff(start, end));
  const pxPerDay = contentW / totalDays;
  const xOf = (d: Date) => LEFT_LABEL_W + Math.round(pxPerDay * clamp(daysDiff(start, d), 0, totalDays));

  const monthTicks: { label: string; x: number }[] = [];
  {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const label =
        cur.getMonth() === 0
          ? cur.toLocaleString(undefined, { month: "short" }) + " "
          : cur.toLocaleString(undefined, { month: "short" });
      monthTicks.push({ label, x: xOf(cur) });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  type Part = { full?: Range | null; likely?: Range | null; dot?: Date | null; tooltip?: string; color?: string };
  const partsByKey = new Map<string, Part[]>();
  for (const s of stages) partsByKey.set(s.key, []);
  for (const row of data as unknown as StageWinLoose[]) {
    const key = (row.key || row.stage || row.name) as string;
    if (!key || !partsByKey.has(key)) continue;
    const full = pickRange(row, ["full", "fullRange"]);
    const likely = pickRange(row, ["likely", "likelyRange"]);
    const dot = pickDate(row, ["dot", "point"]);
    const part: Part = { full, likely, dot, tooltip: row.__tooltip, color: row.__color };
    partsByKey.get(key)!.push(part);
  }

  const avail = (availability && availability.length ? availability : travel) as AvailabilityBand[];

  // inline style beats .bhq-gantt__svg { width: 100% }
  const svgStyle: React.CSSProperties = fitToContent
    ? { width: `${plotW}px` }
    : { width: "100%" };

  const viewW = plotW;

  return (
    <div
      ref={rootRef as unknown as React.RefObject<HTMLDivElement>}
      className={`bhq-gantt ${className || ""}`}
      style={style}
    >
      {title ? <div className="bhq-gantt__title">{title}</div> : null}

      <div className="bhq-gantt__frame">
        <svg
          className="bhq-gantt__svg"
          style={svgStyle}
          height={frameH}
          viewBox={`0 0 ${viewW} ${frameH}`}
          role="img"
          aria-label="Gantt timeline"
        >
          {/* month grid */}
          {monthTicks.map((t, i) => (
            <g key={`m-${i}`}>
              <line className="bhq-gantt__grid-month" x1={t.x} x2={t.x} y1={0} y2={frameH} />
              <text className="bhq-gantt__month" x={t.x + 8} y={14}>{t.label}</text>
            </g>
          ))}

          {/* year on right */}
          <text className="bhq-gantt__yearrange" x={LEFT_LABEL_W + contentW - 20} y={14}>
            {end.getFullYear()}
          </text>

          {/* rows and labels */}
          {stages.map((s, i) => {
            const y = topPad + i * rowH;
            const mid = y + rowH / 2;
            return (
              <g key={s.key}>
                <line className="bhq-gantt__rowline" x1={0} x2={viewW} y1={y + rowH} y2={y + rowH} />
                <text className="bhq-gantt__label" x={12} y={mid + 4}>{s.label}</text>
              </g>
            );
          })}

          {/* availability */}
          {showAvailability &&
            avail.map((a, i) => {
              const s = toDate(a.range.start);
              const e = toDate(a.range.end);
              if (!s || !e) return null;
              const x1 = xOf(s);
              const x2 = xOf(e);
              const w = Math.max(1, x2 - x1);
              const y = topPad + 0.5;
              const h = rows * rowH - 1;
              const cls = `bhq-gantt__availability ${a.kind}`;
              return (
                <g key={`av-${i}`} className="bhq-gantt__availabilitywrap">
                  <rect className={cls} x={x1} y={y} width={w} height={h} />
                  <rect className="bhq-gantt__availability-outline" fill="none" x={x1} y={y} width={w} height={h} />
                </g>
              );
            })}

          {/* bars */}
          {stages.map((s, i) => {
            const parts = partsByKey.get(s.key) || [];
            const y = topPad + i * rowH + 6;
            const h = rowH - 12;
            return (
              <g key={`bars-${s.key}`}>
                {parts.map((p, j) => {
                  const items: React.ReactNode[] = [];
                  const base = p.color || s.baseColor;

                  if (p.full?.start && p.full?.end) {
                    const x1 = xOf(p.full.start);
                    const x2 = xOf(p.full.end);
                    const w = Math.max(1, x2 - x1);
                    items.push(
                      <rect key={`f-${j}`} className="bhq-gantt__bar" x={x1} y={y} width={w} height={h} rx={4} ry={4} fill={base} />
                    );
                  }

                  if (p.likely?.start && p.likely?.end) {
                    const x1 = xOf(p.likely.start);
                    const x2 = xOf(p.likely.end);
                    const w = Math.max(1, x2 - x1);
                    items.push(
                      <rect key={`l-${j}`} className="bhq-gantt__likely" x={x1} y={y} width={w} height={h} rx={4} ry={4} fill={base} />
                    );
                  }

                  if (p.dot) {
                    const x = xOf(p.dot);
                    items.push(<circle key={`d-${j}`} className="bhq-gantt__dot" cx={x} cy={y + h / 2} r={4} fill={base} />);
                  }

                  return items;
                })}
              </g>
            );
          })}

          {/* today */}
          {showToday && today && today >= start && today <= end ? (
            <line className="bhq-gantt__today" x1={xOf(today)} x2={xOf(today)} y1={0} y2={frameH} />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

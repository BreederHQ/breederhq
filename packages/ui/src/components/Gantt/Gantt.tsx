import * as React from "react";
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
  const rowH = heightPerRow;
  const topPad = 20;
  const bottomPad = 16;
  const frameH = topPad + rows * rowH + bottomPad;

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
        style={{ width: fitToContent ? frameWidthFit : "100%" }}
      >
        <svg
          className="bhq-gantt__svg"
          style={svgStyle}
          height={frameH}
          viewBox={`0 0 ${viewW} ${frameH}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Gantt timeline"
          fill="none"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={contentStartX} y={0} width={contentW} height={frameH} />
            </clipPath>
          </defs>

          {/* month grid */}
          <g clipPath={`url(#${clipId})`}>
            {monthTicks.map((t, i) => (
              <g key={`m-${i}`}>
                <line className="bhq-gantt__grid-month" x1={t.x} x2={t.x} y1={0} y2={frameH} />
                {t.label ? (
                  <text className="bhq-gantt__month" x={t.mid} y={14} textAnchor="middle">
                    {t.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>

          {/* optional inner ticks */}
          {showIntraMonthTicks && (
            <g clipPath={`url(#${clipId})`}>
              {monthTicks.slice(0, -1).map((t, i) => {
                const cur = new Date(start.getFullYear(), start.getMonth() + i, 1);
                const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
                const xStart = xOf(cur);
                const xEnd = Math.min(xOf(next), contentEndX);
                return (intraMonthDays || []).map(day => {
                  const d = new Date(cur.getFullYear(), cur.getMonth(), day);
                  if (d < cur || d >= next) return null;
                  const x = clamp(xOf(d), xStart, xEnd);
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

          {/* baselines + labels */}
          {stages.map((s, i) => {
            const y = topPad + i * rowH;
            const mid = y + rowH / 2;
            return (
              <g key={s.key}>
                <line className="bhq-gantt__rowline" x1={0} x2={contentEndX} y1={y + rowH} y2={y + rowH} />
                <text className="bhq-gantt__label" x={12} y={mid + 4}>{s.label}</text>
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
                const x1 = xOf(s);
                const x2 = Math.min(xOf(e), contentEndX);
                const w = Math.max(1, x2 - x1);
                const y = topPad + 0.5;
                const h = rows * rowH - 1;
                const cls = `bhq-gantt__availability ${a.kind}`;
                const clsOutline = `bhq-gantt__availability-outline ${a.kind}`;
                return (
                  <g key={`av-${i}`} className="bhq-gantt__availabilitywrap" clipPath={`url(#${clipId})`}>
                    <rect className={cls} x={x1} y={y} width={w} height={h}>
                      {a.label ? <title>{a.label}</title> : null}
                    </rect>
                    <rect className={clsOutline} fill="none" x={x1} y={y} width={w} height={h} />
                  </g>
                );
              })}

          {/* bars + hatches, centerlines collected for top layer */}
          <g clipPath={`url(#${clipId})`}>
            {stages.map((s, i) => {
              const parts = partsByKey.get(s.key) || [];
              const y = topPad + i * rowH + 6;
              const h = rowH - 12;

              return (
                <g key={`bars-${s.key}`}>
                  {parts.map((p, j) => {
                    const items: React.ReactNode[] = [];

                    // likely, hatched
                    if (p.likely?.start && p.likely?.end) {
                      const x1 = xOf(p.likely.start as Date);
                      const x2 = Math.min(xOf(p.likely.end as Date), contentEndX);
                      const w = Math.max(1, x2 - x1);

                      const localPatId = `${hatchBaseId}-${s.key}-${j}`;
                      const localClipId = `${hatchBaseId}-clip-${s.key}-${j}`;

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
                            stroke={s.baseColor}
                            strokeOpacity="0.55"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </pattern>
                      );

                      items.push(
                        <clipPath id={localClipId} key={`clip-${j}`}>
                          <rect x={x1} y={y} width={w} height={h} rx={6} ry={6} />
                        </clipPath>
                      );

                      items.push(
                        <rect
                          key={`likely-hatch-${j}`}
                          x={x1}
                          y={y}
                          width={w}
                          height={h}
                          rx={6}
                          ry={6}
                          fill={`url(#${localPatId})`}
                          clipPath={`url(#${localClipId})`}
                          className="bhq-gantt__likely"
                        >
                          {p.tooltip ? <title>{p.tooltip}</title> : null}
                        </rect>
                      );

                      items.push(
                        <rect
                          key={`likely-outline-${j}`}
                          x={x1}
                          y={y}
                          width={w}
                          height={h}
                          rx={6}
                          ry={6}
                          fill="none"
                          stroke={s.baseColor}
                          strokeWidth={1.2}
                          opacity={0.45}
                        />
                      );
                    }

                    // solid inner (center fill or risky bands depending on caller)
                    if (p.full?.start && p.full?.end) {
                      const x1 = xOf(p.full.start as Date);
                      const x2 = Math.min(xOf(p.full.end as Date), contentEndX);
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
                          rx={6}
                          ry={6}
                          fill={fillColor}
                          opacity={fillOpacity}
                          stroke="none"
                        >
                          {p.tooltip ? <title>{p.tooltip}</title> : null}
                        </rect>
                      );
                    }

                    // centerline
                    if (p.dot) {
                      const d0 = atMidnight(p.dot);
                      const x = xOf(d0);
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
              <line className="bhq-gantt__today" x1={xOf(today)} x2={xOf(today)} y1={0} y2={frameH} />
            ) : null}
          </g>

          {/* top layer centerlines with hit area */}
          <g>
            {centerlines.map((c, i) => {
              const hx = Math.max(contentStartX, c.x - ANCHOR_HIT_W / 2);
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
                  >
                    {c.title ? <title>{c.title}</title> : null}
                  </rect>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

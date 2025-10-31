// packages/ui/src/components/Gantt/Gantt.tsx
import * as React from "react";
import type { StageWindows, Range } from "../../utils";
import "../../styles/gantt.css";

export type BHQGanttStage = {
  key: string;
  label: string;
  baseColor: string;
  hatchLikely?: boolean;
};

/** Accept "risky" or "unlikely". Normalize internally. */
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
  horizon: Range;
  today?: Date;
  heightPerRow?: number;
  showToday?: boolean;
  showAvailability?: boolean;
  fitToContent?: boolean;
  className?: string;
};

function daysDiff(a: Date, b: Date) {
  const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((B - A) / 86400000);
}
function yearRangeText(a: Date, b: Date) {
  const y1 = a.getFullYear();
  const y2 = b.getFullYear();
  return y1 === y2 ? String(y1) : `${y1}-${y2}`;
}
function fmtDateShort(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : String(m);
  const dd = day < 10 ? `0${day}` : String(day);
  return `${y}-${mm}-${dd}`;
}

export default function BHQGantt({
  title,
  stages,
  data,
  availability,
  horizon,
  today,
  heightPerRow = 26,
  showToday = true,
  showAvailability = true,
  fitToContent = true,
  className,
}: BHQGanttProps) {
  const rows = stages.map((s) => s.key);

  const vbWidth = 1200;
  const labelGutter = 220;
  const chartX0 = labelGutter;
  const chartX1 = vbWidth - 12;
  const chartWidth = chartX1 - chartX0;

  const topAxisPad = 26;
  const rowTopOffset = topAxisPad + 12;
  const barH = Math.max(18, heightPerRow);
  const rowGap = 5;
  const rowY = (i: number) => rowTopOffset + i * (barH + rowGap);
  const lastRowBottom = rows.length ? rowY(rows.length - 1) + barH : rowTopOffset + barH;
  const vbHeight = Math.ceil(lastRowBottom + 24);
  const pixelHeight = vbHeight;

  // normalize availability kinds for CSS class
  const avail = (availability ?? []).map((b) => ({ ...b, kind: b.kind === "risky" ? "risky" : "unlikely" }));

  const clampMin = new Date(horizon.start);
  const clampMax = new Date(horizon.end);

  let fitMin = new Date(clampMin);
  let fitMax = new Date(clampMax);

  if (fitToContent) {
    const PAD_DAYS = 14;
    const allDates: number[] = [];
    for (const sw of data) {
      const fs = new Date(sw.full.start as any).getTime();
      const fe = new Date(sw.full.end as any).getTime();
      if (Number.isFinite(fs)) allDates.push(fs);
      if (Number.isFinite(fe)) allDates.push(fe);
      if (sw.likely) {
        const ls = new Date(sw.likely.start as any).getTime();
        const le = new Date(sw.likely.end as any).getTime();
        if (Number.isFinite(ls)) allDates.push(ls);
        if (Number.isFinite(le)) allDates.push(le);
      }
    }
    for (const t of avail) {
      const ts = new Date(t.range.start as any).getTime();
      const te = new Date(t.range.end as any).getTime();
      if (Number.isFinite(ts)) allDates.push(ts);
      if (Number.isFinite(te)) allDates.push(te);
    }
    if (allDates.length) {
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      fitMin = new Date(Math.max(clampMin.getTime(), minDate.getTime() - PAD_DAYS * 86400000));
      fitMax = new Date(Math.min(clampMax.getTime(), maxDate.getTime() + PAD_DAYS * 86400000));
    }
  } else {
    fitMin = new Date(clampMin.getFullYear(), clampMin.getMonth(), 1);
    fitMax = new Date(clampMax.getFullYear(), clampMax.getMonth() + 1, 0);
  }

  const totalDays = Math.max(1, daysDiff(fitMin, fitMax));
  const clampDate = (d: Date) =>
    new Date(Math.min(fitMax.getTime(), Math.max(fitMin.getTime(), d.getTime())));

  const xUnit = (d: Date) => {
    const dx = Math.min(totalDays, Math.max(0, daysDiff(fitMin, d)));
    return chartX0 + (chartWidth * dx) / totalDays;
  };
  const widthUnit = (s: Date, e: Date) => {
    const cs = clampDate(s);
    const ce = clampDate(e);
    const wDays = Math.max(0, daysDiff(cs, ce) + 1);
    return (chartWidth * wDays) / totalDays;
  };

  const byKey = new Map<string, StageWindows>(data.map((d) => [d.key, d]));
  const uid = React.useId();

  const tooltipFor = (sw: StageWindows, stage: BHQGanttStage) => {
    const custom = (sw as any).__tooltip;
    if (custom) return String(custom);
    const s = new Date(sw.full.start as any);
    const e = new Date(sw.full.end as any);
    const range = fmtDateShort(s) + (daysDiff(s, e) !== 0 ? ` → ${fmtDateShort(e)}` : "");
    return `${stage.label} • ${range}`;
  };

  return (
    <div className={`bhq-gantt ${className ?? ""}`} role="figure" aria-label={title || "Gantt chart"}>
      {title ? <div className="bhq-gantt__title">{title}</div> : null}
      <div className="bhq-gantt__frame">
        <svg
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
          preserveAspectRatio="none"
          className="bhq-gantt__svg"
          style={{ width: "100%", height: pixelHeight }}
          role="img"
          aria-labelledby={title ? `${uid}-title` : undefined}
        >
          {title ? <title id={`${uid}-title`}>{title}</title> : null}

          {/* AVAILABILITY BANDS */}
          {showAvailability &&
            avail.map((t, i) => {
              const s = new Date(t.range.start as any);
              const e = new Date(t.range.end as any);
              const x = xUnit(clampDate(s));
              const w = widthUnit(s, e);
              const y = topAxisPad;
              const h = vbHeight - topAxisPad - 12;
              const fillOverride = t.__color;
              const label = t.label || (t.kind === "risky" ? "Availability Risky" : "Availability Unlikely");
              const cls = t.kind === "risky" ? "risky" : "unlikely";
              return (
                <g key={`avail-${i}`} className="bhq-gantt__availabilitywrap">
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    className={`bhq-gantt__availability ${cls}`}
                    style={fillOverride ? { fill: fillOverride, opacity: 0.10 } : undefined}
                  >
                    <title>{label}</title>
                  </rect>
                  <rect x={x} y={y} width={w} height={h} fill="none" className="bhq-gantt__availability-outline" />
                </g>
              );
            })}

          {/* MONTH GRID */}
          {(() => {
            const nodes: React.ReactNode[] = [];
            const start = new Date(fitMin.getFullYear(), fitMin.getMonth(), 1);
            const afterEnd = new Date(fitMax.getFullYear(), fitMax.getMonth() + 1, 1);

            for (let d = new Date(start); d < afterEnd; d.setMonth(d.getMonth() + 1)) {
              const monthStart = new Date(d);
              const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
              const xStart = xUnit(monthStart);
              const xEnd = xUnit(next);
              const xMid = xStart + (xEnd - xStart) / 2;

              nodes.push(
                <line
                  key={`mline-${monthStart.getFullYear()}-${monthStart.getMonth()}`}
                  x1={xStart}
                  x2={xStart}
                  y1={topAxisPad}
                  y2={vbHeight - 10}
                  className="bhq-gantt__grid-month"
                  vectorEffect="non-scaling-stroke"
                />
              );

              nodes.push(
                <text
                  key={`mlabel-${monthStart.getFullYear()}-${monthStart.getMonth()}`}
                  x={xMid}
                  y={topAxisPad - 6}
                  className="bhq-gantt__month"
                  textAnchor="middle"
                >
                  {monthStart.toLocaleString(undefined, { month: "short" })}
                  {monthStart.getMonth() === 0 ? ` ${String(monthStart.getFullYear()).slice(-2)}` : ""}
                </text>
              );
            }

            nodes.push(
              <line
                key="axis-right-close"
                x1={xUnit(afterEnd)}
                x2={xUnit(afterEnd)}
                y1={topAxisPad}
                y2={vbHeight - 10}
                className="bhq-gantt__grid-month"
                vectorEffect="non-scaling-stroke"
              />
            );
            nodes.push(
              <line
                key="axis-top"
                x1={chartX0}
                x2={chartX1}
                y1={topAxisPad}
                y2={topAxisPad}
                className="bhq-gantt__rowline"
                vectorEffect="non-scaling-stroke"
              />
            );
            return nodes;
          })()}

          {/* YEAR TAG */}
          <text x={chartX1} y={topAxisPad - 6} className="bhq-gantt__yearrange" textAnchor="end">
            {yearRangeText(fitMin, fitMax)}
          </text>

          {/* ROW LINES */}
          {stages.map((_, i) => (
            <line
              key={`rowline-${i}`}
              x1={chartX0}
              x2={chartX1}
              y1={rowY(i) + barH + 2}
              y2={rowY(i) + barH + 2}
              className="bhq-gantt__rowline"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* LEFT LABELS */}
          {stages.map((s, idx) => (
            <text key={`label-${s.key}`} x={14} y={rowY(idx) + barH * 0.72} className="bhq-gantt__label">
              {s.label}
            </text>
          ))}

          {/* STAGE BARS */}
          {stages.map((s, idx) => {
            const sw = byKey.get(s.key);
            const yTop = rowY(idx);
            if (!sw) return null;

            const fs = new Date(sw.full.start as any);
            const fe = new Date(sw.full.end as any);
            const x = xUnit(fs);
            const w = widthUnit(fs, fe);
            const barColor = ((sw as any).__barColor as string) || s.baseColor;
            const tip = tooltipFor(sw, s);

            return (
              <g key={s.key}>
                {w < 1.2 ? (
                  <circle cx={x} cy={yTop + barH / 2} r={3.2} fill={barColor} className="bhq-gantt__dot">
                    <title>{tip}</title>
                  </circle>
                ) : (
                  <rect x={x} y={yTop} width={w} height={barH} rx={3} fill={barColor} className="bhq-gantt__bar">
                    <title>{tip}</title>
                  </rect>
                )}

                {sw.likely && s.hatchLikely ? (
                  <>
                    <pattern id={`${uid}-hatch-${s.key}`} patternUnits="userSpaceOnUse" width="4" height="4">
                      <path d="M0,4 l4,-4" stroke={barColor} strokeWidth="0.25" />
                    </pattern>
                    <rect
                      x={xUnit(new Date(sw.likely.start as any))}
                      y={yTop}
                      width={widthUnit(new Date(sw.likely.start as any), new Date(sw.likely.end as any))}
                      height={barH}
                      rx={3}
                      fill={`url(#${uid}-hatch-${s.key})`}
                      className="bhq-gantt__likely"
                    >
                      <title>{`${s.label} (likely)`}</title>
                    </rect>
                  </>
                ) : null}
              </g>
            );
          })}

          {/* TODAY */}
          {showToday && today ? (
            <line
              x1={xUnit(today)}
              x2={xUnit(today)}
              y1={topAxisPad}
              y2={vbHeight - 10}
              className="bhq-gantt__today"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

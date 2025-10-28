// packages/ui/components/Gantt.tsx
import * as React from "react";
import type { StageWindows, TravelBand, Range } from "../../utils";

export type BHQGanttStage = {
  key: string;
  label: string;
  baseColor: string;
  hatchLikely?: boolean;
};

export type BHQGanttProps = {
  title?: string;
  stages: BHQGanttStage[]; // visual config and order
  data: StageWindows[];    // computed windows
  travel?: TravelBand[];
  horizon: Range;          // min→max timeline
  today?: Date;
  heightPerRow?: number;
  showToday?: boolean;
  showTravel?: boolean;
  className?: string;
};

function daysDiff(a: Date, b: Date) {
  const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.floor((B - A) / 86400000));
}

export default function BHQGantt({
  title,
  stages,
  data,
  travel = [],
  horizon,
  today,
  heightPerRow = 34,
  showToday = true,
  showTravel = true,
  className,
}: BHQGanttProps) {
  const min = horizon.start;
  const max = horizon.end;
  const totalDays = Math.max(1, daysDiff(min, max));
  const rows = stages.map(s => s.key);
  const height = rows.length * heightPerRow + 60;

  const xPct = (d: Date) => (100 * Math.min(totalDays, Math.max(0, daysDiff(min, d)))) / totalDays;
  const widthPct = (start: Date, end: Date) =>
    (100 * Math.max(0, daysDiff(start, end))) / totalDays;

  const rowY = (rowIdx: number) => 40 + rowIdx * heightPerRow;
  const barH = Math.max(10, heightPerRow - 14);

  const byKey = new Map<string, StageWindows>(data.map(d => [d.key, d]));

  return (
    <div className={className}>
      {title ? <div className="mb-2 text-sm font-semibold">{title}</div> : null}
      <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-auto">
          {/* Axis ticks */}
          {Array.from({ length: totalDays + 1 }).map((_, i) => {
            const d = new Date(min);
            d.setDate(min.getDate() + i);
            const isMonthStart = d.getDate() === 1;
            const isWeek = d.getDay() === 1;
            const x = xPct(d);
            if (!(isMonthStart || isWeek)) return null;
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={isMonthStart ? 20 : 28}
                  y2={height}
                  stroke={isMonthStart ? "#ddd" : "#eee"}
                  strokeDasharray={isMonthStart ? "2 0" : "2 2"}
                  strokeWidth={isMonthStart ? 0.6 : 0.4}
                />
                {isMonthStart ? (
                  <text x={x + 0.4} y={14} fontSize={3} fill="#555">
                    {d.toLocaleString(undefined, { month: "short" })} {String(d.getFullYear()).slice(-2)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Travel bands */}
          {showTravel &&
            travel.map((t, idx) => {
              const x = xPct(t.range.start);
              const w = widthPct(t.range.start, t.range.end);
              const y = 28;
              const h = height - y - 6;
              const fill = t.kind === "risk" ? "rgba(255,0,0,0.06)" : "rgba(255,165,0,0.06)";
              const stroke = t.kind === "risk" ? "rgba(255,0,0,0.35)" : "rgba(255,165,0,0.35)";
              return (
                <g key={`travel-${idx}`}>
                  <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={0.5} />
                  <text x={x + 0.5} y={y + 6} fontSize={3} fill="#444">
                    {t.label} {t.range.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} -{" "}
                    {t.range.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </text>
                </g>
              );
            })}

          {/* Rows and bars */}
          {stages.map((s, idx) => {
            const rowTop = rowY(idx);
            const sw = byKey.get(s.key);
            return (
              <g key={s.key}>
                <text x={0.8} y={rowTop - 6} fontSize={3.2} fill="#222">
                  {s.label}
                </text>
                {sw ? (
                  <rect
                    x={xPct(sw.full.start)}
                    y={rowTop}
                    width={widthPct(sw.full.start, sw.full.end)}
                    height={barH}
                    rx={1.5}
                    fill={s.baseColor}
                    opacity={0.65}
                  />
                ) : null}
                {sw?.likely && s.hatchLikely ? (
                  <>
                    <pattern id={`hatch-${s.key}`} patternUnits="userSpaceOnUse" width="2" height="2">
                      <path d="M0,0 l2,2 M-1,1 l1,1 M1,-1 l1,1" stroke="black" strokeWidth="0.1" opacity="0.3" />
                    </pattern>
                    <rect
                      x={xPct(sw.likely.start)}
                      y={rowTop}
                      width={widthPct(sw.likely.start, sw.likely.end)}
                      height={barH}
                      rx={1.5}
                      fill={`url(#hatch-${s.key})`}
                    />
                  </>
                ) : null}
              </g>
            );
          })}

          {/* Today line */}
          {showToday && today ? (
            <line
              x1={xPct(today)}
              x2={xPct(today)}
              y1={20}
              y2={height}
              stroke="red"
              strokeDasharray="2 2"
              strokeWidth={0.6}
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

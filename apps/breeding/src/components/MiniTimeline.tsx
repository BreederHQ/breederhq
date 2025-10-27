import * as React from "react";

type Props = {
  start?: string | null;
  end?: string | null;
  today?: Date;
  className?: string;
};

function MiniTimeline({ start, end, today, className }: Props) {
  const t = today ?? new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  const center = (() => {
    if (s && e) return new Date((s.getTime() + e.getTime()) / 2);
    if (s) return s;
    if (e) return e;
    return t;
  })();

  const days = 90;
  const viewportStart = new Date(center);
  viewportStart.setDate(center.getDate() - Math.floor(days / 2));
  const viewportEnd = new Date(center);
  viewportEnd.setDate(center.getDate() + Math.ceil(days / 2));

  const clamp = (d: Date, a: Date, b: Date) => Math.min(Math.max(d.getTime(), a.getTime()), b.getTime());
  const pct = (d: Date) => {
    const a = viewportStart.getTime();
    const b = viewportEnd.getTime();
    return ((clamp(d, viewportStart, viewportEnd) - a) / (b - a)) * 100;
  };

  const hasStart = !!s;
  const hasEnd = !!e;
  const left = hasStart ? pct(s!) : 0;
  const right = hasEnd ? pct(e!) : hasStart ? left + 3 : 100;
  const width = Math.max(2, right - left);
  const todayX = pct(t);

  const inWindow =
    s && e ? t >= s && t <= e :
    s && !e ? Math.abs(t.getTime() - s.getTime()) < 1000 * 60 * 60 * 24 * 14 :
    !s && e ? Math.abs(t.getTime() - e.getTime()) < 1000 * 60 * 60 * 24 * 14 :
    false;

  return (
    <div className={["w-full h-[18px] flex items-center", className || ""].join(" ")}>
      <div className="relative w-full h-[6px] rounded-full bg-[hsl(var(--muted))]">
        {(hasStart || hasEnd) && (
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              background: inWindow ? "hsl(var(--brand-orange))" : "hsl(var(--muted-foreground))",
              opacity: inWindow ? 0.9 : 0.6,
            }}
          />
        )}
        <div
          className="absolute top-[-3px] w-[2px] h-[12px] bg-[hsl(var(--foreground))] opacity-80"
          style={{ left: `calc(${todayX}% - 1px)` }}
        />
      </div>
    </div>
  );
}

export default MiniTimeline;

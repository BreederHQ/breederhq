// apps/platform/src/components/dashboard/KpiPanel.tsx
import * as React from "react";

type KPI = {
  key: string;
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  trend?: "up" | "down" | "flat";
};

export default function KpiPanel({ kpis }: { kpis: KPI[] }) {
  const items = kpis ?? [];
  return (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Program KPIs</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(k => (
          <div key={k.key} className="rounded-2xl border border-black/5 p-4">
            <div className="text-xs opacity-70">{k.label}</div>
            <div className="text-2xl font-semibold">
              {k.value}
              {k.unit}
            </div>
            {k.trend && <Trend t={k.trend} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Trend({ t }: { t: "up" | "down" | "flat" }) {
  const label = t === "up" ? "Improving" : t === "down" ? "Declining" : "Stable";
  return <div className="text-xs opacity-70">{label}</div>;
}

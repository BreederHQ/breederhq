import * as React from "react";

export type PlanSummary = {
  name: string;
  status?: string | null;
  species?: string | null;
  damName?: string | null;
  sireName?: string | null;
  expectedDue?: string | null;
  expectedGoHome?: string | null;
  riskScore?: number | null; // 0–100
  depositsCommitted?: number | null; // cents
  depositsPaid?: number | null;      // cents
};

function cents(n?: number | null) {
  if (n == null) return "$0";
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function PlanSummaryBar({ plan }: { plan: PlanSummary }) {
  const risk = Math.max(0, Math.min(100, plan.riskScore ?? 0));
  const riskColor =
    risk >= 67 ? "bg-red-500" : risk >= 34 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="mb-3 rounded-xl border border-hairline bg-surface/70 backdrop-blur p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-base font-semibold">{plan.name}</div>
        <div className="px-2 py-[2px] text-xs rounded-full bg-white/5 border border-white/10">
          {plan.status || "—"}
        </div>
        {plan.species ? (
          <div className="px-2 py-[2px] text-xs rounded-full bg-white/5 border border-white/10">
            {plan.species}
          </div>
        ) : null}
        <div className="flex items-center gap-2 ml-auto">
          <div className="text-xs text-secondary">
            Birth (exp):{" "}
            <span className="text-primary">
              {plan.expectedDue ? new Date(plan.expectedDue).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="text-xs text-secondary">
            Go home (exp):{" "}
            <span className="text-primary">
              {plan.expectedGoHome ? new Date(plan.expectedGoHome).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${riskColor}`} />
            <div className="text-xs text-secondary">Risk {risk}%</div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-sm text-secondary flex flex-wrap gap-x-4 gap-y-1">
        <div>
          Dam: <span className="text-primary">{plan.damName || "—"}</span>
        </div>
        <div>
          Sire: <span className="text-primary">{plan.sireName || "—"}</span>
        </div>
        <div>
          Deposits:{" "}
          <span className="text-primary">
            {cents(plan.depositsPaid)} / {cents(plan.depositsCommitted)}
          </span>
        </div>
      </div>
    </div>
  );
}

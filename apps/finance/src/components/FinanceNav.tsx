// apps/finance/src/components/FinanceNav.tsx
import * as React from "react";

export type FinanceView = "home" | "invoices" | "expenses";

type Props = {
  view: FinanceView;
  onChange: (v: FinanceView) => void;
  className?: string;
};

export default function FinanceNav({ view, onChange, className }: Props) {
  const containerClasses = [
    "inline-flex items-end gap-6",
    className || "",
  ].join(" ");

  const baseTab = "pb-1 text-sm font-medium transition-colors select-none cursor-pointer";
  const inactiveText = "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";
  const activeText = "text-neutral-900 dark:text-neutral-50";

  return (
    <div className={containerClasses} role="tablist" aria-label="Finance navigation">
      <button
        type="button"
        role="tab"
        aria-selected={view === "home"}
        onClick={() => onChange("home")}
        className={[baseTab, view === "home" ? activeText : inactiveText].join(" ")}
        style={{
          borderBottom: view === "home" ? "2px solid #f97316" : "2px solid transparent",
        }}
      >
        Home
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={view === "invoices"}
        onClick={() => onChange("invoices")}
        className={[baseTab, view === "invoices" ? activeText : inactiveText].join(" ")}
        style={{
          borderBottom: view === "invoices" ? "2px solid #f97316" : "2px solid transparent",
        }}
      >
        Invoices
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={view === "expenses"}
        onClick={() => onChange("expenses")}
        className={[baseTab, view === "expenses" ? activeText : inactiveText].join(" ")}
        style={{
          borderBottom: view === "expenses" ? "2px solid #f97316" : "2px solid transparent",
        }}
      >
        Expenses
      </button>
    </div>
  );
}

import * as React from "react";

type Variant = "neutral" | "amber" | "red" | "green" | "blue" | "success" | "default";

const map: Record<Variant, string> = {
  neutral: "bg-surface-strong border-hairline text-secondary",
  amber:   "bg-amber-200/70 border-amber-300 text-amber-900",
  red:     "bg-red-200/70 border-red-300 text-red-900",
  green:   "bg-green-200/70 border-green-300 text-green-900",
  blue:    "bg-blue-200/70 border-blue-300 text-blue-900",
  default: "bg-surface-strong border-hairline text-secondary",
  success: "bg-green-200/70 border-green-300 text-green-900",
};

export type BadgeProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  title?: string;
};

export function Badge({ children, variant = "neutral", className = "", title }: BadgeProps) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
        map[variant],
        className
      ].join(" ")}
    >
      {children}
    </span>
  );
}

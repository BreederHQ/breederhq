import * as React from "react";

type Variant = "neutral" | "amber" | "red" | "green" | "blue" | "success" | "default";

// Dark-mode friendly badge styles with subtle glow effects
const map: Record<Variant, string> = {
  neutral: "bg-zinc-800/80 border-zinc-600/50 text-zinc-300",
  amber:   "bg-amber-900/40 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
  red:     "bg-red-900/40 border-red-500/50 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
  green:   "bg-emerald-900/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  blue:    "bg-blue-900/40 border-blue-500/50 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
  default: "bg-zinc-800/80 border-zinc-600/50 text-zinc-300",
  success: "bg-emerald-900/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border backdrop-blur-sm",
        map[variant],
        className
      ].join(" ")}
    >
      {children}
    </span>
  );
}

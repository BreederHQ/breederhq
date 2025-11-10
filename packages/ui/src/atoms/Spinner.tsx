import * as React from "react";

export type SpinnerProps = {
  size?: number;           // px, clamped 12..64
  className?: string;
  title?: string;          // for screen readers
};

export function Spinner({ size = 16, className = "", title = "Loading" }: SpinnerProps) {
  const s = Math.max(12, Math.min(64, size));
  const bw = Math.max(2, Math.round(s / 8));
  return (
    <span
      role="status"
      aria-label={title}
      style={{ width: s, height: s, borderWidth: bw }}
      className={[
        "inline-block align-[-2px] border-current border-t-transparent rounded-full animate-spin",
        className,
      ].join(" ")}
    />
  );
}

// packages/ui/src/components/Input/Input.tsx
import React from "react";
import clsx from "clsx";

type Native = React.InputHTMLAttributes<HTMLInputElement>;
type Props = Native & { tone?: "default" | "subtle" };

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, tone = "default", ...props },
  ref
) {
  const base = "h-10 w-full rounded-xl bg-surface px-3 text-sm placeholder:text-fg-muted outline-none";

  const chrome =
    tone === "subtle"
      // no Tailwind border/ring utilities here (they were blocking overrides)
      ? "border-0 ring-0 shadow-none" // keep the element clean…
      : "border border-surface-border focus:ring-2 focus:ring-brand/40";

  // For subtle, draw a 1px hairline via box-shadow so it looks like a light border
  const style = tone === "subtle"
    ? ({ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.14)" } as React.CSSProperties)
    : undefined;

  return (
    <input
      ref={ref}
      className={clsx(base, chrome, className)}
      style={style}
      {...props}
    />
  );
});

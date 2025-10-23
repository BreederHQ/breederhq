// packages/ui/src/components/Input/Input.tsx
import React from "react";
import clsx from "clsx";

type Native = React.InputHTMLAttributes<HTMLInputElement>;

type Props = Native & {
  tone?: "default" | "subtle";
  size?: "sm" | "md";
};

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, tone = "default", size = "md", ...props },
  ref
) {
  const h = size === "sm" ? "h-9 text-sm rounded-md" : "h-10 text-sm rounded-md";

  // Base BHQ look (uses your tokens from global.css)
  const base =
    "w-full bg-card border border-hairline px-3 placeholder:text-secondary outline-none";

  // Orange focus ring just like the rest of BHQ
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]";

  // Optional “subtle” tone (no hard border, hairline via shadow)
  const subtle =
    "border-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]";

  return (
    <input
      ref={ref}
      className={clsx(h, tone === "subtle" ? subtle : undefined, base, focus, className)}
      {...props}
    />
  );
});

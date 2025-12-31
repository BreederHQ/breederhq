import React from "react";
import clsx from "clsx";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  tone?: "default" | "subtle";
  size?: "sm" | "md";
  /** UI-only. Do not forward to DOM. */
  showIcon?: boolean;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  /** Optional wrapper class when rendering an icon. */
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, tone = "default", size = "md", ...allProps },
  ref
) {
  // hard strip UI-only props
  const { showIcon, icon, wrapperClassName, ...props } = allProps;
  // belt-and-suspenders: delete if something slipped through
  if ("showIcon" in (props as any)) delete (props as any).showIcon;

  const h = size === "sm" ? "h-9 text-sm rounded-md" : "h-10 text-sm rounded-md";

  // Base BHQ look (uses your tokens from global.css)
  const base =
    "w-full bg-card border border-hairline px-3 placeholder:text-secondary outline-none";

  // Orange focus ring just like the rest of BHQ
  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]";

  // Optional subtle tone (no hard border, hairline via shadow)
  const subtle = "border-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]";

  const withIcon = !!(showIcon && icon);

  const inputEl = (
    <input
      ref={ref}
      className={clsx(
        h,
        tone === "subtle" ? subtle : undefined,
        base,
        focus,
        withIcon ? "pl-8" : undefined,
        className
      )}
      {...props}
    />
  );

  if (!withIcon) return inputEl;

  return (
    <div className={clsx("relative", wrapperClassName)}>
      <span
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        {icon}
      </span>
      {inputEl}
    </div>
  );
});

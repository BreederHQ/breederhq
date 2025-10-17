import React from "react";
import clsx from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "soft" | "outline" | "destructive";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((
  {
    variant = "primary",
    size = "md",
    loading = false,
    className,
    children,
    ...rest
  },
  ref
) => {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "transition-colors transition-transform duration-200 " +
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_hsl(var(--brand-orange))] " +
    "active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none";

  const sizes =
    size === "sm" ? "h-8 px-3 text-xs"
      : size === "icon" ? "h-9 w-9 text-sm"
        : "h-9 px-3 text-sm";

  const variants =
    variant === "primary"
      ? "text-black bg-[hsl(var(--brand-orange))] " +
      "hover:-translate-y-px hover:shadow-[0_10px_28px_-12px_hsl(var(--brand-orange))]"
      : variant === "secondary"
        ? "text-primary bg-surface-strong border border-hairline hover:bg-surface hover:-translate-y-px"
        : variant === "outline"
          ? "text-primary bg-transparent border border-hairline hover:bg-surface/60"
          : variant === "soft"
            ? "text-primary bg-[hsl(var(--brand-teal))]/15 hover:bg-[hsl(var(--brand-teal))]/22"
            : variant === "ghost"
              ? "text-secondary bg-transparent hover:bg-[hsl(var(--brand-orange))]/12"
              : /* destructive */
              "text-white bg-red-600 hover:bg-red-500";

  const onMoveGlow = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", `${e.clientX - r.left}px`);
    el.style.setProperty("--py", `${e.clientY - r.top}px`);
  };

  return (
    <button
      ref={ref}
      data-glow
      onMouseMove={onMoveGlow}
      className={clsx(base, sizes, variants, "bhq-shadow", className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
});

export { Button };
export default Button;

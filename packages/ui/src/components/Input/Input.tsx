import React from "react";
import clsx from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-10 w-full rounded-xl border border-surface-border bg-surface px-3 text-sm",
        "placeholder:text-fg-muted outline-none focus:ring-2 focus:ring-brand/40",
        className
      )}
      {...props}
    />
  );
});

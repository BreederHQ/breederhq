// apps/marketplace/src/shared/ui/Button.tsx
import * as React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

/**
 * Button component with variants.
 */
export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: Props) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const variantClasses = {
    primary: "bg-brand-orange text-black hover:opacity-90",
    secondary: "bg-surface-2 border border-hairline text-primary hover:bg-surface-strong",
    ghost: "text-secondary hover:text-primary hover:bg-surface-2",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

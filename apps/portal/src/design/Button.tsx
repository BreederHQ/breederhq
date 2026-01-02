// apps/portal/src/design/Button.tsx
import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--portal-accent)",
    color: "var(--portal-text-primary)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--portal-accent)",
  },
  secondary: {
    background: "transparent",
    color: "var(--portal-text-primary)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--portal-border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--portal-text-secondary)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
  },
};

const variantHoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--portal-accent-hover)",
    borderColor: "var(--portal-accent-hover)",
  },
  secondary: {
    background: "var(--portal-bg-elevated)",
    borderColor: "var(--portal-text-secondary)",
  },
  ghost: {
    background: "var(--portal-bg-elevated)",
    color: "var(--portal-text-primary)",
  },
};

export function Button({
  variant = "primary",
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    fontSize: "var(--portal-font-size-base)",
    fontWeight: "var(--portal-font-weight-medium)",
    padding: "var(--portal-space-1) var(--portal-space-2)",
    borderRadius: "var(--portal-radius-md)",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all var(--portal-transition)",
    opacity: disabled ? 0.5 : 1,
    ...variantStyles[variant],
    ...(isHovered && !disabled ? variantHoverStyles[variant] : {}),
    ...style,
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}

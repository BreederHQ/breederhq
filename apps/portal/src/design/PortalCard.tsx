// apps/portal/src/design/PortalCard.tsx
// Shared card component for all portal pages
// Premium treatment with depth, hover effects, and consistent styling
import * as React from "react";

/* ────────────────────────────────────────────────────────────────────────────
 * Card Variants
 * ──────────────────────────────────────────────────────────────────────────── */

export type CardVariant = "elevated" | "flat" | "interactive" | "hero";

interface PortalCardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  padding?: "none" | "sm" | "md" | "lg";
}

export function PortalCard({
  variant = "elevated",
  children,
  onClick,
  style,
  padding = "md",
}: PortalCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const isClickable = !!onClick;

  const paddingMap = {
    none: "0",
    sm: "var(--portal-space-3)",
    md: "var(--portal-space-4)",
    lg: "var(--portal-space-5)",
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "hero":
        return {
          background: "var(--portal-gradient-hero), var(--portal-bg-card)",
          border: "1px solid var(--portal-border-glow)",
          borderRadius: "var(--portal-radius-2xl)",
          boxShadow: isHovered && isClickable
            ? "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 107, 53, 0.15)"
            : "var(--portal-shadow-hero)",
          transform: isHovered && isClickable ? "translateY(-4px)" : "translateY(0)",
        };
      case "interactive":
        return {
          background: "var(--portal-gradient-card), var(--portal-bg-card)",
          border: `1px solid ${isHovered ? "var(--portal-border)" : "var(--portal-border-subtle)"}`,
          borderRadius: "var(--portal-radius-xl)",
          boxShadow: isHovered ? "var(--portal-shadow-lg)" : "var(--portal-shadow-card)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        };
      case "flat":
        return {
          background: "var(--portal-bg-elevated)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          boxShadow: "none",
        };
      case "elevated":
      default:
        return {
          background: "var(--portal-gradient-card), var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-xl)",
          boxShadow: "var(--portal-shadow-card)",
        };
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...getVariantStyles(),
        padding: paddingMap[padding],
        cursor: isClickable ? "pointer" : "default",
        transition: "transform var(--portal-transition), box-shadow var(--portal-transition), border-color var(--portal-transition)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Card Header
 * ──────────────────────────────────────────────────────────────────────────── */

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--portal-space-3)",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-base)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginTop: "2px",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Card Row - For list items within cards
 * ──────────────────────────────────────────────────────────────────────────── */

interface CardRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  isLast?: boolean;
}

export function CardRow({ children, onClick, isLast = false }: CardRowProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "var(--portal-space-3)",
        borderBottom: isLast ? "none" : "1px solid var(--portal-border-subtle)",
        cursor: onClick ? "pointer" : "default",
        background: isHovered && onClick ? "var(--portal-bg-elevated)" : "transparent",
        transition: "background-color var(--portal-transition)",
        marginLeft: "calc(var(--portal-space-4) * -1)",
        marginRight: "calc(var(--portal-space-4) * -1)",
        paddingLeft: "var(--portal-space-4)",
        paddingRight: "var(--portal-space-4)",
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * List Card - Pre-styled card for list content
 * ──────────────────────────────────────────────────────────────────────────── */

interface ListCardProps {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export function ListCard({ children, emptyState, isEmpty }: ListCardProps) {
  if (isEmpty && emptyState) {
    return (
      <PortalCard variant="flat" padding="lg">
        {emptyState}
      </PortalCard>
    );
  }

  return (
    <PortalCard variant="elevated" padding="none">
      <div style={{ padding: "var(--portal-space-1) 0" }}>{children}</div>
    </PortalCard>
  );
}

export default PortalCard;

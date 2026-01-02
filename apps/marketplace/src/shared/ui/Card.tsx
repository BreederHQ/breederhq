// apps/marketplace/src/shared/ui/Card.tsx
import * as React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card surface component with consistent styling.
 * Uses bhq-card class from design system.
 */
export function Card({ children, className = "" }: Props) {
  return (
    <div className={`bhq-card p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

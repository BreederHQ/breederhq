// apps/marketplace/src/shared/ui/PageHeader.tsx
import * as React from "react";

interface Props {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

/**
 * Page header with title, optional subtitle, and optional right slot.
 * Title is visually dominant, subtitle clearly subordinate.
 */
export function PageHeader({ title, subtitle, rightSlot }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );
}

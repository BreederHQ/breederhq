// apps/marketplace/src/components/LoadingState.tsx
import * as React from "react";
import { Spinner } from "@bhq/ui";

export function LoadingState() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <Spinner size={24} className="text-[hsl(var(--brand-orange))]" />
    </div>
  );
}

// apps/marketplace/src/marketplace/pages/ProgramsPage.tsx
// Legacy route - redirects or shows litters view
import * as React from "react";
import { ProgramsListView } from "../components/ProgramsListView";

/**
 * Programs page - kept for backward compatibility with existing deep links.
 * Uses litters framing as the default.
 */
export function ProgramsPage() {
  return (
    <ProgramsListView
      title="Litters"
      subtitle="Browse litters from verified breeders, view details, and send an inquiry."
    />
  );
}

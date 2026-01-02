// apps/marketplace/src/marketplace/pages/LittersIndexPage.tsx
// Litters entry point with litter-centric framing
import * as React from "react";
import { ProgramsListView } from "../components/ProgramsListView";

/**
 * Litters index page - browse litters from breeders.
 */
export function LittersIndexPage() {
  return (
    <ProgramsListView
      title="Litters"
      subtitle="Browse litters from verified breeders, view details, and send an inquiry."
    />
  );
}

// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders entry point with breeder-centric framing
import * as React from "react";
import { ProgramsListView } from "../components/ProgramsListView";

/**
 * Breeders index page - explore breeders and their listings.
 */
export function BreedersIndexPage() {
  return (
    <ProgramsListView
      title="Breeders"
      subtitle="Explore breeders, then view published litters."
    />
  );
}

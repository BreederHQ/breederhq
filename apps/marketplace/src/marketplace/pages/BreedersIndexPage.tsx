// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders entry point with breeder-centric framing
import * as React from "react";
import { ProgramsListView } from "../components/ProgramsListView";
import { Seo } from "../../seo";

/**
 * Breeders index page - explore breeders and their listings.
 */
export function BreedersIndexPage() {
  return (
    <>
      <Seo title="Breeders" />
      <ProgramsListView
        title="Breeders"
        subtitle="Explore breeders, then view published litters."
      />
    </>
  );
}

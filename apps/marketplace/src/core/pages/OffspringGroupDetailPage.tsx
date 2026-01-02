// apps/marketplace/src/core/pages/OffspringGroupDetailPage.tsx
import * as React from "react";
import { useParams } from "react-router-dom";

/**
 * Placeholder Offspring Group Detail page.
 * Shows a single listing within a program.
 */
export function OffspringGroupDetailPage() {
  const { programSlug, listingSlug } = useParams<{
    programSlug: string;
    listingSlug: string;
  }>();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-2">Listing</h1>
      <p className="text-secondary">
        Program: <code className="text-primary">{programSlug}</code>
      </p>
      <p className="text-secondary">
        Listing: <code className="text-primary">{listingSlug}</code>
      </p>
    </div>
  );
}

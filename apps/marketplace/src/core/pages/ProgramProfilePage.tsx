// apps/marketplace/src/core/pages/ProgramProfilePage.tsx
import * as React from "react";
import { useParams } from "react-router-dom";

/**
 * Placeholder Program Profile page.
 * Shows a single breeder program.
 */
export function ProgramProfilePage() {
  const { programSlug } = useParams<{ programSlug: string }>();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-2">Program</h1>
      <p className="text-secondary">
        Viewing program: <code className="text-primary">{programSlug}</code>
      </p>
    </div>
  );
}

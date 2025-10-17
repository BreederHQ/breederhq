import * as React from "react";
import { components } from "@bhq/ui";

export default function AppOffspring() {
  return (
    <div className="p-4 space-y-3">
      <components.PageHeader title="Offspring" />
      <components.Card>
        <components.EmptyState
          title="Offspring module"
          description="This area is coming soon. Nothing to configure yet."
        />
      </components.Card>
    </div>
  );
}

// Optional (same idea as above)
export const routes = [
  { path: "/", label: "Overview", element: <AppOffspring /> },
];

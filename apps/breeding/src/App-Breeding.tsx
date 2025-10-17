import * as React from "react";
import { components } from "@bhq/ui";

export default function AppBreeding() {
  return (
    <div className="p-4 space-y-3">
      <components.PageHeader title="Breeding" />
      <components.Card>
        <components.EmptyState
          title="Breeding module"
          description="This area is coming soon. Nothing to configure yet."
        />
      </components.Card>
    </div>
  );
}

// Optional: if your app shell expects routes, keep a tiny one-route export.
export const routes = [
  { path: "/", label: "Overview", element: <AppBreeding /> },
];

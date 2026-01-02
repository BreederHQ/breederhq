// apps/portal/src/pages/PortalTasksPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalTasksPageNew() {
  return (
    <PageContainer>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        Tasks
      </h1>
      <EmptyStatePanel title="No tasks" description="Tasks will appear here." />
    </PageContainer>
  );
}

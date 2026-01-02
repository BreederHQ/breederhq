// apps/portal/src/pages/PortalOffspringPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalOffspringPageNew() {
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
        Offspring
      </h1>
      <EmptyStatePanel title="No offspring" description="Offspring records will appear here." />
    </PageContainer>
  );
}

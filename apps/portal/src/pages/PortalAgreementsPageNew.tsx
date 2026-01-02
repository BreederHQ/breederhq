// apps/portal/src/pages/PortalAgreementsPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalAgreementsPageNew() {
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
        Agreements
      </h1>
      <EmptyStatePanel title="No agreements" description="Agreements will appear here." />
    </PageContainer>
  );
}

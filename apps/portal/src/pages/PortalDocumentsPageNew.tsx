// apps/portal/src/pages/PortalDocumentsPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalDocumentsPageNew() {
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
        Documents
      </h1>
      <EmptyStatePanel title="No documents" description="Documents will appear here." />
    </PageContainer>
  );
}

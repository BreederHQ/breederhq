// apps/portal/src/pages/PortalMessagesPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalMessagesPage() {
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
        Messages
      </h1>
      <EmptyStatePanel title="No messages" description="Messages will appear here." />
    </PageContainer>
  );
}

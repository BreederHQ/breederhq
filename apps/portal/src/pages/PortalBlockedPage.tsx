// apps/portal/src/pages/PortalBlockedPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

export default function PortalBlockedPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)" }}>
      <PageContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
          }}
        >
          <EmptyStatePanel
            title="Access not available"
            description="This portal is for clients only. If you believe this is a mistake, contact the organization."
          />
        </div>
      </PageContainer>
    </div>
  );
}

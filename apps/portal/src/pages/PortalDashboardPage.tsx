// apps/portal/src/pages/PortalDashboardPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";

export default function PortalDashboardPage() {
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
        Dashboard
      </h1>
      <SectionCard title="Welcome">
        <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
          Dashboard content will appear here.
        </p>
      </SectionCard>
    </PageContainer>
  );
}

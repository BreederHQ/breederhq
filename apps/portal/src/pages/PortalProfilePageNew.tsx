// apps/portal/src/pages/PortalProfilePageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";

export default function PortalProfilePageNew() {
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
        Profile
      </h1>
      <SectionCard title="Account Settings">
        <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
          Profile settings will appear here.
        </p>
      </SectionCard>
    </PageContainer>
  );
}

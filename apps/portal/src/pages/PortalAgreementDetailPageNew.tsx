// apps/portal/src/pages/PortalAgreementDetailPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";

export default function PortalAgreementDetailPageNew() {
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
        Agreement Detail
      </h1>
      <SectionCard>
        <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
          Agreement details will appear here.
        </p>
      </SectionCard>
    </PageContainer>
  );
}

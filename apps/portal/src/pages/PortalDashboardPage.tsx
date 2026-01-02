// apps/portal/src/pages/PortalDashboardPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";

export default function PortalDashboardPage() {
  return (
    <PageContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "60vh",
          gap: "var(--portal-space-2)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          You're all set
        </h1>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          New messages, tasks, and updates will appear here.
        </p>
      </div>
    </PageContainer>
  );
}

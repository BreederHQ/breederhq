// apps/portal/src/pages/PortalDebugPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { getBuildStamp } from "../dev/buildStamp";
import {
  mockThreads,
  mockAgreements,
  mockDocuments,
  mockOffspring,
} from "../dev/mockData";

export default function PortalDebugPage() {
  const mockEnabled = isPortalMockEnabled();

  // Get query params
  const params = new URLSearchParams(window.location.search);
  const mockQueryValue = params.get("mock");

  // Get localStorage value
  let localStorageValue = "N/A";
  try {
    localStorageValue = localStorage.getItem("portal_mock") || "null";
  } catch {
    localStorageValue = "Error accessing localStorage";
  }

  // Get mock counts
  const mockCounts = {
    threads: mockThreads().length,
    agreements: mockAgreements().length,
    documents: mockDocuments().length,
    offspring: mockOffspring().length,
  };

  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        <h1
          style={{
            fontSize: "var(--portal-font-size-2xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Debug
        </h1>

        {/* Build Info */}
        <div
          style={{
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            padding: "var(--portal-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Build Info
          </h2>
          <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)", fontFamily: "monospace" }}>
            {getBuildStamp()}
          </div>
        </div>

        {/* Location Info */}
        <div
          style={{
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            padding: "var(--portal-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Location
          </h2>
          <dl style={{ margin: 0 }}>
            <DebugRow label="location.href" value={window.location.href} />
            <DebugRow label="location.search" value={window.location.search || "(empty)"} />
          </dl>
        </div>

        {/* Mock Mode Info */}
        <div
          style={{
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            padding: "var(--portal-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Mock Mode
          </h2>
          <dl style={{ margin: 0 }}>
            <DebugRow label="Query param 'mock'" value={mockQueryValue || "null"} />
            <DebugRow label="localStorage.portal_mock" value={localStorageValue} />
            <DebugRow
              label="isPortalMockEnabled()"
              value={mockEnabled ? "true" : "false"}
              highlight={mockEnabled}
            />
          </dl>
        </div>

        {/* Mock Data Counts */}
        <div
          style={{
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            padding: "var(--portal-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Mock Data Counts
          </h2>
          <dl style={{ margin: 0 }}>
            <DebugRow label="mockThreads()" value={String(mockCounts.threads)} />
            <DebugRow label="mockAgreements()" value={String(mockCounts.agreements)} />
            <DebugRow label="mockDocuments()" value={String(mockCounts.documents)} />
            <DebugRow label="mockOffspring()" value={String(mockCounts.offspring)} />
          </dl>
        </div>
      </div>
    </PageContainer>
  );
}

interface DebugRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DebugRow({ label, value, highlight }: DebugRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: "var(--portal-space-3)",
        padding: "var(--portal-space-2) 0",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <dt
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
          fontFamily: "monospace",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: highlight ? "var(--portal-accent)" : "var(--portal-text-primary)",
          fontFamily: "monospace",
          fontWeight: highlight ? "var(--portal-font-weight-semibold)" : "normal",
          margin: 0,
          wordBreak: "break-all",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

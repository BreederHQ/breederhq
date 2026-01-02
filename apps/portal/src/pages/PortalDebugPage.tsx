// apps/portal/src/pages/PortalDebugPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { getBuildStamp } from "../dev/BuildStamp.utils";
import {
  mockThreads,
  mockAgreements,
  mockDocuments,
  mockOffspring,
  mockTasks,
  mockNotifications,
} from "../dev/mockData";

export default function PortalDebugPage() {
  const mockEnabled = isPortalMockEnabled();
  const [showCopied, setShowCopied] = React.useState(false);
  const [showUrlsCopied, setShowUrlsCopied] = React.useState(false);

  // Get query params
  const params = new URLSearchParams(window.location.search);
  const mockQueryValue = params.get("mock");

  // Get localStorage value
  let localStorageValue = "null";
  try {
    localStorageValue = localStorage.getItem("portal_mock") || "null";
  } catch {
    localStorageValue = "Error accessing localStorage";
  }

  // Get mock counts
  const mockCounts = {
    threads: mockThreads().length,
    tasks: mockTasks().length,
    notifications: mockNotifications().length,
    agreements: mockAgreements().length,
    documents: mockDocuments().length,
    offspring: mockOffspring().length,
  };

  const handleEnableDemoMode = () => {
    try {
      localStorage.setItem("portal_mock", "1");
    } catch {
      // Ignore localStorage errors
    }
    window.location.reload();
  };

  const handleDisableDemoMode = () => {
    try {
      localStorage.removeItem("portal_mock");
    } catch {
      // Ignore localStorage errors
    }
    // Remove mock=1 from URL if present
    const url = new URL(window.location.href);
    url.searchParams.delete("mock");
    window.location.href = url.toString();
  };

  const handleCopyDebugInfo = async () => {
    const debugText = `Build: ${getBuildStamp()}
Location: ${window.location.href}
Search: ${window.location.search || "(empty)"}
Query param 'mock': ${mockQueryValue || "null"}
localStorage.portal_mock: ${localStorageValue}
isPortalMockEnabled(): ${mockEnabled}
Demo mode active: ${mockEnabled ? "YES" : "NO"}
${mockEnabled ? `Mock counts:
  mockThreads(): ${mockCounts.threads}
  mockTasks(): ${mockCounts.tasks}
  mockNotifications(): ${mockCounts.notifications}
  mockAgreements(): ${mockCounts.agreements}
  mockDocuments(): ${mockCounts.documents}
  mockOffspring(): ${mockCounts.offspring}` : ""}`;

    try {
      await navigator.clipboard.writeText(debugText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy debug info:", err);
    }
  };

  const handleCopyDemoUrls = async () => {
    const baseUrl = window.location.origin;
    const demoUrls = [
      `${baseUrl}/`,
      `${baseUrl}/messages`,
      `${baseUrl}/messages?threadId=1`,
      `${baseUrl}/tasks`,
      `${baseUrl}/notifications`,
      `${baseUrl}/agreements`,
      `${baseUrl}/agreements/1`,
      `${baseUrl}/documents`,
      `${baseUrl}/offspring`,
      `${baseUrl}/offspring/101`,
      `${baseUrl}/profile`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(demoUrls);
      setShowUrlsCopied(true);
      setTimeout(() => setShowUrlsCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy demo URLs:", err);
    }
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

        {/* Demo Mode Controls */}
        <div
          style={{
            display: "flex",
            gap: "var(--portal-space-2)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleEnableDemoMode}
            disabled={mockEnabled}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: mockEnabled ? "var(--portal-text-tertiary)" : "var(--portal-text-primary)",
              background: mockEnabled ? "var(--portal-bg-elevated)" : "var(--portal-accent)",
              border: "1px solid var(--portal-border)",
              borderRadius: "var(--portal-radius-md)",
              cursor: mockEnabled ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            Enable demo mode
          </button>
          <button
            onClick={handleDisableDemoMode}
            disabled={!mockEnabled}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: !mockEnabled ? "var(--portal-text-tertiary)" : "var(--portal-text-primary)",
              background: "transparent",
              border: "1px solid var(--portal-border)",
              borderRadius: "var(--portal-radius-md)",
              cursor: !mockEnabled ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (mockEnabled) {
                e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Disable demo mode
          </button>
          <button
            onClick={handleCopyDebugInfo}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-primary)",
              background: "transparent",
              border: "1px solid var(--portal-border)",
              borderRadius: "var(--portal-radius-md)",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Copy debug info
            {showCopied && (
              <span style={{ color: "var(--portal-accent)", fontSize: "var(--portal-font-size-xs)" }}>
                ✓
              </span>
            )}
          </button>
          {mockEnabled && (
            <button
              onClick={handleCopyDemoUrls}
              style={{
                padding: "var(--portal-space-2) var(--portal-space-3)",
                fontSize: "var(--portal-font-size-sm)",
                fontWeight: "var(--portal-font-weight-medium)",
                color: "var(--portal-text-primary)",
                background: "transparent",
                border: "1px solid var(--portal-border)",
                borderRadius: "var(--portal-radius-md)",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "var(--portal-space-1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Copy demo URLs
              {showUrlsCopied && (
                <span style={{ color: "var(--portal-accent)", fontSize: "var(--portal-font-size-xs)" }}>
                  ✓
                </span>
              )}
            </button>
          )}
        </div>

        {/* Demo Mode Status - Explicit YES/NO */}
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
              margin: 0,
            }}
          >
            Demo Mode Status
          </h2>
          <div
            style={{
              fontSize: "var(--portal-font-size-lg)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: mockEnabled ? "var(--portal-accent)" : "var(--portal-text-primary)",
              marginTop: "var(--portal-space-2)",
            }}
          >
            Demo mode active: {mockEnabled ? "YES" : "NO"}
          </div>
        </div>

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
              margin: 0,
            }}
          >
            Build Info
          </h2>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-primary)",
              fontFamily: "monospace",
              marginTop: "var(--portal-space-2)",
            }}
          >
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
              margin: 0,
            }}
          >
            Location
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--portal-space-2)" }}>
            <tbody>
              <DebugRow label="location.href" value={window.location.href} />
              <DebugRow label="location.search" value={window.location.search || "(empty)"} />
            </tbody>
          </table>
        </div>

        {/* Mock Mode Evaluation */}
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
              margin: 0,
            }}
          >
            Mock Mode Evaluation
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--portal-space-2)" }}>
            <tbody>
              <DebugRow label="Query param 'mock'" value={mockQueryValue || "null"} />
              <DebugRow label="localStorage.portal_mock" value={localStorageValue} />
              <DebugRow
                label="isPortalMockEnabled()"
                value={mockEnabled ? "true" : "false"}
                highlight={mockEnabled}
              />
            </tbody>
          </table>
        </div>

        {/* Mock Data Counts - Only show if mock is enabled */}
        {mockEnabled && (
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
                margin: 0,
              }}
            >
              Mock Data Counts
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--portal-space-2)" }}>
              <tbody>
                <DebugRow label="mockThreads()" value={String(mockCounts.threads)} />
                <DebugRow label="mockTasks()" value={String(mockCounts.tasks)} />
                <DebugRow label="mockNotifications()" value={String(mockCounts.notifications)} />
                <DebugRow label="mockAgreements()" value={String(mockCounts.agreements)} />
                <DebugRow label="mockDocuments()" value={String(mockCounts.documents)} />
                <DebugRow label="mockOffspring()" value={String(mockCounts.offspring)} />
              </tbody>
            </table>
          </div>
        )}
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
    <tr
      style={{
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <td
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
          fontFamily: "monospace",
          padding: "var(--portal-space-2) var(--portal-space-2) var(--portal-space-2) 0",
          verticalAlign: "top",
          width: "220px",
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: highlight ? "var(--portal-accent)" : "var(--portal-text-primary)",
          fontFamily: "monospace",
          fontWeight: highlight ? "var(--portal-font-weight-semibold)" : "normal",
          padding: "var(--portal-space-2) 0",
          wordBreak: "break-all",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

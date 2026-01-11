// apps/portal/src/pages/PortalDebugPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { getBuildStamp } from "../dev/BuildStamp.utils";

export default function PortalDebugPage() {
  const [showCopied, setShowCopied] = React.useState(false);

  const handleCopyDebugInfo = async () => {
    const debugText = `Build: ${getBuildStamp()}
Location: ${window.location.href}
Search: ${window.location.search || "(empty)"}
User Agent: ${navigator.userAgent}`;

    try {
      await navigator.clipboard.writeText(debugText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy debug info:", err);
    }
  };

  return (
    <PageContainer>
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

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "var(--portal-space-2)",
            flexWrap: "wrap",
          }}
        >
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
              <DebugRow label="location.pathname" value={window.location.pathname} />
            </tbody>
          </table>
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

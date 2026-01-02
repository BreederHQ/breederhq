// apps/portal/src/dev/BuildStamp.tsx
import * as React from "react";
import { getBuildStamp } from "./buildStamp";

export function BuildStamp() {
  const [showCopied, setShowCopied] = React.useState(false);
  const buildStamp = getBuildStamp();

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(buildStamp);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy build stamp:", err);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "16px",
        left: "var(--portal-space-2)",
        fontSize: "12px",
        color: "var(--portal-text-primary)",
        fontFamily: "monospace",
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "8px",
        padding: "6px 8px",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        userSelect: "none",
        zIndex: 9999,
        transition: "background-color 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.55)";
      }}
    >
      <span>{buildStamp}</span>
      {showCopied && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--portal-accent)",
            fontWeight: "var(--portal-font-weight-medium)",
          }}
        >
          Copied
        </span>
      )}
    </div>
  );
}

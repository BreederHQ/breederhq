// apps/portal/src/dev/BuildStamp.tsx
import * as React from "react";
import { getBuildStamp } from "./BuildStamp.utils";

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
        fontSize: "13px",
        color: "rgba(255, 255, 255, 0.95)",
        fontFamily: "monospace",
        background: "rgba(0, 0, 0, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "8px 12px",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        userSelect: "none",
        zIndex: 9999,
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span>{buildStamp}</span>
      {showCopied && (
        <span
          style={{
            fontSize: "11px",
            color: "rgb(129, 179, 96)",
            fontWeight: "var(--portal-font-weight-semibold)",
          }}
        >
          Copied!
        </span>
      )}
    </div>
  );
}

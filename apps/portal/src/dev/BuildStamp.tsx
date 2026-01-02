// apps/portal/src/dev/BuildStamp.tsx
import * as React from "react";
import { getBuildStamp } from "./buildStamp";

export function BuildStamp() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--portal-space-2)",
        left: "var(--portal-space-2)",
        fontSize: "10px",
        color: "var(--portal-text-tertiary)",
        opacity: 0.5,
        fontFamily: "monospace",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {getBuildStamp()}
    </div>
  );
}

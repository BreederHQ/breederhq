// apps/platform/src/components/dashboard/OffspringCountTile.tsx
// Primary tile for offspring groups overview

import * as React from "react";

function OffspringIcon({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="offspringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <path
        d="M44 14a10 10 0 0 0-10 8 10 10 0 0 0-14-4 10 10 0 0 0-4 14l16 24 16-24a10 10 0 0 0-4-18z"
        stroke="url(#offspringGrad)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface OffspringCountTileProps {
  groupCount: number;
  href?: string;
}

export default function OffspringCountTile({
  groupCount,
  href = "/offspring",
}: OffspringCountTileProps) {
  return (
    <a
      href={href}
      className="bhq-tile"
      style={{
        display: "block",
        position: "relative",
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(60, 60, 60, 0.5)",
        borderRadius: "20px",
        height: "200px",
        overflow: "hidden",
        textDecoration: "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Badge */}
      {groupCount > 0 && (
        <div style={{ position: "absolute", top: "16px", left: "16px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#22c55e",
              color: "#fff",
            }}
          >
            Active
          </span>
        </div>
      )}

      {/* Large Icon */}
      <div
        className="bhq-tile-icon"
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          transition: "transform 0.3s ease",
        }}
      >
        <OffspringIcon />
      </div>

      {/* Content */}
      <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px" }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>
          Offspring in Care
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
          Groups currently being raised
        </p>
        <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: "#ff6b35" }}>{groupCount}</span>
          <span style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>groups</span>
        </div>
      </div>
    </a>
  );
}

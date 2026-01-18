// apps/platform/src/components/dashboard/FinancesTile.tsx
// Primary tile for financial overview

import * as React from "react";

function FinanceIcon({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{
        fontSize: "3.5rem",
        fontWeight: 700,
        background: "linear-gradient(135deg, #ff6b35 0%, #c45a10 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        $
      </span>
    </div>
  );
}

export interface FinancesTileProps {
  outstandingCents: number;
  href?: string;
}

export default function FinancesTile({
  outstandingCents,
  href = "/finance",
}: FinancesTileProps) {
  const hasOutstanding = outstandingCents > 0;
  const formattedAmount = `$${Math.round(outstandingCents / 100).toLocaleString()}`;

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
      {hasOutstanding && (
        <div style={{ position: "absolute", top: "16px", left: "16px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#3b82f6",
              color: "#fff",
            }}
          >
            Action
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
        <FinanceIcon />
      </div>

      {/* Content */}
      <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px" }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>
          Finances
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
          Outstanding balances and collections
        </p>
        <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: "#ff6b35" }}>{formattedAmount}</span>
          <span style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>outstanding</span>
        </div>
      </div>
    </a>
  );
}

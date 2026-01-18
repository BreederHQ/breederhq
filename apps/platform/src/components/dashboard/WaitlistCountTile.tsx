// apps/platform/src/components/dashboard/WaitlistCountTile.tsx
// Primary tile for waitlist overview with pending/approved breakdown

import * as React from "react";

export interface WaitlistCountTileProps {
  pendingCount: number;
  approvedCount: number;
  href?: string;
  pendingHref?: string;
}

export default function WaitlistCountTile({
  pendingCount,
  approvedCount,
  href = "/waitlist",
  pendingHref = "/waitlist/pending",
}: WaitlistCountTileProps) {
  const hasPending = pendingCount > 0;

  return (
    <a
      href={hasPending ? pendingHref : href}
      className="bhq-tile"
      style={{
        display: "block",
        position: "relative",
        backgroundColor: "#1a1a1a",
        border: hasPending ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid rgba(60, 60, 60, 0.5)",
        borderRadius: "20px",
        height: "200px",
        overflow: "hidden",
        textDecoration: "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Urgent Badge if pending */}
      {hasPending && (
        <div style={{ position: "absolute", top: "16px", right: "16px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#f59e0b",
              color: "#fff",
              animation: "pulse 2s infinite",
            }}
          >
            Action Needed
          </span>
        </div>
      )}

      {/* Content - two column layout */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "24px",
        right: "24px",
        top: hasPending ? "56px" : "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>
          Waitlist
        </h3>

        {/* Two-stat layout */}
        <div style={{
          marginTop: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}>
          {/* Pending - Action Required */}
          <div style={{
            padding: "12px",
            backgroundColor: hasPending ? "rgba(245, 158, 11, 0.15)" : "rgba(60, 60, 60, 0.3)",
            borderRadius: "12px",
            border: hasPending ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
          }}>
            <div style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: hasPending ? "#f59e0b" : "rgba(255, 255, 255, 0.3)",
              lineHeight: 1,
            }}>
              {pendingCount}
            </div>
            <div style={{
              fontSize: "0.7rem",
              color: hasPending ? "#f59e0b" : "rgba(255, 255, 255, 0.4)",
              marginTop: "4px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}>
              Pending
            </div>
            <div style={{
              fontSize: "0.65rem",
              color: "rgba(255, 255, 255, 0.4)",
              marginTop: "2px",
            }}>
              Needs review
            </div>
          </div>

          {/* Approved - FYI */}
          <div style={{
            padding: "12px",
            backgroundColor: "rgba(60, 60, 60, 0.3)",
            borderRadius: "12px",
          }}>
            <div style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: approvedCount > 0 ? "#22c55e" : "rgba(255, 255, 255, 0.3)",
              lineHeight: 1,
            }}>
              {approvedCount}
            </div>
            <div style={{
              fontSize: "0.7rem",
              color: approvedCount > 0 ? "#22c55e" : "rgba(255, 255, 255, 0.4)",
              marginTop: "4px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}>
              Approved
            </div>
            <div style={{
              fontSize: "0.65rem",
              color: "rgba(255, 255, 255, 0.4)",
              marginTop: "2px",
            }}>
              Waiting for availability
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

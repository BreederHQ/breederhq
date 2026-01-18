// apps/platform/src/components/dashboard/GreetingBanner.tsx
// Hero greeting banner with user name and task summary

import * as React from "react";
import logoUrl from "@bhq/ui/assets/logo.png";

function timeGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

export interface GreetingBannerProps {
  name: string;
  pendingTasks: number;
  completedTasks: number;
}

export default function GreetingBanner({
  name,
  pendingTasks,
  completedTasks,
}: GreetingBannerProps) {
  const greeting = timeGreeting();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="bhq-hero-glow"
      style={{
        background: "linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, #1a1a1a 40%, #1a1a1a 100%)",
        border: "1px solid rgba(255, 107, 53, 0.4)",
        borderRadius: "24px",
        padding: "2.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient orb - behind everything */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.3) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Logo - on top of glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "2rem",
          transform: "translateY(-50%)",
          zIndex: 10,
          filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
        }}
      >
        <img
          src={logoUrl}
          alt="BreederHQ"
          style={{
            width: "180px",
            height: "180px",
            objectFit: "contain",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Date line */}
        <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.5rem" }}>
          {dateStr}
        </div>

        {/* Main greeting */}
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          <span style={{ color: "#fff" }}>{greeting}, </span>
          <span className="bhq-shimmer-text">{name}</span>
          <span className="bhq-wave" style={{ marginLeft: "0.5rem" }}>👋</span>
        </h1>

        {/* Subtext */}
        <p style={{ margin: "1rem 0 0 0", fontSize: "1.125rem", color: "rgba(255, 255, 255, 0.7)" }}>
          {pendingTasks > 0 ? (
            <>
              You have <span style={{ color: "#ff6b35", fontWeight: 600 }}>{pendingTasks}</span> thing{pendingTasks !== 1 ? "s" : ""} to tackle today
              {completedTasks > 0 && (
                <span style={{ color: "rgba(255, 255, 255, 0.5)" }}> · {completedTasks} already done</span>
              )}
            </>
          ) : (
            <>Your schedule is clear - It's a perfect day to plan ahead!</>
          )}
        </p>
      </div>
    </div>
  );
}

// apps/portal/src/design/Skeleton.tsx
import * as React from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = "100%", height = "1rem", className = "" }: SkeletonProps) {
  return (
    <div
      className={`portal-skeleton ${className}`}
      style={{
        width,
        height,
        background: "var(--portal-bg-elevated)",
        borderRadius: "var(--portal-radius-sm)",
        animation: "portal-skeleton-pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// Add keyframes to tokens.css via inline style injection
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes portal-skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

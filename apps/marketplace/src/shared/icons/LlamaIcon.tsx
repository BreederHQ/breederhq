// apps/marketplace/src/shared/icons/LlamaIcon.tsx
// Custom llama/alpaca silhouette icon for livestock

import * as React from "react";

interface LlamaIconProps {
  className?: string;
  strokeWidth?: number;
}

export function LlamaIcon({ className, strokeWidth = 1.5 }: LlamaIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Llama body */}
      <ellipse cx="11" cy="14" rx="5" ry="3.5" />
      {/* Long neck */}
      <path d="M 13 11 L 14.5 5" />
      {/* Head */}
      <ellipse cx="15" cy="4" rx="1.3" ry="1.8" />
      {/* Ears (distinctive upright llama ears) */}
      <path d="M 14.2 2.5 L 14 1.5" />
      <path d="M 15.8 2.5 L 16 1.5" />
      {/* Snout */}
      <ellipse cx="16" cy="4" rx="0.7" ry="0.5" />
      {/* Fluffy chest */}
      <path d="M 13 11 Q 12 10 11 10.5" />
      {/* Front legs */}
      <line x1="9" y1="17" x2="9" y2="21" />
      <line x1="11" y1="17" x2="11" y2="21" />
      {/* Back legs */}
      <line x1="13" y1="17" x2="13" y2="21" />
      <line x1="15" y1="17" x2="15" y2="21" />
      {/* Hooves */}
      <line x1="8.5" y1="21" x2="9.5" y2="21" />
      <line x1="10.5" y1="21" x2="11.5" y2="21" />
      <line x1="12.5" y1="21" x2="13.5" y2="21" />
      <line x1="14.5" y1="21" x2="15.5" y2="21" />
      {/* Short tail */}
      <path d="M 6 14 L 5 15" />
    </svg>
  );
}

export default LlamaIcon;

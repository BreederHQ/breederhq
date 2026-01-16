// apps/marketplace/src/shared/icons/ChickenIcon.tsx
// Custom chicken silhouette icon for poultry

import * as React from "react";

interface ChickenIconProps {
  className?: string;
  strokeWidth?: number;
}

export function ChickenIcon({ className, strokeWidth = 1.5 }: ChickenIconProps) {
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
      {/* Chicken body */}
      <ellipse cx="12" cy="14" rx="4" ry="3.5" />
      {/* Neck */}
      <path d="M 14 12 L 15 9" />
      {/* Head */}
      <circle cx="15.5" cy="8" r="1.5" />
      {/* Comb (top of head) */}
      <path d="M 14.5 6.5 Q 15 5.5 15.5 6.5 Q 16 5.5 16.5 6.5" />
      {/* Beak */}
      <path d="M 17 8 L 18 7.5" />
      {/* Wattle (under beak) */}
      <path d="M 15.5 9.5 Q 15.8 10.5 15.5 11" />
      {/* Wing */}
      <path d="M 12 13 Q 10 12 9 13" />
      {/* Legs */}
      <line x1="11" y1="17" x2="11" y2="19.5" />
      <line x1="13" y1="17" x2="13" y2="19.5" />
      {/* Feet (three toes) */}
      <path d="M 10 19.5 L 9.5 20.5" />
      <path d="M 11 19.5 L 11 20.5" />
      <path d="M 12 19.5 L 12.5 20.5" />
      <path d="M 12 19.5 L 11.5 20.5" />
      <path d="M 13 19.5 L 13 20.5" />
      <path d="M 14 19.5 L 14.5 20.5" />
      {/* Tail feathers */}
      <path d="M 8 14 Q 6 13 5 14" />
      <path d="M 8 13.5 Q 6 12 5 12.5" />
    </svg>
  );
}

export default ChickenIcon;

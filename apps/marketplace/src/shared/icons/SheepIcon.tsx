// apps/marketplace/src/shared/icons/SheepIcon.tsx
// Custom sheep silhouette icon for livestock

import * as React from "react";

interface SheepIconProps {
  className?: string;
  strokeWidth?: number;
}

export function SheepIcon({ className, strokeWidth = 1.5 }: SheepIconProps) {
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
      {/* Sheep body (fluffy cloud-like shape) */}
      <ellipse cx="12" cy="11" rx="6" ry="4.5" />
      {/* Head */}
      <circle cx="16.5" cy="9.5" r="2" />
      {/* Ears */}
      <path d="M 17.5 8 Q 18 7 18.5 8" />
      <path d="M 15.5 8 Q 15 7 14.5 8" />
      {/* Front legs */}
      <line x1="10" y1="15" x2="10" y2="19" />
      <line x1="12" y1="15" x2="12" y2="19" />
      {/* Back legs */}
      <line x1="14" y1="15" x2="14" y2="19" />
      <line x1="16" y1="15" x2="16" y2="19" />
      {/* Hooves */}
      <line x1="9.5" y1="19" x2="10.5" y2="19" />
      <line x1="11.5" y1="19" x2="12.5" y2="19" />
      <line x1="13.5" y1="19" x2="14.5" y2="19" />
      <line x1="15.5" y1="19" x2="16.5" y2="19" />
    </svg>
  );
}

export default SheepIcon;

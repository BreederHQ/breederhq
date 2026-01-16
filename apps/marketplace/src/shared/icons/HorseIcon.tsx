// apps/marketplace/src/shared/icons/HorseIcon.tsx
// Custom horse silhouette icon for livestock

import * as React from "react";

interface HorseIconProps {
  className?: string;
  strokeWidth?: number;
}

export function HorseIcon({ className, strokeWidth = 1.5 }: HorseIconProps) {
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
      {/* Horse body */}
      <ellipse cx="11" cy="13" rx="5" ry="3.5" />
      {/* Neck */}
      <path d="M 14 11 Q 15 8 16 6" />
      {/* Head */}
      <ellipse cx="16.5" cy="5.5" rx="1.5" ry="2" />
      {/* Ear */}
      <path d="M 16 4 L 16.5 2.5" />
      {/* Mane */}
      <path d="M 15 6 Q 14 7 13.5 8.5" />
      {/* Front legs */}
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="11" y1="16" x2="11" y2="20" />
      {/* Back legs */}
      <line x1="13" y1="16" x2="13" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
      {/* Hooves */}
      <line x1="8.5" y1="20" x2="9.5" y2="20" />
      <line x1="10.5" y1="20" x2="11.5" y2="20" />
      <line x1="12.5" y1="20" x2="13.5" y2="20" />
      <line x1="14.5" y1="20" x2="15.5" y2="20" />
      {/* Tail */}
      <path d="M 6 13 Q 4 14 4 16" />
    </svg>
  );
}

export default HorseIcon;

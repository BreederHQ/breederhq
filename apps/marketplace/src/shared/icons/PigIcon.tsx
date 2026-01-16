// apps/marketplace/src/shared/icons/PigIcon.tsx
// Custom pig silhouette icon for livestock

import * as React from "react";

interface PigIconProps {
  className?: string;
  strokeWidth?: number;
}

export function PigIcon({ className, strokeWidth = 1.5 }: PigIconProps) {
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
      {/* Pig body */}
      <ellipse cx="11" cy="14" rx="5.5" ry="4" />
      {/* Head */}
      <circle cx="16" cy="11" r="2.5" />
      {/* Snout */}
      <ellipse cx="17.5" cy="11" rx="1" ry="0.8" />
      {/* Nostrils */}
      <circle cx="17.2" cy="10.7" r="0.2" fill="currentColor" />
      <circle cx="17.2" cy="11.3" r="0.2" fill="currentColor" />
      {/* Ear */}
      <path d="M 16 8.5 Q 17 7.5 17.5 8.5" />
      {/* Front legs */}
      <line x1="9" y1="18" x2="9" y2="21" />
      <line x1="11" y1="18" x2="11" y2="21" />
      {/* Back legs */}
      <line x1="13" y1="18" x2="13" y2="21" />
      <line x1="15" y1="18" x2="15" y2="21" />
      {/* Hooves */}
      <line x1="8.5" y1="21" x2="9.5" y2="21" />
      <line x1="10.5" y1="21" x2="11.5" y2="21" />
      <line x1="12.5" y1="21" x2="13.5" y2="21" />
      <line x1="14.5" y1="21" x2="15.5" y2="21" />
      {/* Curly tail */}
      <path d="M 5.5 14 Q 4 13 4 11.5 Q 4 10 5 10.5" fill="none" />
    </svg>
  );
}

export default PigIcon;

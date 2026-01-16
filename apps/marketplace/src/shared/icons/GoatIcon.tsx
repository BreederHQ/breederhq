// apps/marketplace/src/shared/icons/GoatIcon.tsx
// Custom goat silhouette icon for livestock

import * as React from "react";

interface GoatIconProps {
  className?: string;
  strokeWidth?: number;
}

export function GoatIcon({ className, strokeWidth = 1.5 }: GoatIconProps) {
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
      {/* Goat body */}
      <ellipse cx="11" cy="13" rx="5" ry="3.5" />
      {/* Neck */}
      <path d="M 14 11 L 15.5 7" />
      {/* Head */}
      <ellipse cx="16" cy="6" rx="1.5" ry="2" />
      {/* Horns */}
      <path d="M 15 4.5 Q 14 3 13.5 2" />
      <path d="M 17 4.5 Q 18 3 18.5 2" />
      {/* Beard */}
      <path d="M 16 8 L 16 10" />
      {/* Ears */}
      <path d="M 15 5 L 14 4.5" />
      <path d="M 17 5 L 18 4.5" />
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
      <path d="M 6 13 L 5 15" />
    </svg>
  );
}

export default GoatIcon;

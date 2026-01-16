// apps/marketplace/src/shared/icons/CowIcon.tsx
// Custom cow silhouette icon for livestock

import * as React from "react";

interface CowIconProps {
  className?: string;
  strokeWidth?: number;
}

export function CowIcon({ className, strokeWidth = 1.5 }: CowIconProps) {
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
      {/* Cow body */}
      <ellipse cx="12" cy="13" rx="6" ry="4" />
      {/* Neck */}
      <path d="M 14 10 L 15 7" />
      {/* Head */}
      <rect x="14" y="5" width="3.5" height="3" rx="0.5" />
      {/* Horns */}
      <path d="M 14.5 5 Q 13.5 4 13 3" />
      <path d="M 17 5 Q 18 4 18.5 3" />
      {/* Ears */}
      <ellipse cx="14" cy="6" rx="0.5" ry="1" />
      <ellipse cx="17.5" cy="6" rx="0.5" ry="1" />
      {/* Front legs */}
      <line x1="10" y1="17" x2="10" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      {/* Back legs */}
      <line x1="14" y1="17" x2="14" y2="21" />
      <line x1="16" y1="17" x2="16" y2="21" />
      {/* Hooves */}
      <rect x="9.5" y="21" width="1" height="0.5" />
      <rect x="11.5" y="21" width="1" height="0.5" />
      <rect x="13.5" y="21" width="1" height="0.5" />
      <rect x="15.5" y="21" width="1" height="0.5" />
      {/* Tail */}
      <path d="M 6 13 Q 4.5 14 4.5 16" />
      <circle cx="4.5" cy="16.5" r="0.5" />
      {/* Udder */}
      <ellipse cx="12" cy="16.5" rx="2" ry="1" />
    </svg>
  );
}

export default CowIcon;

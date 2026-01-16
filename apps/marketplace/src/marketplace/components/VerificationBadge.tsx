// apps/marketplace/src/marketplace/components/VerificationBadge.tsx
// Verification badge component for trust indicators on breeders and services

import * as React from "react";

// ============================================================================
// Types
// ============================================================================

interface VerificationBadgeProps {
  level?: "basic" | "verified" | "premium";
  size?: "sm" | "md";
  showLabel?: boolean;
}

// ============================================================================
// Icons
// ============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export function VerificationBadge({
  level = "verified",
  size = "sm",
  showLabel = true,
}: VerificationBadgeProps) {
  const colors: Record<typeof level, string> = {
    basic: "bg-gray-500/20 text-gray-400",
    verified: "bg-green-500/20 text-green-400",
    premium: "bg-amber-500/20 text-amber-400",
  };

  const icons: Record<typeof level, React.ReactNode> = {
    basic: null,
    verified: <CheckIcon className="w-3 h-3" />,
    premium: <StarIcon className="w-3 h-3" />,
  };

  const sizeClasses =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[level]} ${sizeClasses}`}
    >
      {icons[level]}
      {showLabel && <span className="capitalize">{level}</span>}
    </span>
  );
}

export default VerificationBadge;

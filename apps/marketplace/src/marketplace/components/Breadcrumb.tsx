// apps/marketplace/src/marketplace/components/Breadcrumb.tsx
// Breadcrumb navigation component for interior pages
import * as React from "react";
import { Link } from "react-router-dom";

// ============================================================================
// Types
// ============================================================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// ============================================================================
// Icons
// ============================================================================

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Breadcrumb navigation for interior pages.
 * Last item is the current page (displayed without link).
 *
 * Usage:
 * ```tsx
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Breeders', href: '/breeders' },
 *   { label: breeder.businessName }, // current page, no href
 * ]} />
 * ```
 */
export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className={`flex items-center gap-2 text-sm text-text-tertiary mb-6 ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-white transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-white truncate" : "truncate"}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;

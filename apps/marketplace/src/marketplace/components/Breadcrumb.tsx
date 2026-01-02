// apps/marketplace/src/marketplace/components/Breadcrumb.tsx
import { Link } from "react-router-dom";

interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
}

/**
 * Compact breadcrumb navigation.
 * Last item is current page (no link).
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-white/30">/</span>}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-white/60 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-white/80" : "text-white/60"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

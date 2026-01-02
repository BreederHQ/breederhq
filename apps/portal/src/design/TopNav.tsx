// apps/portal/src/design/TopNav.tsx
import * as React from "react";

interface TopNavProps {
  items: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  onNavigate?: (href: string) => void;
}

export function TopNav({ items, onNavigate }: TopNavProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        gap: "var(--portal-space-3)",
        alignItems: "center",
        overflow: "auto",
        flex: 1,
      }}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => handleClick(e, item.href)}
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: item.active
              ? "var(--portal-font-weight-semibold)"
              : "var(--portal-font-weight-normal)",
            color: item.active
              ? "var(--portal-text-primary)"
              : "var(--portal-text-secondary)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            padding: "var(--portal-space-2) var(--portal-space-1)",
            borderBottom: item.active
              ? "1px solid var(--portal-border)"
              : "1px solid transparent",
            transition: "color var(--portal-transition), border-color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              e.currentTarget.style.color = "var(--portal-text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              e.currentTarget.style.color = "var(--portal-text-secondary)";
            }
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

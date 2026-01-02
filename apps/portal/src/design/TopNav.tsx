// apps/portal/src/design/TopNav.tsx
import * as React from "react";

interface TopNavProps {
  items: Array<{
    label: string;
    href: string;
    active?: boolean;
    badge?: number; // Subtle count badge
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

  // Hide scrollbar using a ref and style injection
  const navRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    // Inject scrollbar-hiding styles once
    const styleId = "portal-topnav-scrollbar-hide";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .portal-topnav-scroll::-webkit-scrollbar { display: none; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <nav
      ref={navRef}
      className="portal-topnav-scroll"
      style={{
        display: "flex",
        gap: "var(--portal-space-3)",
        alignItems: "center",
        overflowX: "auto",
        overflowY: "hidden",
        flex: 1,
        minWidth: 0, // Allow shrinking below content size for proper scroll
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
        position: "relative",
        zIndex: 10,
      }}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => handleClick(e, item.href)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-1)",
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
          <span>{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                background: "var(--portal-bg-elevated)",
                padding: "2px 6px",
                borderRadius: "var(--portal-radius-full)",
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {item.badge}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}

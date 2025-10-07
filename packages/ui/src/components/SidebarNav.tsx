import React from "react";

export type SidebarItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  current?: boolean;
  ariaLabel?: string;
};

export function SidebarNav({
  items,
  activeLabel,
  onNavigate,
}: {
  items: SidebarItem[];
  activeLabel?: string;
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav aria-label="Primary" className="bhq-sidebar">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = item.current || item.label === activeLabel;
          const ariaCurrent = isActive ? "page" : undefined;
          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate(item.href);
            }
          };
          return (
            <li key={item.href || item.label}>
              <a
                href={item.href}
                target="_self"
                aria-current={ariaCurrent}
                aria-label={item.ariaLabel || item.label}
                onClick={handleClick}
                className={[
                  "group flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm",
                  isActive
                    ? "bg-surface text-foreground ring-1 ring-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface",
                ].join(" ")}
              >
                {item.icon ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center">
                    {item.icon}
                  </span>
                ) : (
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      isActive ? "bhq-nav-dot" : "bg-muted",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}
                <span className={isActive ? "font-medium truncate" : "truncate"}>
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import * as React from "react";

type TabsVariant = "underline-orange" | "pills";
type TabsSize = "xs" | "sm" | "md";

export type TabItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  value: string;
  onValueChange?: (val: string) => void;
  onChange?: (val: string) => void;
  items?: TabItem[];
  className?: string;
  variant?: TabsVariant;
  size?: TabsSize;
  /** When true, draw an orange underline under the active tab (for any variant). */
  showActiveUnderline?: boolean;
  "aria-label"?: string;
};

const cx = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

function itemBase(size: TabsSize) {
  switch (size) {
    case "xs": return "px-2.5 py-1 text-xs rounded-md";
    case "sm": return "px-3 py-1.5 text-sm rounded-md";
    default:   return "px-4 py-2 text-sm rounded-md";
  }
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  onChange,
  items = [],
  className = "",
  variant = "underline-orange",
  size = "sm",
  showActiveUnderline = false,
  ...a11y
}) => {
  const notify = React.useCallback(
    (v: string) => {
      if (onValueChange) onValueChange(v);
      else if (onChange) onChange(v);
    },
    [onValueChange, onChange]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;
    const idx = Math.max(0, items.findIndex(t => t.value === value));
    if (e.key === "ArrowRight") {
      e.preventDefault();
      for (let i = 1; i <= items.length; i++) {
        const n = items[(idx + i) % items.length];
        if (!n.disabled) return notify(n.value);
      }
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      for (let i = 1; i <= items.length; i++) {
        const n = items[(idx - i + items.length) % items.length];
        if (!n.disabled) return notify(n.value);
      }
    }
  };

  return (
    <div className={cx("w-full", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className={cx(
          "flex flex-wrap gap-2",
          variant === "underline-orange" && "pb-1 border-b border-hairline"
        )}
        {...a11y}
      >
        {items.map((t) => {
          const active = t.value === value;

          const base =
            "relative inline-flex items-center justify-center select-none transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]";

          const pill = cx(
            "border",
            active
              ? "bg-[hsl(var(--surface))] text-primary border-hairline shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "bg-transparent text-secondary border-hairline hover:bg-white/5"
          );

          const underline = cx(
            "text-secondary hover:text-primary",
            active && "text-primary"
          );

          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.value}`}
              disabled={t.disabled}
              onClick={() => !t.disabled && notify(t.value)}
              className={cx(base, itemBase(size), variant === "pills" ? pill : underline)}
            >
              <span className="relative">
                {t.label}

                {/* Built-in underline for the underline-orange variant */}
                {variant === "underline-orange" && (
                  <span
                    aria-hidden
                    className={cx(
                      "absolute left-0 right-0 -bottom-[7px] h-[2px] rounded transition-[opacity,transform] duration-150",
                      active
                        ? "bg-[hsl(var(--brand-orange))] shadow-[0_0_8px_hsla(var(--brand-orange),0.45)] opacity-100 scale-x-100"
                        : "opacity-0 scale-x-75"
                    )}
                    style={{ transformOrigin: "center" }}
                  />
                )}

                {/* Optional underline for any variant (e.g., pills) */}
                {showActiveUnderline && variant !== "underline-orange" && (
                  <span
                    aria-hidden
                    className={cx(
                      "absolute left-1 right-1 -bottom-[7px] h-[2px] rounded",
                      active
                        ? "bg-[hsl(var(--brand-orange))] shadow-[0_0_8px_hsla(var(--brand-orange),0.45)]"
                        : "bg-transparent"
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

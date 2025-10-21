import * as React from "react";

type TabsVariant = "underline-orange";
type TabsSize = "sm" | "md";

export type TabItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  value: string;
  onValueChange: (val: string) => void;
  items: TabItem[];
  className?: string;
  variant?: TabsVariant;
  size?: TabsSize;
  "aria-label"?: string;
};

const cx = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

function baseItem(size: TabsSize) {
  return cx(
    "relative inline-flex items-center justify-center select-none",
    "transition-colors outline-none",
    size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
  );
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  items,
  className = "",
  variant = "underline-orange",
  size = "md",
  ...a11y
}) => {
  return (
    <div className={cx("w-full", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cx(
          "inline-flex gap-2 border-b border-gray-200 dark:border-neutral-800",
          variant === "underline-orange" && "pb-1"
        )}
        {...a11y}
      >
        {items.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.value}`}
              disabled={t.disabled}
              onClick={() => !t.disabled && onValueChange(t.value)}
              className={cx(
                baseItem(size),
                "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100",
                active && "text-gray-900 dark:text-gray-100",
                t.disabled && "opacity-50 cursor-not-allowed",
                "focus-visible:ring-2 focus-visible:ring-gray-300/70 rounded-md"
              )}
            >
              <span className="relative">
                {t.label}
                {variant === "underline-orange" && (
                  <span
                    aria-hidden
                    className={cx(
                      "absolute -bottom-[7px] left-0 right-0 h-[2px] rounded",
                      active
                        ? "bg-[var(--accent,#ee3c3e)] shadow-[0_0_8px_rgba(238,60,62,0.45)]"
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

// packages/ui/src/components/SearchBar/SearchBar.tsx
import * as React from "react";
import { cn } from "../../utils/cn";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Fixed width for the whole search control (e.g. 520 or "520px"). Defaults to 560px. */
  widthPx?: number | string;
  /** Extra classes on the outer wrapper (you can also pass a width class here if you prefer). */
  className?: string;
  /** Optional right-side adornment (e.g. your Filters button). Stays right-aligned. */
  rightSlot?: React.ReactNode;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel = "Search",
  widthPx = 560,
  className,
  rightSlot,
}: Props) {
  const widthStyle =
    typeof widthPx === "number"
      ? { width: `${widthPx}px` }
      : widthPx
      ? { width: widthPx }
      : undefined;

  return (
    <div
      className={cn("relative w-[560px] max-w-full", className)}
      style={widthStyle}
    >
      {/* magnifier */}
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          // size/layout
          "h-10 w-full rounded-xl pl-9 pr-10",
          // surface + muted border/placeholder
          "bg-surface border border-hairline text-primary placeholder:text-secondary",
          // focus ring to match the app
          "outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        )}
      />

      {/* right slot (e.g. Filters button) */}
      {rightSlot ? (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightSlot}</div>
      ) : null}
    </div>
  );
}

export default SearchBar;

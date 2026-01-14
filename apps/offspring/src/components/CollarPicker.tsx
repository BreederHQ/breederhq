// apps/offspring/src/components/CollarPicker.tsx
// Reusable whelping collar picker component that uses tenant settings

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { hooks, useSpeciesTerminology, speciesUsesCollars } from "@bhq/ui";
import type { CollarColorOption, CollarPattern } from "@bhq/api";
import { COLLAR_PATTERNS } from "@bhq/api";

const { useCollarOptions } = hooks;

/**
 * Get CSS background style for a collar pattern swatch.
 * Handles solid colors and two-color patterns (striped, polka dot, camo, plaid).
 */
function getPatternStyle(color: CollarColorOption): React.CSSProperties {
  const { hex, hex2, pattern } = color;

  if (pattern === "solid" || !hex2) {
    return { backgroundColor: hex };
  }

  switch (pattern) {
    case "striped":
      return {
        background: `repeating-linear-gradient(45deg, ${hex}, ${hex} 2px, ${hex2} 2px, ${hex2} 4px)`,
      };
    case "polka_dot":
      return {
        background: `radial-gradient(circle at 25% 25%, ${hex2} 15%, transparent 15%), radial-gradient(circle at 75% 75%, ${hex2} 15%, transparent 15%), ${hex}`,
      };
    case "plaid":
      return {
        background: `
          linear-gradient(0deg, ${hex2}40 50%, transparent 50%),
          linear-gradient(90deg, ${hex2}40 50%, transparent 50%),
          ${hex}
        `.replace(/\s+/g, " "),
      };
    case "camo":
      return {
        background: `
          radial-gradient(ellipse 60% 40% at 30% 30%, ${hex2} 0%, transparent 50%),
          radial-gradient(ellipse 50% 50% at 70% 60%, ${hex2} 0%, transparent 45%),
          radial-gradient(ellipse 40% 60% at 50% 80%, ${hex2} 0%, transparent 40%),
          ${hex}
        `.replace(/\s+/g, " "),
      };
    default:
      return { backgroundColor: hex };
  }
}

export type CollarPickerProps = {
  /** Current collar color value (id or label) */
  value: string | null | undefined;
  /** Called when collar is selected */
  onChange: (colorId: string, pattern?: CollarPattern) => void;
  /** Species code - if provided, collar picker only shows for species that use collars */
  species?: string | null;
  /** Optional placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether picker is disabled */
  disabled?: boolean;
};

/**
 * Dropdown picker for identification collar colors.
 * Fetches available colors from tenant settings automatically.
 * Returns null for species that don't use collars (horses, cattle, chickens).
 */
export function CollarPicker({
  value,
  onChange,
  species,
  placeholder = "Select collar color",
  className = "",
  disabled = false,
}: CollarPickerProps) {
  // Hide collar picker for species that don't use collars
  if (species && !speciesUsesCollars(species)) {
    return null;
  }

  const { colors, loading, resolveColor } = useCollarOptions();
  const [showPalette, setShowPalette] = React.useState(false);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Resolve current value to color object
  const currentColor = value ? resolveColor(value) : null;
  const displayLabel = currentColor?.label ?? (value || placeholder);

  // Close dropdown on outside click (use capture phase to catch events before they're stopped)
  React.useEffect(() => {
    if (!showPalette) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedContainer = containerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedContainer && !clickedDropdown) {
        setShowPalette(false);
      }
    }

    // Use capture phase and add a small delay to ensure refs are attached
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showPalette]);

  // Calculate dropdown position using fixed positioning to escape overflow containers
  const handleToggle = () => {
    if (disabled) return;
    if (!showPalette && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 220; // max-h-48 (192px) + padding
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setShowPalette((prev) => !prev);
  };

  const handleSelect = (color: CollarColorOption, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(color.label, color.pattern);
    setShowPalette(false);
  };

  const inputClass =
    "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
    "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
    "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

  if (loading) {
    return (
      <div className={`${inputClass} ${className} flex items-center text-secondary`}>
        Loading...
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        className={`${inputClass} flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleToggle}
      >
        <span className="flex items-center gap-2">
          {currentColor && (
            <span
              className="h-3 w-3 rounded-full border border-border flex-shrink-0"
              style={getPatternStyle(currentColor)}
            />
          )}
          <span className={!currentColor ? "text-secondary" : ""}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {showPalette && (
        <div
          ref={dropdownRef}
          className="z-50 rounded-md border border-border bg-surface shadow-lg"
          style={dropdownStyle}
        >
          {/* Color list */}
          <ul className="max-h-48 overflow-y-auto py-1 text-xs">
            {colors.map((color) => (
              <li key={color.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-muted"
                  onClick={(e) => handleSelect(color, e)}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-border flex-shrink-0"
                    style={getPatternStyle(color)}
                  />
                  <span className="flex-1">{color.label}</span>
                  {color.pattern !== "solid" && (
                    <span className="text-secondary text-[10px]">
                      ({COLLAR_PATTERNS.find((p) => p.value === color.pattern)?.label})
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Clear option */}
          {value && (
            <div className="border-t border-border">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-secondary hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange("", "solid");
                  setShowPalette(false);
                }}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Display a collar color swatch with optional label.
 * Resolves color from tenant settings and renders patterns visually.
 */
export function CollarSwatch({
  color,
  showLabel = false,
  size = "sm",
}: {
  color?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const { resolveColor } = useCollarOptions();

  if (!color) return null;

  const colorObj = resolveColor(color);
  const label = colorObj?.label || color;

  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  // Get pattern style if we have a full color object, otherwise fallback to solid
  const swatchStyle = colorObj
    ? getPatternStyle(colorObj)
    : { backgroundColor: color };

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`${sizeClasses} rounded-full border border-white/20 inline-block`}
        style={swatchStyle}
        title={`Collar: ${label}`}
      />
      {showLabel && <span className="text-xs">{label}</span>}
    </span>
  );
}

/**
 * Legacy fallback: resolve collar color from value without hook.
 * Use this for static rendering where hooks can't be used.
 */
export function resolveCollarHex(value: string | null | undefined): string | null {
  if (!value) return null;
  // Fallback hex mapping for when settings aren't loaded
  const FALLBACK_MAP: Record<string, string> = {
    red: "#ef4444",
    orange: "#f97316",
    yellow: "#eab308",
    green: "#22c55e",
    blue: "#3b82f6",
    purple: "#a855f7",
    pink: "#ec4899",
    black: "#111827",
    white: "#f9fafb",
    lime: "#84cc16",
    teal: "#14b8a6",
    brown: "#92400e",
    gray: "#6b7280",
  };
  const lower = value.toLowerCase().trim();
  return FALLBACK_MAP[lower] ?? null;
}

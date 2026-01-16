// apps/offspring/src/components/CollarPicker.tsx
// Reusable whelping collar picker component that uses tenant settings

import * as React from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";
import { hooks, useSpeciesTerminology, speciesUsesCollars } from "@bhq/ui";
import type { CollarColorOption, CollarPattern } from "@bhq/api";
import { COLLAR_PATTERNS } from "@bhq/api";

const { useCollarOptions } = hooks;

/**
 * Determine if a hex color is light (for contrast calculation)
 */
function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

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
        className={`${inputClass} flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group transition-all duration-150 hover:border-white/30`}
        onClick={handleToggle}
      >
        <span className="flex items-center gap-2.5">
          {currentColor ? (
            <span
              className="h-5 w-5 rounded-full border-2 border-white/30 flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
              style={{
                ...getPatternStyle(currentColor),
                boxShadow: `0 2px 6px ${currentColor.hex}40`,
              }}
            />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-dashed border-white/20 flex-shrink-0" />
          )}
          <span className={!currentColor ? "text-secondary" : "font-medium"}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${showPalette ? "rotate-180" : ""}`} />
      </button>

      {showPalette && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ ...dropdownStyle, zIndex: 2147485100, minWidth: 240 }}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-white/10 bg-white/[0.02]">
            <div className="text-xs font-medium text-white/70 uppercase tracking-wider">
              Select Color
            </div>
          </div>

          {/* Color grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => {
                const isSelected = currentColor?.id === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    className={`
                      group relative flex flex-col items-center gap-1.5 p-2 rounded-lg
                      transition-all duration-150 ease-out
                      hover:bg-white/10 hover:scale-105
                      focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:ring-offset-1 focus:ring-offset-[#1a1a1a]
                      ${isSelected ? "bg-white/10 ring-2 ring-[hsl(var(--brand-orange))]" : ""}
                    `}
                    onClick={(e) => handleSelect(color, e)}
                    title={color.pattern !== "solid"
                      ? `${color.label} (${COLLAR_PATTERNS.find((p) => p.value === color.pattern)?.label})`
                      : color.label
                    }
                  >
                    {/* Color swatch with glow effect */}
                    <div className="relative">
                      <span
                        className={`
                          block w-8 h-8 rounded-full border-2
                          transition-all duration-150
                          ${isSelected
                            ? "border-[hsl(var(--brand-orange))] shadow-lg"
                            : "border-white/20 group-hover:border-white/40"
                          }
                        `}
                        style={{
                          ...getPatternStyle(color),
                          boxShadow: isSelected
                            ? `0 0 12px 2px ${color.hex}60`
                            : `0 2px 8px ${color.hex}30`,
                        }}
                      />
                      {/* Selection checkmark */}
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className="w-4 h-4 drop-shadow-lg"
                            style={{
                              color: isLightColor(color.hex) ? "#000" : "#fff",
                              strokeWidth: 3,
                            }}
                          />
                        </span>
                      )}
                    </div>
                    {/* Color label */}
                    <span className={`
                      text-[10px] font-medium leading-tight text-center
                      transition-colors duration-150
                      ${isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"}
                    `}>
                      {color.label}
                    </span>
                    {/* Pattern indicator */}
                    {color.pattern !== "solid" && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear option */}
          {value && (
            <div className="border-t border-white/10 p-2 bg-white/[0.02]">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/10 transition-all duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange("", "solid");
                  setShowPalette(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
                Clear selection
              </button>
            </div>
          )}
        </div>,
        document.body
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

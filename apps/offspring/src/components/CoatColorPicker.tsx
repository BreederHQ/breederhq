// apps/offspring/src/components/CoatColorPicker.tsx
// Coat color picker component that uses genetics-based color swatches

import * as React from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";
import {
  getCoatColorsForSpecies,
  getCoatColorsByCategory,
  findCoatColorByName,
  type CoatColorDefinition,
  type CoatColorCategory,
} from "@bhq/api";

/**
 * Determine if a CSS gradient/color is light (for contrast calculation)
 * Extracts the first hex color from a CSS value
 */
function isLightColor(css: string): boolean {
  // Try to extract a hex color from the CSS
  const hexMatch = css.match(/#([0-9a-fA-F]{6})/);
  if (!hexMatch) return false;

  const hex = hexMatch[1];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/** Category display labels */
const CATEGORY_LABELS: Record<CoatColorCategory, string> = {
  base: "Colors",
  pattern: "Patterns",
  horse: "Horse Colors",
  cat: "Cat Patterns",
};

export type CoatColorPickerProps = {
  /** Current color value (name or id) */
  value: string | null | undefined;
  /** Called when color is selected */
  onChange: (colorName: string) => void;
  /** Species code - determines which colors are shown */
  species?: string | null;
  /** Optional placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether picker is disabled */
  disabled?: boolean;
};

/**
 * Dropdown picker for coat/fur colors.
 * Shows species-appropriate colors from the genetics color reference.
 */
export function CoatColorPicker({
  value,
  onChange,
  species = "DOG",
  placeholder = "Select color",
  className = "",
  disabled = false,
}: CoatColorPickerProps) {
  const [showPalette, setShowPalette] = React.useState(false);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get colors for this species
  const colorsByCategory = React.useMemo(
    () => getCoatColorsByCategory(species || "DOG"),
    [species]
  );

  // Find current color object
  const currentColor = value ? findCoatColorByName(value) : null;
  const displayLabel = currentColor?.name ?? (value || placeholder);

  // Close dropdown on outside click
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

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showPalette]);

  // Calculate dropdown position
  const handleToggle = () => {
    if (disabled) return;
    if (!showPalette && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 320),
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setShowPalette((prev) => !prev);
  };

  const handleSelect = (color: CoatColorDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(color.name);
    setShowPalette(false);
  };

  const inputClass =
    "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
    "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
    "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

  // Build category list - only show base colors (patterns are a separate concept)
  // For horses, also include horse-specific colors like Bay, Palomino, etc.
  const categories = (["base", "horse"] as CoatColorCategory[])
    .filter((cat) => colorsByCategory[cat].length > 0);

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
              style={{ background: currentColor.css }}
            />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-dashed border-white/20 flex-shrink-0" />
          )}
          <span className={!currentColor ? "text-secondary" : "font-medium"}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
            showPalette ? "rotate-180" : ""
          }`}
        />
      </button>

      {showPalette &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            className="rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ ...dropdownStyle, zIndex: 2147485100, minWidth: 400 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Select Coat Color
              </div>
            </div>

            {/* Color categories */}
            <div className="max-h-[400px] overflow-y-auto">
              {categories.map((category) => (
                <div key={category} className="border-b border-white/5 last:border-b-0">
                  <div className="px-4 py-2.5 bg-white/[0.02]">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
                      {CATEGORY_LABELS[category]}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {colorsByCategory[category].map((color) => {
                        const isSelected = currentColor?.id === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            className={`
                              group relative flex flex-col items-center gap-1.5 p-2 rounded-lg
                              transition-all duration-150 ease-out
                              hover:bg-white/5
                              focus:outline-none
                            `}
                            onClick={(e) => handleSelect(color, e)}
                            title={color.description}
                          >
                            {/* Color swatch */}
                            <div className="relative">
                              <span
                                className={`
                                  block w-10 h-10 rounded-full border-2 transition-all duration-150
                                  ${isSelected
                                    ? "border-white ring-2 ring-offset-2 ring-offset-[#1a1a1a] ring-white/50"
                                    : "border-white/20 group-hover:border-white/40 group-hover:scale-110"
                                  }
                                `}
                                style={{ background: color.css }}
                              />
                              {/* Selection checkmark */}
                              {isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <Check
                                    className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                    style={{
                                      color: isLightColor(color.css) ? "#000" : "#fff",
                                      strokeWidth: 3,
                                    }}
                                  />
                                </span>
                              )}
                            </div>
                            {/* Color label */}
                            <span
                              className={`
                              text-[11px] font-medium leading-tight text-center w-full
                              transition-colors duration-150
                              ${isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"}
                            `}
                            >
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
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
                    onChange("");
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
 * Display a coat color swatch with optional label.
 */
export function CoatColorSwatch({
  color,
  showLabel = false,
  size = "sm",
}: {
  color?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  if (!color) return null;

  const colorObj = findCoatColorByName(color);
  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${sizeClasses} rounded-full border border-white/20 inline-block`}
        style={{ background: colorObj?.css || "#6b7280" }}
        title={colorObj?.description || color}
      />
      {showLabel && <span className="text-sm">{colorObj?.name || color}</span>}
    </span>
  );
}

// ============================================================================
// COAT PATTERN PICKER
// ============================================================================

export type CoatPatternPickerProps = {
  /** Current pattern value (name or id) */
  value: string | null | undefined;
  /** Called when pattern is selected */
  onChange: (patternName: string) => void;
  /** Species code - determines which patterns are shown */
  species?: string | null;
  /** Optional placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether picker is disabled */
  disabled?: boolean;
};

/**
 * Dropdown picker for coat patterns.
 * Shows species-appropriate patterns (Solid, Merle, Brindle, etc.)
 */
export function CoatPatternPicker({
  value,
  onChange,
  species = "DOG",
  placeholder = "Select pattern",
  className = "",
  disabled = false,
}: CoatPatternPickerProps) {
  const [showPalette, setShowPalette] = React.useState(false);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get patterns for this species
  const colorsByCategory = React.useMemo(
    () => getCoatColorsByCategory(species || "DOG"),
    [species]
  );

  // Get patterns only (plus cat patterns for cats)
  const patterns = React.useMemo(() => {
    const speciesUpper = (species || "DOG").toUpperCase();
    const result = [...colorsByCategory.pattern];
    if (speciesUpper === "CAT") {
      result.push(...colorsByCategory.cat);
    }
    return result;
  }, [colorsByCategory, species]);

  // Find current pattern object
  const currentPattern = value ? findCoatColorByName(value) : null;
  const displayLabel = currentPattern?.name ?? (value || placeholder);

  // Close dropdown on outside click
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

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showPalette]);

  // Calculate dropdown position
  const handleToggle = () => {
    if (disabled) return;
    if (!showPalette && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 360),
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setShowPalette((prev) => !prev);
  };

  const handleSelect = (pattern: CoatColorDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(pattern.name);
    setShowPalette(false);
  };

  const inputClass =
    "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
    "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
    "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        className={`${inputClass} flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group transition-all duration-150 hover:border-white/30`}
        onClick={handleToggle}
      >
        <span className="flex items-center gap-2.5">
          {currentPattern ? (
            <span
              className="h-5 w-5 rounded-full border-2 border-white/30 flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
              style={{ background: currentPattern.css }}
            />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-dashed border-white/20 flex-shrink-0" />
          )}
          <span className={!currentPattern ? "text-secondary" : "font-medium"}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
            showPalette ? "rotate-180" : ""
          }`}
        />
      </button>

      {showPalette &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            className="rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ ...dropdownStyle, zIndex: 2147485100, minWidth: 360 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Select Pattern
              </div>
            </div>

            {/* Patterns grid */}
            <div className="p-3 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {patterns.map((pattern) => {
                  const isSelected = currentPattern?.id === pattern.id;
                  return (
                    <button
                      key={pattern.id}
                      type="button"
                      className={`
                        group relative flex flex-col items-center gap-1.5 p-2 rounded-lg
                        transition-all duration-150 ease-out
                        hover:bg-white/5
                        focus:outline-none
                      `}
                      onClick={(e) => handleSelect(pattern, e)}
                      title={pattern.description}
                    >
                      {/* Pattern swatch */}
                      <div className="relative">
                        <span
                          className={`
                            block w-10 h-10 rounded-full border-2 transition-all duration-150
                            ${isSelected
                              ? "border-white ring-2 ring-offset-2 ring-offset-[#1a1a1a] ring-white/50"
                              : "border-white/20 group-hover:border-white/40 group-hover:scale-110"
                            }
                          `}
                          style={{ background: pattern.css }}
                        />
                        {/* Selection checkmark */}
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check
                              className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                              style={{
                                color: isLightColor(pattern.css) ? "#000" : "#fff",
                                strokeWidth: 3,
                              }}
                            />
                          </span>
                        )}
                      </div>
                      {/* Pattern label */}
                      <span
                        className={`
                        text-[11px] font-medium leading-tight text-center w-full
                        transition-colors duration-150
                        ${isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"}
                      `}
                      >
                        {pattern.name}
                      </span>
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
                    onChange("");
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
 * Display a coat pattern swatch with optional label.
 */
export function CoatPatternSwatch({
  pattern,
  showLabel = false,
  size = "sm",
}: {
  pattern?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  if (!pattern) return null;

  const patternObj = findCoatColorByName(pattern);
  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${sizeClasses} rounded-full border border-white/20 inline-block`}
        style={{ background: patternObj?.css || "#6b7280" }}
        title={patternObj?.description || pattern}
      />
      {showLabel && <span className="text-sm">{patternObj?.name || pattern}</span>}
    </span>
  );
}

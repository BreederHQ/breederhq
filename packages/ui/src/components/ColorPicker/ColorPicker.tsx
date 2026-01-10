// packages/ui/src/components/ColorPicker/ColorPicker.tsx
// Simple color picker with hex input and preset swatches

import * as React from "react";

export interface ColorPickerProps {
  /** Current hex color value (e.g., "#ef4444") */
  value: string;
  /** Called when color changes */
  onChange: (hex: string) => void;
  /** Optional label */
  label?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Common whelping collar colors plus extras for custom selection
const PRESET_COLORS = [
  // Row 1: Standard whelping colors
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ec4899", // Pink
  // Row 2: Additional colors
  "#84cc16", // Lime
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#92400e", // Brown
  // Row 3: Neutrals
  "#111827", // Black
  "#374151", // Gray 700
  "#6b7280", // Gray 500
  "#9ca3af", // Gray 400
  "#d1d5db", // Gray 300
  "#f3f4f6", // Gray 100
  "#f9fafb", // White
];

/**
 * Validate and normalize a hex color string.
 * Returns null if invalid.
 */
function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Add # if missing
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  // Validate: must be #RGB or #RRGGBB
  const match = hex.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (!match) return null;

  // Expand short form #RGB to #RRGGBB
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return hex.toLowerCase();
}

export function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
  className = "",
}: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [isValid, setIsValid] = React.useState(true);

  // Sync input when external value changes
  React.useEffect(() => {
    setInputValue(value);
    setIsValid(!!normalizeHex(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    const normalized = normalizeHex(raw);
    if (normalized) {
      setIsValid(true);
      onChange(normalized);
    } else {
      setIsValid(raw.trim() === "");
    }
  };

  const handleInputBlur = () => {
    const normalized = normalizeHex(inputValue);
    if (normalized) {
      setInputValue(normalized);
      setIsValid(true);
    } else if (inputValue.trim() === "") {
      // Keep empty, but revert to previous value
      setInputValue(value);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const handlePresetClick = (hex: string) => {
    if (disabled) return;
    setInputValue(hex);
    setIsValid(true);
    onChange(hex);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toLowerCase();
    setInputValue(hex);
    setIsValid(true);
    onChange(hex);
  };

  const displayColor = normalizeHex(value) || "#ffffff";

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}

      {/* Hex input with preview swatch and native picker */}
      <div className="flex items-center gap-2">
        {/* Color preview swatch - also native picker trigger */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-lg border-2 border-hairline shadow-inner cursor-pointer"
            style={{ backgroundColor: displayColor }}
            title="Click to open color picker"
          />
          <input
            type="color"
            value={displayColor}
            onChange={handleNativePickerChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title="Choose custom color"
          />
        </div>

        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="#000000"
            maxLength={7}
            className={`
              w-full px-3 py-2 text-sm font-mono rounded-md border
              bg-surface text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-orange/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isValid ? "border-hairline" : "border-red-500"}
            `}
          />
          {!isValid && (
            <p className="mt-1 text-xs text-red-400">
              Enter a valid hex color (e.g., #ef4444)
            </p>
          )}
        </div>
      </div>

      {/* Preset color swatches */}
      <div className="grid grid-cols-7 gap-2">
        {PRESET_COLORS.map((hex) => {
          const isSelected = normalizeHex(value) === hex;
          return (
            <button
              key={hex}
              type="button"
              onClick={() => handlePresetClick(hex)}
              disabled={disabled}
              className={`
                w-8 h-8 rounded-md border-2 transition-all
                hover:scale-110 hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-brand-orange/50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${isSelected ? "border-brand-orange ring-2 ring-brand-orange/30" : "border-hairline"}
              `}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          );
        })}
      </div>
    </div>
  );
}

// packages/api/src/types/collar-settings.ts
// Types for whelping collar color and pattern settings

export type CollarPattern = "solid" | "striped" | "polka_dot" | "camo" | "plaid";

export type CollarColorOption = {
  id: string;           // Unique identifier (lowercase name for defaults, uuid for custom)
  label: string;        // Display name
  hex: string;          // Primary hex color code (e.g., "#ef4444")
  hex2?: string;        // Secondary hex color code for patterns (e.g., "#ffffff" for white stripes)
  pattern: CollarPattern;
  isDefault: boolean;   // True for standard colors, false for custom
  sortOrder: number;    // Display order in UI
  enabled: boolean;     // Whether this color is available for selection
};

export type CollarSettingsConfig = {
  colors: CollarColorOption[];
};

// Standard whelping collar colors available on Amazon
export const DEFAULT_COLLAR_COLORS: CollarColorOption[] = [
  { id: "red", label: "Red", hex: "#ef4444", pattern: "solid", isDefault: true, sortOrder: 0, enabled: true },
  { id: "orange", label: "Orange", hex: "#f97316", pattern: "solid", isDefault: true, sortOrder: 1, enabled: true },
  { id: "yellow", label: "Yellow", hex: "#eab308", pattern: "solid", isDefault: true, sortOrder: 2, enabled: true },
  { id: "green", label: "Green", hex: "#22c55e", pattern: "solid", isDefault: true, sortOrder: 3, enabled: true },
  { id: "blue", label: "Blue", hex: "#3b82f6", pattern: "solid", isDefault: true, sortOrder: 4, enabled: true },
  { id: "purple", label: "Purple", hex: "#a855f7", pattern: "solid", isDefault: true, sortOrder: 5, enabled: true },
  { id: "pink", label: "Pink", hex: "#ec4899", pattern: "solid", isDefault: true, sortOrder: 6, enabled: true },
  { id: "black", label: "Black", hex: "#111827", pattern: "solid", isDefault: true, sortOrder: 7, enabled: true },
  { id: "white", label: "White", hex: "#f9fafb", pattern: "solid", isDefault: true, sortOrder: 8, enabled: true },
  { id: "lime", label: "Lime", hex: "#84cc16", pattern: "solid", isDefault: true, sortOrder: 9, enabled: true },
  { id: "teal", label: "Teal", hex: "#14b8a6", pattern: "solid", isDefault: true, sortOrder: 10, enabled: true },
  { id: "brown", label: "Brown", hex: "#92400e", pattern: "solid", isDefault: true, sortOrder: 11, enabled: true },
  { id: "gray", label: "Gray", hex: "#6b7280", pattern: "solid", isDefault: true, sortOrder: 12, enabled: true },
];

export const COLLAR_PATTERNS: Array<{ value: CollarPattern; label: string; requiresSecondColor: boolean }> = [
  { value: "solid", label: "Solid", requiresSecondColor: false },
  { value: "striped", label: "Striped", requiresSecondColor: true },
  { value: "polka_dot", label: "Polka Dot", requiresSecondColor: true },
  { value: "camo", label: "Camo", requiresSecondColor: true },
  { value: "plaid", label: "Plaid", requiresSecondColor: true },
];

export const DEFAULT_COLLAR_SETTINGS: CollarSettingsConfig = {
  colors: DEFAULT_COLLAR_COLORS,
};

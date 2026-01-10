// packages/api/src/types/view-preferences.ts
// Types for default view preferences (card vs table) per module

/**
 * View mode options - consistent across all modules
 */
export type ViewMode = "cards" | "table";

/**
 * Modules that support card/table view toggle
 */
export type ViewPreferenceModule =
  | "contacts"
  | "animals"
  | "breeding"
  | "offspring"
  | "offspringGroups";

/**
 * Configuration for default view preferences across all modules
 * Stored at tenant level via settings namespace "view-preferences"
 */
export type ViewPreferencesConfig = {
  /** Default view for Contacts module */
  contacts: ViewMode;
  /** Default view for Animals module */
  animals: ViewMode;
  /** Default view for Breeding Plans module */
  breeding: ViewMode;
  /** Default view for Offspring page */
  offspring: ViewMode;
  /** Default view for Offspring Groups page */
  offspringGroups: ViewMode;
};

/**
 * Module metadata for UI display
 */
export type ViewPreferenceModuleInfo = {
  key: ViewPreferenceModule;
  label: string;
  description: string;
};

/**
 * Module information for rendering in settings UI
 */
export const VIEW_PREFERENCE_MODULES: ViewPreferenceModuleInfo[] = [
  {
    key: "contacts",
    label: "Contacts",
    description: "Contact records and customer information",
  },
  {
    key: "animals",
    label: "Animals",
    description: "Animal registry and profiles",
  },
  {
    key: "breeding",
    label: "Breeding Plans",
    description: "Breeding plan records and schedules",
  },
  {
    key: "offspring",
    label: "Offspring",
    description: "Individual offspring records",
  },
  {
    key: "offspringGroups",
    label: "Offspring Groups",
    description: "Litters and offspring group management",
  },
];

/**
 * Default view preferences - card view for all modules
 */
export const DEFAULT_VIEW_PREFERENCES: ViewPreferencesConfig = {
  contacts: "cards",
  animals: "cards",
  breeding: "cards",
  offspring: "cards",
  offspringGroups: "cards",
};

/**
 * Settings namespace for view preferences
 */
export const VIEW_PREFERENCES_NAMESPACE = "view-preferences";

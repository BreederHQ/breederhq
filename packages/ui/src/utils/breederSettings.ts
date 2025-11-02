// packages/ui/src/utils/breederSettings.ts
export type BreederSettings = {
  unitSystem: "imperial" | "metric";
  protocols: import("./medication").MedicationProtocol[];
  logoUrl?: string | null;
};

const KEY = "bhq_breeder_settings_v1";

export function loadSettings(): BreederSettings {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") as BreederSettings;
  } catch { /* ignore */ }
  return {
    unitSystem: "imperial",
    protocols: [],
    logoUrl: null,
  };
}
export function saveSettings(s: BreederSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

// packages/ui/src/utils/medication.ts
export type UnitSystem = "imperial" | "metric";

/** Convert helpers */
export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;

/** Dose math:
 * doseMg = weightKg * doseRateMgPerKg
 * volumeMl = doseMg / concentrationMgPerMl
 */
export function doseMlFromWeight({
  weight,
  unitSystem,
  doseRateMgPerKg,
  concentrationMgPerMl,
}: {
  weight: number;                // numeric weight value
  unitSystem: UnitSystem;        // "imperial" means pounds input, "metric" means kg input
  doseRateMgPerKg: number;       // e.g., 50 mg/kg
  concentrationMgPerMl: number;  // e.g., 100 mg/mL
}): number {
  const kg = unitSystem === "imperial" ? lbToKg(weight) : weight;
  const doseMg = kg * doseRateMgPerKg;
  return doseMg / Math.max(1e-9, concentrationMgPerMl);
}

/** Protocols the breeder defines in Settings */
export type MedicationProtocol = {
  id: string;
  label: string;               // "Panacur 4-week"
  medicationName: string;      // "Fenbendazole (Panacur)"
  doseRateMgPerKg: number;     // mg per kg
  concentrationMgPerMl: number;// mg per mL
  days: number;                // number of consecutive days to give
  ageTriggerWeeks: number;     // first trigger age
  repeatWeeks?: number | null; // optional repeat cadence (e.g., every 2 weeks)
  notes?: string;
  active?: boolean;
};

export type MedAdminRecord = {
  puppyId: number | string;
  protocolId: string;
  date: string;          // ISO date
  weight: number;        // numeric, in breeder's chosen unit for input
  unitSystem: UnitSystem;
  doseMl: number;        // computed and stored for audit
  givenBy?: string;
  notes?: string;
};

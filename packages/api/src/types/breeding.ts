export type BreedingPlanDTO = {
  id: string;
  female_id: string;
  male_id?: string | null;
  lockedCycle?: boolean;           // locks female selection only
  cycle_start_at?: string | null;  // optional
  ovulation_at?: string | null;    // expected window anchor
  actuals?: { bred_on?: string[]; birth_on?: string | null; placement_started_on?: string | null };
  status?: "planned"|"active"|"birthed"|"placement"|"complete"|"canceled";
};

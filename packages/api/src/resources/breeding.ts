import type { Http } from "../http";

export type UiBreedingPlan = {
  id: string;
  female_id?: string | null;
  lockedCycle?: boolean | null;
  ovulation_at?: string | null;
  expected?: {
    breeding: { start: string; end: string };
    birth: { start: string; end: string };
    goHome:   { start: string; end: string };
  } | null;
  actuals?: {
    bred_on?: string[] | null;
    birth_on?: string | null;
    go_home_on?: string | null;
  } | null;
  status?: string | null;
};

export function makeBreeding(http: Http) {
  return {
    listPlans(limit = 50) {
      // adjust path if your backend uses a different route
      return http.get<UiBreedingPlan[]>(`/api/v1/breeding/plans?limit=${limit}`);
    },
  };
}

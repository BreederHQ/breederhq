import type { Http } from "../http";

export type UiOffspring = {
  id: string;
  name?: string | null;
  sex?: "M" | "F" | null;
  color?: string | null;
  buyer_contact_id?: string | null;
  // add other fields your UI reads
};

export type UiOffspringGroup = {
  id: string;           // e.g., litter id
  litter_name?: string | null;
  species?: string | null;
  breed?: string | null;
  count: number;
  invoice_rollup?: { latestStatus?: string | null } | null;
};

export function makeOffspring(http: Http) {
  return {
    // groups list
    listGroups() {
      // adjust the path if your API differs
      return http.get<UiOffspringGroup[]>(`/offspring/groups`);
    },

    // offspring within a group
    listByGroup(groupId: string) {
      // choose the path that matches your backend:
      // return http.get<UiOffspring[]>(`/offspring/groups/${groupId}`);
      return http.get<UiOffspring[]>(`/offspring?groupId=${encodeURIComponent(groupId)}`);
    },

    // (optional) flat list
    list(limit = 50) {
      return http.get<UiOffspring[]>(`/offspring?limit=${limit}`);
    },
  };
}

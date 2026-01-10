import type { Http } from "../http";

export type AnimalRow = {
  id: string;
  name: string;
  sex?: "M" | "F";
};

export type AnimalUpdatePayload = {
  femaleCycleLenOverrideDays?: number | null;
  // Add other fields as needed
};

export function makeAnimals(http: Http) {
  return {
    list(limit = 50) {
      return http.get<AnimalRow[]>(`/animals?limit=${limit}`);
    },
    get(id: number | string) {
      return http.get<any>(`/animals/${id}`);
    },
    update(id: number | string, payload: AnimalUpdatePayload) {
      return http.patch<any>(`/animals/${id}`, payload);
    },
  };
}

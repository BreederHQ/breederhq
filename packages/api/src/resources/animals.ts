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
      return http.get<AnimalRow[]>(`/api/v1/animals?limit=${limit}`);
    },
    update(id: number | string, payload: AnimalUpdatePayload) {
      return http.patch<any>(`/api/v1/animals/${id}`, payload);
    },
  };
}

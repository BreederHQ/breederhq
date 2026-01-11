// packages/api/src/resources/genetics.ts
// API resource for genetic markers registry and animal genetic results

import type { Http } from "../http";
import type {
  GeneticMarker,
  GeneticMarkerCategory,
  GeneticSpecies,
  GeneticMarkerSearchParams,
  GeneticMarkerListResponse,
  AnimalGeneticResult,
  AnimalGeneticProfile,
  CreateGeneticResultInput,
  GeneticImportResult,
} from "../types/genetics";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GeneticMarkersResource = {
  /** List genetic markers with optional filtering */
  list(params?: GeneticMarkerSearchParams): Promise<GeneticMarkerListResponse>;
  /** Get a single marker by ID */
  get(id: number): Promise<GeneticMarker>;
  /** Search markers by text (searches name, code, gene, aliases) */
  search(query: string, species?: GeneticSpecies): Promise<GeneticMarker[]>;
  /** Get common markers for a species (for default UI) */
  getCommon(species: GeneticSpecies): Promise<GeneticMarker[]>;
  /** Get breed-specific markers */
  getBreedSpecific(species: GeneticSpecies, breeds: string[]): Promise<GeneticMarker[]>;
  /** Get markers pending admin review */
  getPendingReview(params?: { limit?: number; offset?: number }): Promise<GeneticMarkerListResponse>;
  /** Approve a pending marker (admin) */
  approve(id: number, updates?: Partial<GeneticMarker>): Promise<GeneticMarker>;
  /** Reject/delete a pending marker (admin) */
  reject(id: number): Promise<{ success: true }>;
  /** Merge a pending marker into an existing one (admin) */
  merge(pendingId: number, targetId: number): Promise<GeneticMarker>;
};

export type AnimalGeneticsResource = {
  /** Get full genetic profile for an animal */
  getProfile(animalId: number): Promise<AnimalGeneticProfile>;
  /** Get genetic results for an animal */
  getResults(animalId: number): Promise<AnimalGeneticResult[]>;
  /** Add a single genetic result */
  addResult(animalId: number, input: CreateGeneticResultInput): Promise<AnimalGeneticResult>;
  /** Add multiple genetic results at once */
  addResults(animalId: number, inputs: CreateGeneticResultInput[]): Promise<AnimalGeneticResult[]>;
  /** Update a genetic result */
  updateResult(animalId: number, resultId: number, input: Partial<CreateGeneticResultInput>): Promise<AnimalGeneticResult>;
  /** Delete a genetic result */
  deleteResult(animalId: number, resultId: number): Promise<{ success: true }>;
  /** Import from lab CSV/file */
  import(animalId: number, provider: string, fileContent: string, mergeStrategy?: "replace" | "merge"): Promise<GeneticImportResult>;
  /** Preview import without saving */
  previewImport(animalId: number, provider: string, fileContent: string): Promise<GeneticImportResult>;
  /** Update visibility settings for a result */
  updateVisibility(animalId: number, resultId: number, settings: { networkVisible?: boolean; marketplaceVisible?: boolean }): Promise<AnimalGeneticResult>;
  /** Bulk update visibility for multiple results */
  bulkUpdateVisibility(animalId: number, resultIds: number[], settings: { networkVisible?: boolean; marketplaceVisible?: boolean }): Promise<AnimalGeneticResult[]>;
};

export type GeneticsResource = {
  markers: GeneticMarkersResource;
  animals: AnimalGeneticsResource;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Builder
// ─────────────────────────────────────────────────────────────────────────────

function buildMarkerQuery(params: GeneticMarkerSearchParams = {}): string {
  const sp = new URLSearchParams();
  if (params.species) sp.set("species", params.species);
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);
  if (params.breedSpecific) sp.set("breedSpecific", params.breedSpecific);
  if (params.isCommon !== undefined) sp.set("isCommon", String(params.isCommon));
  if (params.pendingReview !== undefined) sp.set("pendingReview", String(params.pendingReview));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Normalizer
// ─────────────────────────────────────────────────────────────────────────────

function normalizeMarkerList(res: any): GeneticMarkerListResponse {
  // Handle array response
  if (Array.isArray(res)) {
    return { markers: res, total: res.length, limit: res.length, offset: 0 };
  }
  // Handle object response
  if (res && typeof res === "object") {
    if ("markers" in res) {
      return {
        markers: res.markers || [],
        total: res.total ?? res.markers?.length ?? 0,
        limit: res.limit ?? 50,
        offset: res.offset ?? 0,
      };
    }
    if ("items" in res) {
      return {
        markers: res.items || [],
        total: res.total ?? res.items?.length ?? 0,
        limit: res.limit ?? 50,
        offset: res.offset ?? 0,
      };
    }
    if ("data" in res && Array.isArray(res.data)) {
      return {
        markers: res.data,
        total: res.total ?? res.data.length,
        limit: res.limit ?? 50,
        offset: res.offset ?? 0,
      };
    }
  }
  return { markers: [], total: 0, limit: 50, offset: 0 };
}

function normalizeResultList(res: any): AnimalGeneticResult[] {
  if (Array.isArray(res)) return res;
  if (res?.results && Array.isArray(res.results)) return res.results;
  if (res?.items && Array.isArray(res.items)) return res.items;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function makeGeneticMarkers(http: Http): GeneticMarkersResource {
  const BASE = "/api/v1/genetics/markers";

  return {
    async list(params?: GeneticMarkerSearchParams): Promise<GeneticMarkerListResponse> {
      const res = await http.get(`${BASE}${buildMarkerQuery(params)}`);
      return normalizeMarkerList(res);
    },

    async get(id: number): Promise<GeneticMarker> {
      return http.get(`${BASE}/${id}`);
    },

    async search(query: string, species?: GeneticSpecies): Promise<GeneticMarker[]> {
      const params: GeneticMarkerSearchParams = { search: query, species };
      const res = await http.get(`${BASE}${buildMarkerQuery(params)}`);
      return normalizeMarkerList(res).markers;
    },

    async getCommon(species: GeneticSpecies): Promise<GeneticMarker[]> {
      const params: GeneticMarkerSearchParams = { species, isCommon: true };
      const res = await http.get(`${BASE}${buildMarkerQuery(params)}`);
      return normalizeMarkerList(res).markers;
    },

    async getBreedSpecific(species: GeneticSpecies, breeds: string[]): Promise<GeneticMarker[]> {
      const sp = new URLSearchParams();
      sp.set("species", species);
      breeds.forEach((b) => sp.append("breeds", b));
      const res = await http.get(`${BASE}/breed-specific?${sp.toString()}`);
      return normalizeMarkerList(res).markers;
    },

    async getPendingReview(params?: { limit?: number; offset?: number }): Promise<GeneticMarkerListResponse> {
      const searchParams: GeneticMarkerSearchParams = { ...params, pendingReview: true };
      const res = await http.get(`${BASE}${buildMarkerQuery(searchParams)}`);
      return normalizeMarkerList(res);
    },

    async approve(id: number, updates?: Partial<GeneticMarker>): Promise<GeneticMarker> {
      return http.post(`${BASE}/${id}/approve`, updates || {});
    },

    async reject(id: number): Promise<{ success: true }> {
      return http.delete(`${BASE}/${id}`);
    },

    async merge(pendingId: number, targetId: number): Promise<GeneticMarker> {
      return http.post(`${BASE}/${pendingId}/merge`, { targetId });
    },
  };
}

export function makeAnimalGenetics(http: Http): AnimalGeneticsResource {
  const BASE = "/api/v1/animals";

  return {
    async getProfile(animalId: number): Promise<AnimalGeneticProfile> {
      return http.get(`${BASE}/${animalId}/genetics/profile`);
    },

    async getResults(animalId: number): Promise<AnimalGeneticResult[]> {
      const res = await http.get(`${BASE}/${animalId}/genetics/results`);
      return normalizeResultList(res);
    },

    async addResult(animalId: number, input: CreateGeneticResultInput): Promise<AnimalGeneticResult> {
      const res = await http.post(`${BASE}/${animalId}/genetics/results`, input);
      return res.result || res;
    },

    async addResults(animalId: number, inputs: CreateGeneticResultInput[]): Promise<AnimalGeneticResult[]> {
      const res = await http.post(`${BASE}/${animalId}/genetics/results/bulk`, { results: inputs });
      return normalizeResultList(res);
    },

    async updateResult(animalId: number, resultId: number, input: Partial<CreateGeneticResultInput>): Promise<AnimalGeneticResult> {
      const res = await http.patch(`${BASE}/${animalId}/genetics/results/${resultId}`, input);
      return res.result || res;
    },

    async deleteResult(animalId: number, resultId: number): Promise<{ success: true }> {
      return http.delete(`${BASE}/${animalId}/genetics/results/${resultId}`);
    },

    async import(animalId: number, provider: string, fileContent: string, mergeStrategy: "replace" | "merge" = "replace"): Promise<GeneticImportResult> {
      return http.post(`${BASE}/${animalId}/genetics/import`, {
        provider,
        fileContent,
        mergeStrategy,
      });
    },

    async previewImport(animalId: number, provider: string, fileContent: string): Promise<GeneticImportResult> {
      return http.post(`${BASE}/${animalId}/genetics/import/preview`, {
        provider,
        fileContent,
      });
    },

    async updateVisibility(animalId: number, resultId: number, settings: { networkVisible?: boolean; marketplaceVisible?: boolean }): Promise<AnimalGeneticResult> {
      const res = await http.patch(`${BASE}/${animalId}/genetics/results/${resultId}/visibility`, settings);
      return res.result || res;
    },

    async bulkUpdateVisibility(animalId: number, resultIds: number[], settings: { networkVisible?: boolean; marketplaceVisible?: boolean }): Promise<AnimalGeneticResult[]> {
      const res = await http.post(`${BASE}/${animalId}/genetics/results/bulk-visibility`, {
        resultIds,
        ...settings,
      });
      return normalizeResultList(res);
    },
  };
}

export function makeGenetics(http: Http): GeneticsResource {
  return {
    markers: makeGeneticMarkers(http),
    animals: makeAnimalGenetics(http),
  };
}

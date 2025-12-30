// apps/marketplace/src/api.ts
// Public marketplace API client - no auth required, no tenant header needed
import type {
  PublicProgramDTO,
  PublicProgramSummary,
  ProgramsListParams,
  PublicOffspringGroupSummary,
  PublicOffspringGroupDTO,
  PublicAnimalSummary,
  PublicAnimalDTO,
  PublicListResponse,
  ApiError,
} from "./types";

function normBase(base?: string): string {
  let b = String(base || (window as any).__BHQ_API_BASE__ || "").trim();
  if (!b) b = typeof window !== "undefined" ? window.location.origin : "http://localhost:6170";
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const errData = data as Record<string, unknown> | undefined;
    const msg = errData?.message || errData?.error || `HTTP ${res.status}`;
    const err = new Error(String(msg)) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export function makePublicMarketplaceApi(base?: string) {
  const root = normBase(base);
  const publicRoot = `${root}/public/marketplace`;

  const req = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${publicRoot}${path}`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });
    return parse<T>(res);
  };

  return {
    programs: {
      /** List all public programs with optional filters */
      async list(params?: ProgramsListParams): Promise<PublicListResponse<PublicProgramSummary>> {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.species) qs.set("species", params.species);
        if (params?.breed) qs.set("breed", params.breed);
        if (params?.location) qs.set("location", params.location);
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.offset) qs.set("offset", String(params.offset));
        const query = qs.toString();
        return req<PublicListResponse<PublicProgramSummary>>(`/programs${query ? `?${query}` : ""}`);
      },

      /** Get program profile by slug */
      async get(programSlug: string): Promise<PublicProgramDTO> {
        return req<PublicProgramDTO>(`/programs/${encodeURIComponent(programSlug)}`);
      },

      /** List offspring groups for a program */
      async listOffspringGroups(programSlug: string): Promise<PublicListResponse<PublicOffspringGroupSummary>> {
        return req<PublicListResponse<PublicOffspringGroupSummary>>(
          `/programs/${encodeURIComponent(programSlug)}/offspring-groups`
        );
      },

      /** Get offspring group detail */
      async getOffspringGroup(programSlug: string, listingSlug: string): Promise<PublicOffspringGroupDTO> {
        return req<PublicOffspringGroupDTO>(
          `/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}`
        );
      },

      /** List animals for a program */
      async listAnimals(programSlug: string): Promise<PublicListResponse<PublicAnimalSummary>> {
        return req<PublicListResponse<PublicAnimalSummary>>(
          `/programs/${encodeURIComponent(programSlug)}/animals`
        );
      },

      /** Get animal detail */
      async getAnimal(programSlug: string, urlSlug: string): Promise<PublicAnimalDTO> {
        return req<PublicAnimalDTO>(
          `/programs/${encodeURIComponent(programSlug)}/animals/${encodeURIComponent(urlSlug)}`
        );
      },
    },
  };
}

/** Singleton instance */
export const publicMarketplaceApi = makePublicMarketplaceApi();

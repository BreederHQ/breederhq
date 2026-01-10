// packages/api/src/resources/tags.ts
// Unified Tags resource for tag CRUD and assignment across all modules.

import type { Http } from "../http";

// Tag module enum matching backend TagModule
export type TagModule =
  | "CONTACT"
  | "ORGANIZATION"
  | "ANIMAL"
  | "WAITLIST_ENTRY"
  | "OFFSPRING_GROUP"
  | "OFFSPRING"
  | "MESSAGE_THREAD"
  | "DRAFT"
  | "BREEDING_PLAN";

export type TagDTO = {
  id: number;
  name: string;
  color: string | null;
  module: TagModule;
};

export type TagListParams = {
  module: TagModule;
  q?: string;
  limit?: number;
};

export type TagListResponse = {
  items: TagDTO[];
  total?: number;
};

export type CreateTagInput = {
  name: string;
  module: TagModule;
  color?: string | null;
};

export type UpdateTagInput = {
  name?: string;
  color?: string | null;
};

// Assignment targets - exactly one should be provided
export type TagAssignmentTarget = {
  contactId?: number;
  organizationId?: number;
  animalId?: number;
  waitlistEntryId?: number;
  offspringGroupId?: number;
  offspringId?: number;
  messageThreadId?: number;
  draftId?: number;
  breedingPlanId?: number;
};

export type TagsResource = {
  list(params: TagListParams): Promise<TagListResponse>;
  get(id: number): Promise<TagDTO>;
  create(input: CreateTagInput): Promise<TagDTO>;
  update(id: number, input: UpdateTagInput): Promise<TagDTO>;
  delete(id: number): Promise<{ success: true }>;
  assign(tagId: number, target: TagAssignmentTarget): Promise<void>;
  unassign(tagId: number, target: TagAssignmentTarget): Promise<void>;
  listForEntity(target: TagAssignmentTarget): Promise<TagDTO[]>;
  listForContact(contactId: number): Promise<TagDTO[]>;
  listForOrganization(organizationId: number): Promise<TagDTO[]>;
  listForAnimal(animalId: number): Promise<TagDTO[]>;
  listForOffspring(offspringId: number): Promise<TagDTO[]>;
  listForMessageThread(messageThreadId: number): Promise<TagDTO[]>;
  listForDraft(draftId: number): Promise<TagDTO[]>;
  listForBreedingPlan(breedingPlanId: number): Promise<TagDTO[]>;
  /** Batch fetch tags for multiple contacts/organizations. Returns a map of entityId -> tags */
  listForEntities(targets: Array<{ contactId?: number; organizationId?: number }>): Promise<Map<string, TagDTO[]>>;
};

function buildQuery(params: TagListParams): string {
  const sp = new URLSearchParams();
  sp.set("module", params.module);
  if (params.q) sp.set("q", String(params.q));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeList(res: any): TagListResponse {
  if (Array.isArray(res)) {
    return { items: res as TagDTO[], total: res.length };
  }
  if (res && typeof res === "object") {
    if ("items" in res) {
      return {
        items: res.items as TagDTO[],
        total: res.total ?? res.items.length,
      };
    }
  }
  return { items: [], total: 0 };
}

function getEntityPath(target: TagAssignmentTarget): string {
  if (target.contactId != null) return `/contacts/${target.contactId}/tags`;
  if (target.organizationId != null) return `/organizations/${target.organizationId}/tags`;
  if (target.animalId != null) return `/animals/${target.animalId}/tags`;
  if (target.waitlistEntryId != null) return `/waitlist/${target.waitlistEntryId}/tags`;
  if (target.offspringGroupId != null) return `/offspring/${target.offspringGroupId}/tags`;
  if (target.offspringId != null) return `/offspring/individuals/${target.offspringId}/tags`;
  if (target.messageThreadId != null) return `/message-threads/${target.messageThreadId}/tags`;
  if (target.draftId != null) return `/drafts/${target.draftId}/tags`;
  if (target.breedingPlanId != null) return `/breeding/plans/${target.breedingPlanId}/tags`;
  throw new Error("TagAssignmentTarget must have exactly one entity ID");
}

export function makeTags(http: Http): TagsResource {
  const BASE = "/api/v1";

  return {
    async list(params: TagListParams): Promise<TagListResponse> {
      const res = await http.get(`${BASE}/tags${buildQuery(params)}`);
      return normalizeList(res);
    },

    async get(id: number): Promise<TagDTO> {
      return http.get(`${BASE}/tags/${id}`);
    },

    async create(input: CreateTagInput): Promise<TagDTO> {
      return http.post(`${BASE}/tags`, input);
    },

    async update(id: number, input: UpdateTagInput): Promise<TagDTO> {
      return http.patch(`${BASE}/tags/${id}`, input);
    },

    async delete(id: number): Promise<{ success: true }> {
      await http.delete(`${BASE}/tags/${id}`);
      return { success: true };
    },

    async assign(tagId: number, target: TagAssignmentTarget): Promise<void> {
      await http.post(`${BASE}/tags/${tagId}/assign`, target);
    },

    async unassign(tagId: number, target: TagAssignmentTarget): Promise<void> {
      await http.post(`${BASE}/tags/${tagId}/unassign`, target);
    },

    async listForEntity(target: TagAssignmentTarget): Promise<TagDTO[]> {
      const path = getEntityPath(target);
      const res = await http.get(`${BASE}${path}`);
      // Normalize array or { items } response
      if (Array.isArray(res)) return res as TagDTO[];
      if (res && typeof res === "object" && "items" in res) {
        return res.items as TagDTO[];
      }
      return [];
    },

    async listForContact(contactId: number): Promise<TagDTO[]> {
      return this.listForEntity({ contactId });
    },

    async listForOrganization(organizationId: number): Promise<TagDTO[]> {
      return this.listForEntity({ organizationId });
    },

    async listForAnimal(animalId: number): Promise<TagDTO[]> {
      return this.listForEntity({ animalId });
    },

    async listForOffspring(offspringId: number): Promise<TagDTO[]> {
      return this.listForEntity({ offspringId });
    },

    async listForMessageThread(messageThreadId: number): Promise<TagDTO[]> {
      return this.listForEntity({ messageThreadId });
    },

    async listForDraft(draftId: number): Promise<TagDTO[]> {
      return this.listForEntity({ draftId });
    },

    async listForBreedingPlan(breedingPlanId: number): Promise<TagDTO[]> {
      return this.listForEntity({ breedingPlanId });
    },

    async listForEntities(targets: Array<{ contactId?: number; organizationId?: number }>): Promise<Map<string, TagDTO[]>> {
      // Fetch tags for multiple entities in parallel (client-side batching)
      // Returns a map keyed by "contact:123" or "organization:456"
      const results = new Map<string, TagDTO[]>();

      // Batch requests in groups of 10 to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const promises = batch.map(async (target) => {
          const key = target.contactId
            ? `contact:${target.contactId}`
            : `organization:${target.organizationId}`;
          try {
            const tags = await this.listForEntity(target);
            return { key, tags };
          } catch {
            return { key, tags: [] };
          }
        });
        const batchResults = await Promise.all(promises);
        for (const { key, tags } of batchResults) {
          results.set(key, tags);
        }
      }

      return results;
    },
  };
}

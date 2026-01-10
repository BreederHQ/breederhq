// Contacts resource — non-breaking surface that uses relative paths so createHttp(baseURL) applies.
// Normalizes list payloads into { items, total } to keep app code stable.

import type { Http } from "../http";
import type {
  ContactDTO,
  CreateContactInput,
  UpdateContactInput,
  ListParams,
  ListResponse,
  ID,
} from "../types/contacts";

export type ContactsResource = {
  list(params?: ListParams): Promise<ListResponse<ContactDTO>>;
  get(id: ID): Promise<ContactDTO>;
  create(input: CreateContactInput): Promise<ContactDTO>;
  update(id: ID, input: UpdateContactInput): Promise<ContactDTO>;
  delete(id: ID): Promise<{ success: true }>;
};

function buildQuery(params: ListParams = {}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", String(params.q));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.sort) sp.set("sort", String(params.sort));
  // Flatten simple filters if present
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v === undefined || v === null || v === "") continue;
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeList(res: any): ListResponse<ContactDTO> {
  // Server may return bare array
  if (Array.isArray(res)) {
    return { items: res as ContactDTO[], total: (res as any[]).length };
  }
  // Common envelopes
  if (res && typeof res === "object") {
    // { items, total }
    if ("items" in res && "total" in res) {
      return res as ListResponse<ContactDTO>;
    }
    // { results, total? }
    if ("results" in res) {
      const items = (res as any).results as ContactDTO[];
      const total =
        Number((res as any).total ?? (Array.isArray(items) ? items.length : 0));
      return { items, total };
    }
    // { data: [...] } or { data: { items, total } }
    if ("data" in res) {
      const data = (res as any).data;
      if (Array.isArray(data)) {
        return {
          items: data as ContactDTO[],
          total: Number((res as any).total ?? (res as any).count ?? data.length),
        };
      }
      if (data && typeof data === "object" && "items" in data) {
        const items = (data as any).items as ContactDTO[];
        const total = Number(
          (data as any).total ??
            (data as any).count ??
            (Array.isArray(items) ? items.length : 0)
        );
        return { items, total };
      }
    }
  }
  return { items: [], total: 0 };
}

export function makeContacts(http: Http): ContactsResource {
  const BASE = "/api/v1";

  return {
    async list(params: ListParams = {}): Promise<ListResponse<ContactDTO>> {
      const res = await http.get(`${BASE}/contacts${buildQuery(params)}`);
      return normalizeList(res);
    },
    async get(id: ID): Promise<ContactDTO> {
      return http.get(`${BASE}/contacts/${id}`);
    },
    async create(input: CreateContactInput): Promise<ContactDTO> {
      return http.post(`${BASE}/contacts`, input);
    },
    async update(id: ID, input: UpdateContactInput): Promise<ContactDTO> {
      return http.patch(`${BASE}/contacts/${id}`, input);
    },
    async delete(id: ID): Promise<{ success: true }> {
      await http.delete(`${BASE}/contacts/${id}`);
      return { success: true };
    },
  };
}

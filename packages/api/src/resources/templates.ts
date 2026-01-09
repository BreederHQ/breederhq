// packages/api/src/resources/templates.ts
// API resource for email/message template CRUD operations

import type { Http } from "../http";
import type {
  EmailTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateListParams,
  TemplateListResponse,
} from "../types/templates";

export type TemplatesResource = {
  list(params?: TemplateListParams): Promise<TemplateListResponse>;
  get(id: number): Promise<EmailTemplate>;
  create(input: CreateTemplateInput): Promise<EmailTemplate>;
  update(id: number, input: UpdateTemplateInput): Promise<EmailTemplate>;
  delete(id: number): Promise<{ success: true }>;
};

function buildQuery(params?: TemplateListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.q) sp.set("q", params.q);
  if (params.isActive != null) sp.set("is_active", String(params.isActive));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeList(res: unknown): TemplateListResponse {
  if (Array.isArray(res)) {
    return { items: res as EmailTemplate[], total: res.length };
  }
  if (res && typeof res === "object") {
    if ("items" in res) {
      const obj = res as { items: EmailTemplate[]; total?: number };
      return {
        items: obj.items,
        total: obj.total ?? obj.items.length,
      };
    }
  }
  return { items: [], total: 0 };
}

export function makeTemplates(http: Http): TemplatesResource {
  return {
    async list(params?: TemplateListParams): Promise<TemplateListResponse> {
      const res = await http.get(`/templates${buildQuery(params)}`);
      return normalizeList(res);
    },

    async get(id: number): Promise<EmailTemplate> {
      return http.get(`/templates/${id}`);
    },

    async create(input: CreateTemplateInput): Promise<EmailTemplate> {
      return http.post(`/templates`, input);
    },

    async update(id: number, input: UpdateTemplateInput): Promise<EmailTemplate> {
      return http.patch(`/templates/${id}`, input);
    },

    async delete(id: number): Promise<{ success: true }> {
      await http.delete(`/templates/${id}`);
      return { success: true };
    },
  };
}

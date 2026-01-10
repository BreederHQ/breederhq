// packages/api/src/resources/document-bundles.ts
// API resource for document bundle CRUD operations

import type { Http } from "../http";
import type {
  DocumentBundle,
  CreateBundleInput,
  UpdateBundleInput,
  BundleListParams,
  BundleListResponse,
  AddDocumentsInput,
  ReorderDocumentsInput,
} from "../types/document-bundles";

export type DocumentBundlesResource = {
  list(params?: BundleListParams): Promise<BundleListResponse>;
  get(id: number): Promise<DocumentBundle>;
  create(input: CreateBundleInput): Promise<DocumentBundle>;
  update(id: number, input: UpdateBundleInput): Promise<DocumentBundle>;
  delete(id: number): Promise<{ success: true }>;
  addDocuments(bundleId: number, input: AddDocumentsInput): Promise<DocumentBundle>;
  removeDocument(bundleId: number, documentId: number): Promise<DocumentBundle>;
  reorderDocuments(bundleId: number, input: ReorderDocumentsInput): Promise<DocumentBundle>;
};

function buildQuery(params?: BundleListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeList(res: unknown): BundleListResponse {
  if (Array.isArray(res)) {
    return { items: res as DocumentBundle[], total: res.length };
  }
  if (res && typeof res === "object") {
    if ("items" in res) {
      const obj = res as { items: DocumentBundle[]; total?: number };
      return {
        items: obj.items,
        total: obj.total ?? obj.items.length,
      };
    }
  }
  return { items: [], total: 0 };
}

export function makeDocumentBundles(http: Http): DocumentBundlesResource {
  return {
    async list(params?: BundleListParams): Promise<BundleListResponse> {
      const res = await http.get(`/document-bundles${buildQuery(params)}`);
      return normalizeList(res);
    },

    async get(id: number): Promise<DocumentBundle> {
      return http.get(`/document-bundles/${id}`);
    },

    async create(input: CreateBundleInput): Promise<DocumentBundle> {
      return http.post(`/document-bundles`, input);
    },

    async update(id: number, input: UpdateBundleInput): Promise<DocumentBundle> {
      return http.patch(`/document-bundles/${id}`, input);
    },

    async delete(id: number): Promise<{ success: true }> {
      await http.delete(`/document-bundles/${id}`);
      return { success: true };
    },

    async addDocuments(bundleId: number, input: AddDocumentsInput): Promise<DocumentBundle> {
      return http.post(`/document-bundles/${bundleId}/documents`, input);
    },

    async removeDocument(bundleId: number, documentId: number): Promise<DocumentBundle> {
      await http.delete(`/document-bundles/${bundleId}/documents/${documentId}`);
      return http.get(`/document-bundles/${bundleId}`);
    },

    async reorderDocuments(bundleId: number, input: ReorderDocumentsInput): Promise<DocumentBundle> {
      return http.put(`/document-bundles/${bundleId}/documents/order`, input);
    },
  };
}

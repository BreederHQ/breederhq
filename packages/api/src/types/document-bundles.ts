// packages/api/src/types/document-bundles.ts
// Types for document bundle management - collections of documents for email attachments

export type BundleStatus = "active" | "archived";

export interface DocumentBundle {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  status: BundleStatus;
  documentCount: number;
  documents?: BundleDocumentDTO[]; // Included in detail view
  createdAt: string;
  updatedAt: string;
}

export interface BundleDocumentDTO {
  id: number; // BundleItem ID
  documentId: number;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
}

export interface CreateBundleInput {
  name: string;
  description?: string;
  documentIds?: number[];
}

export interface UpdateBundleInput {
  name?: string;
  description?: string;
  status?: BundleStatus;
}

export interface BundleListParams {
  status?: BundleStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface BundleListResponse {
  items: DocumentBundle[];
  total: number;
}

export interface AddDocumentsInput {
  documentIds: number[];
}

export interface ReorderDocumentsInput {
  documentIds: number[]; // Document IDs in desired order
}

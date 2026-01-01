// packages/api/src/resources/portal-data.ts
// Portal Data resource for read-only client portal value surfaces

import type { Http } from "../http";

// Agreements types
export type ContractStatus = "DRAFT" | "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED";
export type ContractPartyRole = "SELLER" | "BUYER" | "GUARANTOR" | "WITNESS";

export interface AgreementDTO {
  id: number;
  name: string;
  status: ContractStatus;
  effectiveDate: string | null;
  expirationDate: string | null;
  role: ContractPartyRole;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementsResponse {
  agreements: AgreementDTO[];
}

// Documents types
export type DocumentCategory = "CONTRACT" | "HEALTH" | "PEDIGREE" | "PHOTO" | "OTHER";
export type DocumentSource = "party" | "offspring";

export interface DocumentDTO {
  id: number;
  name: string;
  description: string | null;
  category: DocumentCategory | null;
  uploadedAt: string;
  fileUrl: string | null; // null when downloads must go through secure endpoint
  mimeType: string | null;
  fileSizeBytes: number | null;
  source: DocumentSource;
  offspringId?: number;
  offspringName?: string;
}

export interface DocumentsResponse {
  documents: DocumentDTO[];
}

// Offspring types
export type PlacementStatus =
  | "WAITLISTED"
  | "RESERVED"
  | "DEPOSIT_PAID"
  | "FULLY_PAID"
  | "READY_FOR_PICKUP"
  | "PLACED"
  | "CANCELLED";

export interface OffspringPlacementDTO {
  id: number;
  offspringGroupId: number;
  offspringGroupCode: string;
  offspringGroupLabel: string | null;
  birthDate: string | null;
  species: string;
  breed: string | null;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  offspring: {
    id: number;
    name: string;
    sex: string | null;
    color: string | null;
    microchipId: string | null;
    registrationNumber: string | null;
  } | null;
  placementStatus: PlacementStatus;
  depositPaidAt: string | null;
  fullPricePaidAt: string | null;
  pickedUpAt: string | null;
  createdAt: string;
}

export interface OffspringPlacementsResponse {
  placements: OffspringPlacementDTO[];
}

export type PortalDataResource = {
  getAgreements(): Promise<AgreementsResponse>;
  getDocuments(): Promise<DocumentsResponse>;
  getOffspringPlacements(): Promise<OffspringPlacementsResponse>;
};

export function makePortalData(http: Http): PortalDataResource {
  return {
    async getAgreements(): Promise<AgreementsResponse> {
      const res = await http.get("/portal/agreements");
      return res as AgreementsResponse;
    },

    async getDocuments(): Promise<DocumentsResponse> {
      const res = await http.get("/portal/documents");
      return res as DocumentsResponse;
    },

    async getOffspringPlacements(): Promise<OffspringPlacementsResponse> {
      const res = await http.get("/portal/offspring");
      return res as OffspringPlacementsResponse;
    },
  };
}

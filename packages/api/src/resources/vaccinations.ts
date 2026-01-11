// packages/api/src/resources/vaccinations.ts
// Vaccination records API resource

import type { Http } from "../http";
import type {
  VaccinationRecord,
  VaccinationSummary,
  VaccinationProtocol,
  CreateVaccinationInput,
  UpdateVaccinationInput,
} from "../types/vaccinations";

export interface VaccinationListResponse {
  records: VaccinationRecord[];
  summary: VaccinationSummary;
}

export interface VaccinationProtocolsResponse {
  protocols: VaccinationProtocol[];
}

export interface DocumentUploadPayload {
  title: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes?: number;
  visibility?: "PRIVATE" | "BUYERS" | "PUBLIC";
}

export interface VaccinationsResource {
  /**
   * List all vaccination records for an animal
   */
  list(animalId: number): Promise<VaccinationListResponse>;

  /**
   * Get available vaccination protocols for a species
   */
  protocols(species: string): Promise<VaccinationProtocolsResponse>;

  /**
   * Create a new vaccination record
   */
  create(animalId: number, input: CreateVaccinationInput): Promise<VaccinationRecord>;

  /**
   * Update an existing vaccination record
   */
  update(
    animalId: number,
    recordId: number,
    input: UpdateVaccinationInput
  ): Promise<VaccinationRecord>;

  /**
   * Delete a vaccination record
   */
  delete(animalId: number, recordId: number): Promise<void>;

  /**
   * Upload a document and link it to a vaccination record
   */
  uploadDocument(
    animalId: number,
    recordId: number,
    payload: DocumentUploadPayload
  ): Promise<VaccinationRecord>;

  /**
   * Unlink a document from a vaccination record (does not delete the document)
   */
  unlinkDocument(animalId: number, recordId: number): Promise<VaccinationRecord>;
}

/**
 * Create the vaccinations API resource
 */
export function createVaccinationsResource(http: Http): VaccinationsResource {
  return {
    async list(animalId) {
      const response = await http.get<VaccinationListResponse>(
        `/animals/${animalId}/vaccinations`
      );
      return response;
    },

    async protocols(species) {
      const response = await http.get<VaccinationProtocolsResponse>(
        `/vaccinations/protocols?species=${encodeURIComponent(species)}`
      );
      return response;
    },

    async create(animalId, input) {
      const response = await http.post<VaccinationRecord>(
        `/animals/${animalId}/vaccinations`,
        input
      );
      return response;
    },

    async update(animalId, recordId, input) {
      const response = await http.patch<VaccinationRecord>(
        `/animals/${animalId}/vaccinations/${recordId}`,
        input
      );
      return response;
    },

    async delete(animalId, recordId) {
      await http.delete(`/animals/${animalId}/vaccinations/${recordId}`);
    },

    async uploadDocument(animalId, recordId, payload) {
      const response = await http.post<VaccinationRecord>(
        `/animals/${animalId}/vaccinations/${recordId}/document`,
        payload
      );
      return response;
    },

    async unlinkDocument(animalId, recordId) {
      const response = await http.delete<VaccinationRecord>(
        `/animals/${animalId}/vaccinations/${recordId}/document`
      );
      return response;
    },
  };
}

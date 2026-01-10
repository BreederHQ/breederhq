// packages/api/src/resources/animal-linking.ts
// Cross-tenant animal linking API client

import type { Http } from "../http";
import type {
  NetworkAnimalResult,
  BreederSearchResult,
  ShareableAnimal,
  LinkRequestWithDetails,
  CrossTenantLink,
  ExchangeCodeInfo,
  RegistryDTO,
  CreateLinkRequestInput,
  ApproveLinkRequestInput,
  DenyLinkRequestInput,
  Sex,
  Species,
} from "../types/animal-linking";

export type AnimalLinkingResource = {
  // Network discovery
  searchByGaid(gaid: string): Promise<NetworkAnimalResult | null>;
  searchByExchangeCode(code: string): Promise<NetworkAnimalResult | null>;
  searchByRegistry(registryId: number, number: string): Promise<NetworkAnimalResult | null>;
  searchBreeder(query: string): Promise<BreederSearchResult[]>;
  getBreederAnimals(tenantId: number, filters?: { sex?: Sex; species?: Species }): Promise<ShareableAnimal[]>;

  // Exchange codes
  getExchangeCode(animalId: number): Promise<ExchangeCodeInfo>;
  generateExchangeCode(animalId: number): Promise<{ code: string; expiresAt: string }>;
  clearExchangeCode(animalId: number): Promise<void>;

  // GAID
  ensureGaid(animalId: number): Promise<{ gaid: string }>;

  // Link requests
  createLinkRequest(animalId: number, input: CreateLinkRequestInput): Promise<{ id: number; status: string }>;
  getIncomingRequests(): Promise<LinkRequestWithDetails[]>;
  getOutgoingRequests(): Promise<LinkRequestWithDetails[]>;
  approveRequest(requestId: number, input: ApproveLinkRequestInput): Promise<{ linkId: number }>;
  denyRequest(requestId: number, input?: DenyLinkRequestInput): Promise<void>;

  // Active links
  getLinksForAnimal(animalId: number): Promise<CrossTenantLink[]>;
  revokeLink(linkId: number, reason?: string): Promise<void>;

  // Registries list
  getRegistries(): Promise<RegistryDTO[]>;
};

export function makeAnimalLinking(http: Http): AnimalLinkingResource {
  return {
    // ═══════════════════════════════════════════════════════════════════════
    // NETWORK DISCOVERY
    // ═══════════════════════════════════════════════════════════════════════

    async searchByGaid(gaid: string): Promise<NetworkAnimalResult | null> {
      try {
        const res = await http.get(`/network/search/gaid/${encodeURIComponent(gaid)}`);
        return res?.animal ?? null;
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },

    async searchByExchangeCode(code: string): Promise<NetworkAnimalResult | null> {
      try {
        const res = await http.get(`/network/search/exchange-code/${encodeURIComponent(code)}`);
        return res?.animal ?? null;
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },

    async searchByRegistry(registryId: number, number: string): Promise<NetworkAnimalResult | null> {
      try {
        const params = new URLSearchParams({ registryId: String(registryId), number });
        const res = await http.get(`/network/search/registry?${params}`);
        return res?.animal ?? null;
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },

    async searchBreeder(query: string): Promise<BreederSearchResult[]> {
      const params = new URLSearchParams({ q: query });
      const res = await http.get(`/network/search/breeder?${params}`);
      return res?.breeders ?? [];
    },

    async getBreederAnimals(
      tenantId: number,
      filters?: { sex?: Sex; species?: Species }
    ): Promise<ShareableAnimal[]> {
      const params = new URLSearchParams();
      if (filters?.sex) params.set("sex", filters.sex);
      if (filters?.species) params.set("species", filters.species);
      const queryString = params.toString();
      const url = `/network/breeders/${tenantId}/animals${queryString ? `?${queryString}` : ""}`;
      const res = await http.get(url);
      return res?.animals ?? [];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EXCHANGE CODES
    // ═══════════════════════════════════════════════════════════════════════

    async getExchangeCode(animalId: number): Promise<ExchangeCodeInfo> {
      const res = await http.get(`/animals/${animalId}/exchange-code`);
      return {
        code: res?.code ?? null,
        expiresAt: res?.expiresAt ?? null,
        isExpired: res?.isExpired ?? true,
      };
    },

    async generateExchangeCode(animalId: number): Promise<{ code: string; expiresAt: string }> {
      const res = await http.post(`/animals/${animalId}/exchange-code`, {});
      return { code: res.code, expiresAt: res.expiresAt };
    },

    async clearExchangeCode(animalId: number): Promise<void> {
      await http.delete(`/animals/${animalId}/exchange-code`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GAID
    // ═══════════════════════════════════════════════════════════════════════

    async ensureGaid(animalId: number): Promise<{ gaid: string }> {
      const res = await http.post(`/animals/${animalId}/gaid`, {});
      return { gaid: res.gaid };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LINK REQUESTS
    // ═══════════════════════════════════════════════════════════════════════

    async createLinkRequest(
      animalId: number,
      input: CreateLinkRequestInput
    ): Promise<{ id: number; status: string }> {
      const res = await http.post(`/animals/${animalId}/link-requests`, input);
      return { id: res.id, status: res.status };
    },

    async getIncomingRequests(): Promise<LinkRequestWithDetails[]> {
      const res = await http.get("/link-requests/incoming");
      return res?.requests ?? [];
    },

    async getOutgoingRequests(): Promise<LinkRequestWithDetails[]> {
      const res = await http.get("/link-requests/outgoing");
      return res?.requests ?? [];
    },

    async approveRequest(
      requestId: number,
      input: ApproveLinkRequestInput
    ): Promise<{ linkId: number }> {
      const res = await http.post(`/link-requests/${requestId}/approve`, input);
      return { linkId: res.linkId };
    },

    async denyRequest(requestId: number, input?: DenyLinkRequestInput): Promise<void> {
      await http.post(`/link-requests/${requestId}/deny`, input ?? {});
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIVE LINKS
    // ═══════════════════════════════════════════════════════════════════════

    async getLinksForAnimal(animalId: number): Promise<CrossTenantLink[]> {
      const res = await http.get(`/animals/${animalId}/cross-tenant-links`);
      return res?.links ?? [];
    },

    async revokeLink(linkId: number, reason?: string): Promise<void> {
      await http.delete(`/cross-tenant-links/${linkId}`, { reason });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRIES
    // ═══════════════════════════════════════════════════════════════════════

    async getRegistries(): Promise<RegistryDTO[]> {
      const res = await http.get("/registries");
      return res?.registries ?? [];
    },
  };
}

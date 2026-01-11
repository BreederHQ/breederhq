// packages/api/src/resources/portal-access.ts
// Portal Access resource for managing client portal access per Party

import type { Http } from "../http";

export type PortalAccessStatus = "NO_ACCESS" | "INVITED" | "ACTIVE" | "SUSPENDED";

export interface PortalAccessDTO {
  partyId: number;
  status: PortalAccessStatus;
  email: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  lastLoginAt: string | null;
  createdBy: { id: string; email: string } | null;
  updatedBy: { id: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalAccessResponse {
  portalAccess: PortalAccessDTO;
  inviteSent?: boolean;
  resetEmailSent?: boolean;
}

export type PortalAccessResource = {
  get(partyId: number): Promise<PortalAccessResponse>;
  enable(partyId: number): Promise<PortalAccessResponse>;
  invite(partyId: number): Promise<PortalAccessResponse>;
  suspend(partyId: number): Promise<PortalAccessResponse>;
  reenable(partyId: number): Promise<PortalAccessResponse>;
  forcePasswordReset(partyId: number): Promise<PortalAccessResponse>;
};

export function makePortalAccess(http: Http): PortalAccessResource {
  const BASE = "/api/v1";

  return {
    async get(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.get(`${BASE}/portal-access/${partyId}`);
      return res as PortalAccessResponse;
    },

    async enable(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.post(`${BASE}/portal-access/${partyId}/enable`, {});
      return res as PortalAccessResponse;
    },

    async invite(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.post(`${BASE}/portal-access/${partyId}/invite`, {});
      return res as PortalAccessResponse;
    },

    async suspend(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.post(`${BASE}/portal-access/${partyId}/suspend`, {});
      return res as PortalAccessResponse;
    },

    async reenable(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.post(`${BASE}/portal-access/${partyId}/reenable`, {});
      return res as PortalAccessResponse;
    },

    async forcePasswordReset(partyId: number): Promise<PortalAccessResponse> {
      const res = await http.post(`${BASE}/portal-access/${partyId}/force-password-reset`, {});
      return res as PortalAccessResponse;
    },
  };
}

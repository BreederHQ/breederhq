export type OwnershipRow = {
  partyId?: number | null;
  partyType: "Organization" | "Contact";
  organizationId: number | null;
  contactId: number | null;
  display_name?: string | null;
  is_primary?: boolean;
  percent?: number; // 0-100
};

export type OwnershipApi = {
  searchContacts: (q: string) => Promise<Array<{ id: number; name: string; partyId?: number | null }>>;
  searchOrganizations: (q: string) => Promise<Array<{ id: number; name: string; partyId?: number | null }>>;
};

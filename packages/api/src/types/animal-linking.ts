// packages/api/src/types/animal-linking.ts
// Types for cross-tenant animal linking

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
export type Sex = "FEMALE" | "MALE";
export type ParentType = "SIRE" | "DAM";
export type LinkRequestStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED";
export type LinkMethod =
  | "GAID"
  | "EXCHANGE_CODE"
  | "REGISTRY_MATCH"
  | "MICROCHIP_MATCH"
  | "BREEDER_REQUEST"
  | "OFFSPRING_DERIVED";
export type RevokedBy = "CHILD_OWNER" | "PARENT_OWNER" | "SYSTEM";

// Network animal search result
export type NetworkAnimalResult = {
  animalId: number;
  tenantId: number;
  globalIdentityId: number | null;
  gaid: string | null;
  name: string | null;
  species: Species;
  sex: Sex;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  tenantName: string | null;
  titlePrefix: string | null;
  titleSuffix: string | null;
  registryNumbers: Array<{ registry: string; number: string }>;
};

// Breeder search result
export type BreederSearchResult = {
  tenantId: number;
  tenantName: string;
  city: string | null;
  state: string | null;
  country: string | null;
  shareableAnimalCount: number;
};

// Shareable animal (from a breeder's list)
export type ShareableAnimal = {
  id: number;
  name: string | null;
  species: Species;
  sex: Sex;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  gaid: string | null;
  titlePrefix: string | null;
  titleSuffix: string | null;
  registryNumbers: Array<{ registry: string; number: string }>;
};

// Link request with details
export type LinkRequestWithDetails = {
  id: number;
  createdAt: string;
  status: LinkRequestStatus;
  relationshipType: ParentType;
  message: string | null;
  responseMessage: string | null;
  denialReason: string | null;
  sourceAnimal: {
    id: number;
    name: string;
    species: Species;
    sex: Sex;
    photoUrl: string | null;
  };
  requestingTenant: {
    id: number;
    name: string;
  };
  targetAnimal: {
    id: number;
    name: string;
    species: Species;
    sex: Sex;
    photoUrl: string | null;
  } | null;
  targetTenant: {
    id: number;
    name: string;
  } | null;
};

// Cross-tenant link
export type CrossTenantLink = {
  id: number;
  parentType: ParentType;
  linkMethod: LinkMethod;
  createdAt: string;
  linkedAnimal: {
    id: number;
    name: string;
    species: Species;
    sex: Sex;
    photoUrl: string | null;
    tenantName: string;
  };
  canRevoke: boolean;
};

// Exchange code info
export type ExchangeCodeInfo = {
  code: string | null;
  expiresAt: string | null;
  isExpired: boolean;
};

// Registry for dropdown
export type RegistryDTO = {
  id: number;
  name: string;
  code: string | null;
  species: Species | null;
  country: string | null;
};

// Request input types
export type CreateLinkRequestInput = {
  relationshipType: ParentType;
  targetAnimalId?: number;
  targetGaid?: string;
  targetExchangeCode?: string;
  targetRegistryId?: number;
  targetRegistryNum?: string;
  targetTenantId?: number;
  message?: string;
};

export type ApproveLinkRequestInput = {
  targetAnimalId: number;
  responseMessage?: string;
};

export type DenyLinkRequestInput = {
  reason?: string;
  responseMessage?: string;
};

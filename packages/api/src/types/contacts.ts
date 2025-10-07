// Contacts SDK types
// Derived from schema.prisma Contact model and the sample GET /contacts payload.
// Extended with optional fields used by the legacy mock so the UI can adopt them
// incrementally without breaking the current server shape.

export type ID = string | number;

// Minimal fields guaranteed by current server
export interface ContactCore {
  id: ID;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  organizationId?: ID | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Optional enrichments the UI may use (mock parity). All optional to remain non-breaking.
export interface ContactExtras {
  displayName?: string | null;
  nickname?: string | null;
  company?: string | null;

  // Statuses
  status?: "Active" | "Inactive";
  leadStatus?: "prospect" | "lead" | "customer" | "inactive" | string;

  // Communication statuses and prefs
  emailStatus?: "subscribed" | "unsubscribed" | "bounced" | string;
  smsStatus?: "subscribed" | "unsubscribed" | "blocked" | string;
  commPrefs?: {
    email?: boolean;
    phone?: boolean;
    sms?: boolean;
    mail?: boolean;
  };

  // Phone details
  phoneType?: "cell" | "landline" | "work" | "home" | string;

  // Address
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;

  // Dates
  nextFollowUp?: string | null; // ISO
  birthday?: string | null;     // ISO
  lastContacted?: string | null; // ISO

  // Tags
  tags?: string[];

  // Linked entities (optional convenience)
  organizationName?: string | null;
  organization?: { id: ID; name?: string | null } | null;

  // Documents, payments etc. can be added later as needed
}

// Full DTO the SDK returns to apps
export type ContactDTO = ContactCore & ContactExtras;

// List params supported by the SDK. The SDK will pass through anything it doesn't understand.
export interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: string; // comma list, supports -prefix for desc (e.g., "lastName,-updatedAt")
  // Optional generic filters (column -> value). The API may ignore unknown keys.
  filters?: Record<string, string | number | boolean | null | undefined>;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

// Inputs for create / update. Keep optional for non-breaking usage.
export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;

  displayName?: string | null;
  nickname?: string | null;
  company?: string | null;
  organizationId?: ID | null;

  status?: "Active" | "Inactive";
  leadStatus?: string;

  emailStatus?: string;
  smsStatus?: string;
  commPrefs?: {
    email?: boolean;
    phone?: boolean;
    sms?: boolean;
    mail?: boolean;
  };

  phoneType?: string;

  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;

  nextFollowUp?: string | null;
  birthday?: string | null;
  lastContacted?: string | null;

  tags?: string[];
}

export type UpdateContactInput = CreateContactInput;

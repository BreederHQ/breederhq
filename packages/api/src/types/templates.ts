// packages/api/src/types/templates.ts
// Types for email/message template management

export type TemplateCategory = "email" | "dm" | "social";

export interface EmailTemplate {
  id: number;
  tenantId: number;
  name: string;
  category: TemplateCategory;
  subject: string | null;  // For email templates
  bodyText: string;
  bodyHtml: string | null;
  variables: string[];  // e.g., ["contact_name", "first_name", "my_name"]
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUserId: number | null;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  subject?: string;
  bodyText: string;
  bodyHtml?: string;
  variables?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string | null;
  bodyText?: string;
  bodyHtml?: string | null;
  variables?: string[];
  isActive?: boolean;
}

export interface TemplateListParams {
  category?: TemplateCategory;
  q?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface TemplateListResponse {
  items: EmailTemplate[];
  total: number;
}

// Variable substitution context
export interface TemplateVariableContext {
  contactName?: string;      // {{contact_name}} - Contact's display name
  firstName?: string;        // {{first_name}} - Contact's first name
  organizationName?: string; // {{organization_name}} - Their affiliated org
  myName?: string;           // {{my_name}} - Sender's name
  myBusiness?: string;       // {{my_business}} - Sender's business name
  animalName?: string;       // {{animal_name}} - Related animal name
  litterName?: string;       // {{litter_name}} - Related litter name
  customFields?: Record<string, string>; // For any additional variables
}

// Supported variable definitions for UI
export const TEMPLATE_VARIABLES = [
  { key: "contact_name", label: "Contact Name", description: "Full name of the contact" },
  { key: "first_name", label: "First Name", description: "Contact's first name only" },
  { key: "organization_name", label: "Organization", description: "Contact's organization" },
  { key: "my_name", label: "My Name", description: "Your display name" },
  { key: "my_business", label: "My Business", description: "Your business name" },
  { key: "animal_name", label: "Animal Name", description: "Related animal's name" },
  { key: "litter_name", label: "Litter Name", description: "Related litter's name" },
] as const;

export type TemplateVariableKey = typeof TEMPLATE_VARIABLES[number]["key"];

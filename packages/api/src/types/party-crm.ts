// packages/api/src/types/party-crm.ts
// CRM-related types for contacts/organizations: notes, activity feed, emails, events, milestones

import type { ID } from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// NOTES - Simple scratch-pad notes for breeders
// ─────────────────────────────────────────────────────────────────────────────

export interface PartyNote {
  id: ID;
  partyId: number;
  content: string;
  pinned: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  createdByUserId?: number;
  createdByUserName?: string;
}

export interface CreatePartyNoteInput {
  partyId: number;
  content: string;
  pinned?: boolean;
}

export interface UpdatePartyNoteInput {
  content?: string;
  pinned?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY FEED - Unified timeline of all interactions
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityKind =
  // Manual entries
  | "note_added"
  | "note_updated"
  // Communication
  | "email_sent"
  | "email_received"
  | "message_sent"
  | "message_received"
  | "call_logged"
  // Status changes
  | "status_changed"
  | "lead_status_changed"
  | "tag_added"
  | "tag_removed"
  // Relationships
  | "animal_linked"
  | "animal_unlinked"
  | "invoice_created"
  | "payment_received"
  // Portal
  | "portal_invited"
  | "portal_activated"
  // Events/milestones
  | "event_created"
  | "event_completed"
  | "milestone_reached"
  | "follow_up_set"
  | "follow_up_completed"
  // System
  | "contact_created"
  | "contact_updated"
  | "contact_archived"
  | "contact_restored";

export interface ActivityItem {
  id: ID;
  partyId: number;
  kind: ActivityKind;
  title: string;
  description?: string;
  metadata?: Record<string, any>; // Flexible payload for different activity types
  entityType?: string; // e.g., "invoice", "animal", "email"
  entityId?: ID;
  createdAt: string; // ISO
  createdByUserId?: number;
  createdByUserName?: string;
}

export interface ActivityListParams {
  partyId: number;
  kinds?: ActivityKind[];
  limit?: number;
  offset?: number;
  from?: string; // ISO date
  to?: string; // ISO date
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL HISTORY - Track sent/received emails
// ─────────────────────────────────────────────────────────────────────────────

export type EmailStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";
export type EmailDirection = "outbound" | "inbound";

export interface PartyEmail {
  id: ID;
  partyId: number;
  direction: EmailDirection;
  status: EmailStatus;
  subject: string;
  bodyPreview?: string; // First ~200 chars
  bodyHtml?: string;
  bodyText?: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  templateKey?: string;
  category: "transactional" | "marketing";
  sentAt?: string; // ISO
  openedAt?: string; // ISO
  clickedAt?: string; // ISO
  createdAt: string; // ISO
  metadata?: Record<string, any>;
}

export interface SendEmailInput {
  partyId: number;
  to: string;
  subject: string;
  body?: string;
  bodyHtml?: string;
  bodyText?: string;
  templateKey?: string;
  category?: "transactional" | "marketing";
  metadata?: Record<string, any>;
  bundleId?: number; // Optional document bundle to attach
}

export interface EmailListParams {
  partyId: number;
  direction?: EmailDirection;
  status?: EmailStatus;
  category?: "transactional" | "marketing";
  limit?: number;
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS & FOLLOW-UPS - Calendar events and reminders
// ─────────────────────────────────────────────────────────────────────────────

export type EventKind =
  | "FOLLOW_UP"       // Generic follow-up reminder
  | "MEETING"         // In-person or virtual meeting
  | "CALL"            // Scheduled call
  | "VISIT"           // In-person visit
  | "CUSTOM";
// Lowercase aliases for frontend convenience
export type EventKindLower = "follow_up" | "meeting" | "call" | "visit" | "custom";

export type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface PartyEvent {
  id: ID;
  partyId: number;
  kind: EventKind;
  title: string;
  description?: string;
  scheduledAt: string; // ISO datetime
  dueDate?: string; // ISO date (for tasks without specific time)
  completedAt?: string;
  status: EventStatus;
  reminderMinutesBefore?: number; // e.g., 30 = remind 30 min before
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: number;
}

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringPattern {
  frequency: RecurringFrequency;
  interval: number; // e.g., 1 = every week, 2 = every 2 weeks
  endDate?: string; // ISO date
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface CreatePartyEventInput {
  partyId: number;
  kind: EventKind;
  title: string;
  description?: string;
  scheduledAt?: string;
  dueDate?: string;
  reminderMinutesBefore?: number;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  metadata?: Record<string, any>;
}

export interface UpdatePartyEventInput {
  title?: string;
  description?: string;
  scheduledAt?: string;
  dueDate?: string;
  status?: EventStatus;
  reminderMinutesBefore?: number;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  metadata?: Record<string, any>;
}

export interface EventListParams {
  partyId?: number;
  kinds?: EventKind[];
  status?: EventStatus;
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONES - Automated date-based reminders
// ─────────────────────────────────────────────────────────────────────────────

export type MilestoneKind =
  | "BIRTHDAY"              // Contact's birthday
  | "CUSTOMER_ANNIVERSARY"  // Anniversary of becoming a customer
  | "PLACEMENT_ANNIVERSARY" // Anniversary of when they received their animal
  | "CUSTOM";
// Lowercase aliases for frontend convenience
export type MilestoneKindLower = "birthday" | "customer_anniversary" | "placement_anniversary" | "custom";

export interface PartyMilestone {
  id: ID;
  partyId: number;
  kind: MilestoneKind;
  label: string;
  date: string; // ISO date (recurring annually)
  reminderDaysBefore: number; // e.g., 7 = remind 7 days before
  enabled: boolean;
  lastTriggeredYear?: number; // Year last reminder was sent
  metadata?: Record<string, any>;
  // For offspring-related milestones
  animalId?: number;
  animalName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneInput {
  partyId: number;
  kind: MilestoneKind;
  label: string;
  date: string;
  reminderDaysBefore?: number;
  enabled?: boolean;
  animalId?: number;
  metadata?: Record<string, any>;
}

export interface UpdateMilestoneInput {
  label?: string;
  date?: string;
  reminderDaysBefore?: number;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD INTEGRATION - Follow-up tasks for dashboard
// ─────────────────────────────────────────────────────────────────────────────

export type ContactTaskKind =
  | "follow_up"
  | "milestone"
  | "event"
  | "overdue_invoice";

export interface ContactDashboardTask {
  id: string;
  kind: ContactTaskKind;
  title: string;
  description?: string;
  partyId: number;
  partyName: string;
  partyKind: "CONTACT" | "ORGANIZATION";
  dueDate: string; // ISO date
  severity: "info" | "warning" | "overdue";
  // For linking
  eventId?: ID;
  milestoneId?: ID;
  invoiceId?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD STATUS PIPELINE (lightweight)
// ─────────────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "won"
  | "lost"
  | "inactive";

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; order: number }> = {
  new: { label: "New", color: "blue", order: 1 },
  contacted: { label: "Contacted", color: "purple", order: 2 },
  qualified: { label: "Qualified", color: "cyan", order: 3 },
  negotiating: { label: "Negotiating", color: "amber", order: 4 },
  won: { label: "Won", color: "green", order: 5 },
  lost: { label: "Lost", color: "red", order: 6 },
  inactive: { label: "Inactive", color: "gray", order: 7 },
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGING HUB - Send emails to any address with optional party linking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extended email input for MessagingHub - supports sending without a party association
 */
export interface SendEmailInputV2 {
  partyId?: number | null;       // Optional - null for unlinked emails
  toAddresses: string[];         // Required recipient email(s)
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  templateKey?: string;
  category?: "transactional" | "marketing";
  metadata?: Record<string, any>;
  bundleId?: number;
}

/**
 * Unlinked email - sent to addresses not associated with a contact/org
 */
export interface UnlinkedEmail {
  id: ID;
  tenantId: number;
  toAddresses: string[];
  fromAddress: string;
  subject: string;
  bodyPreview?: string;
  bodyText?: string;
  bodyHtml?: string;
  status: EmailStatus;
  direction: EmailDirection;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  // Reconciliation fields
  linkedPartyId?: number | null;
  linkedAt?: string | null;
  linkedPartyName?: string | null;
  linkedPartyKind?: "CONTACT" | "ORGANIZATION" | null;
}

/**
 * Response from email-to-party lookup
 */
export interface EmailLookupMatch {
  email: string;
  partyId: number;
  partyKind: "CONTACT" | "ORGANIZATION";
  partyName: string;
}

export interface EmailLookupResponse {
  matches: EmailLookupMatch[];
  unmatched: string[];
}

/**
 * Params for listing unlinked emails
 */
export interface UnlinkedEmailListParams {
  limit?: number;
  offset?: number;
  linkedStatus?: "linked" | "unlinked" | "all";
}

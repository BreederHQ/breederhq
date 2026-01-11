// packages/api/src/resources/party-crm.ts
// API resources for CRM features: notes, activity feed, emails, events, milestones

import type { Http } from "../http";
import type { ListResponse, ID } from "../types/common";
import type {
  PartyNote,
  CreatePartyNoteInput,
  UpdatePartyNoteInput,
  ActivityItem,
  ActivityListParams,
  PartyEmail,
  SendEmailInput,
  EmailListParams,
  PartyEvent,
  CreatePartyEventInput,
  UpdatePartyEventInput,
  EventListParams,
  PartyMilestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  ContactDashboardTask,
} from "../types/party-crm";

// ─────────────────────────────────────────────────────────────────────────────
// Notes Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyNotesResource = {
  list(partyId: number): Promise<ListResponse<PartyNote>>;
  create(input: CreatePartyNoteInput): Promise<PartyNote>;
  update(partyId: number, noteId: ID, input: UpdatePartyNoteInput): Promise<PartyNote>;
  delete(partyId: number, noteId: ID): Promise<{ success: true }>;
  pin(partyId: number, noteId: ID, pinned: boolean): Promise<PartyNote>;
};

export function makePartyNotes(http: Http): PartyNotesResource {
  return {
    async list(partyId: number): Promise<ListResponse<PartyNote>> {
      const res = await http.get(`/api/v1/parties/${partyId}/notes`);
      return normalizeList(res, "notes");
    },
    async create(input: CreatePartyNoteInput): Promise<PartyNote> {
      const res = await http.post(`/api/v1/parties/${input.partyId}/notes`, input);
      return res.note || res;
    },
    async update(partyId: number, noteId: ID, input: UpdatePartyNoteInput): Promise<PartyNote> {
      const res = await http.patch(`/api/v1/parties/${partyId}/notes/${noteId}`, input);
      return res.note || res;
    },
    async delete(partyId: number, noteId: ID): Promise<{ success: true }> {
      await http.delete(`/api/v1/parties/${partyId}/notes/${noteId}`);
      return { success: true };
    },
    async pin(partyId: number, noteId: ID, pinned: boolean): Promise<PartyNote> {
      const res = await http.patch(`/api/v1/parties/${partyId}/notes/${noteId}`, { pinned });
      return res.note || res;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Feed Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyActivityResource = {
  list(params: ActivityListParams): Promise<ListResponse<ActivityItem>>;
  // Activity items are system-generated, no create/update/delete
};

function buildActivityQuery(params: ActivityListParams): string {
  const sp = new URLSearchParams();
  if (params.kinds?.length) sp.set("kinds", params.kinds.join(","));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function makePartyActivity(http: Http): PartyActivityResource {
  return {
    async list(params: ActivityListParams): Promise<ListResponse<ActivityItem>> {
      const res = await http.get(`/api/v1/parties/${params.partyId}/activity${buildActivityQuery(params)}`);
      return normalizeList(res, "activity");
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyEmailsResource = {
  list(params: EmailListParams): Promise<ListResponse<PartyEmail>>;
  send(input: SendEmailInput): Promise<PartyEmail>;
};

function buildEmailQuery(params: EmailListParams): string {
  const sp = new URLSearchParams();
  if (params.direction) sp.set("direction", params.direction);
  if (params.status) sp.set("status", params.status);
  if (params.category) sp.set("category", params.category);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function makePartyEmails(http: Http): PartyEmailsResource {
  return {
    async list(params: EmailListParams): Promise<ListResponse<PartyEmail>> {
      const res = await http.get(`/api/v1/parties/${params.partyId}/emails${buildEmailQuery(params)}`);
      return normalizeList(res, "emails");
    },
    async send(input: SendEmailInput): Promise<PartyEmail> {
      const res = await http.post(`/api/v1/parties/${input.partyId}/emails`, input);
      return res.email || res;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Events Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyEventsResource = {
  list(params: EventListParams): Promise<ListResponse<PartyEvent>>;
  create(input: CreatePartyEventInput): Promise<PartyEvent>;
  update(partyId: number, eventId: ID, input: UpdatePartyEventInput): Promise<PartyEvent>;
  delete(partyId: number, eventId: ID): Promise<{ success: true }>;
  complete(partyId: number, eventId: ID): Promise<PartyEvent>;
};

function buildEventQuery(params: EventListParams): string {
  const sp = new URLSearchParams();
  if (params.kinds?.length) sp.set("kinds", params.kinds.join(","));
  if (params.status) sp.set("status", params.status);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function makePartyEvents(http: Http): PartyEventsResource {
  return {
    async list(params: EventListParams): Promise<ListResponse<PartyEvent>> {
      const res = await http.get(`/api/v1/parties/${params.partyId}/events${buildEventQuery(params)}`);
      return normalizeList(res, "events");
    },
    async create(input: CreatePartyEventInput): Promise<PartyEvent> {
      const res = await http.post(`/api/v1/parties/${input.partyId}/events`, input);
      return res.event || res;
    },
    async update(partyId: number, eventId: ID, input: UpdatePartyEventInput): Promise<PartyEvent> {
      const res = await http.patch(`/api/v1/parties/${partyId}/events/${eventId}`, input);
      return res.event || res;
    },
    async delete(partyId: number, eventId: ID): Promise<{ success: true }> {
      await http.delete(`/api/v1/parties/${partyId}/events/${eventId}`);
      return { success: true };
    },
    async complete(partyId: number, eventId: ID): Promise<PartyEvent> {
      const res = await http.post(`/api/v1/parties/${partyId}/events/${eventId}/complete`, {});
      return res.event || res;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestones Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyMilestonesResource = {
  list(partyId: number): Promise<ListResponse<PartyMilestone>>;
  create(input: CreateMilestoneInput): Promise<PartyMilestone>;
  update(partyId: number, milestoneId: ID, input: UpdateMilestoneInput): Promise<PartyMilestone>;
  delete(partyId: number, milestoneId: ID): Promise<{ success: true }>;
};

export function makePartyMilestones(http: Http): PartyMilestonesResource {
  return {
    async list(partyId: number): Promise<ListResponse<PartyMilestone>> {
      const res = await http.get(`/api/v1/parties/${partyId}/milestones`);
      return normalizeList(res, "milestones");
    },
    async create(input: CreateMilestoneInput): Promise<PartyMilestone> {
      const res = await http.post(`/api/v1/parties/${input.partyId}/milestones`, input);
      return res.milestone || res;
    },
    async update(partyId: number, milestoneId: ID, input: UpdateMilestoneInput): Promise<PartyMilestone> {
      const res = await http.patch(`/api/v1/parties/${partyId}/milestones/${milestoneId}`, input);
      return res.milestone || res;
    },
    async delete(partyId: number, milestoneId: ID): Promise<{ success: true }> {
      await http.delete(`/api/v1/parties/${partyId}/milestones/${milestoneId}`);
      return { success: true };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Tasks Resource (contact follow-ups for dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export type ContactTasksResource = {
  /** Get all pending contact tasks (follow-ups, milestones, events) for dashboard */
  list(params?: { from?: string; to?: string; limit?: number }): Promise<ContactDashboardTask[]>;
  /** Mark a task as complete */
  complete(taskId: string): Promise<{ success: true }>;
};

export function makeContactTasks(http: Http): ContactTasksResource {
  return {
    async list(params = {}): Promise<ContactDashboardTask[]> {
      const sp = new URLSearchParams();
      if (params.from) sp.set("from", params.from);
      if (params.to) sp.set("to", params.to);
      if (params.limit != null) sp.set("limit", String(params.limit));
      const q = sp.toString();
      const res = await http.get(`/api/v1/dashboard/contact-tasks${q ? `?${q}` : ""}`);
      // Backend returns array directly
      return Array.isArray(res) ? res : [];
    },
    async complete(taskId: string): Promise<{ success: true }> {
      await http.post(`/api/v1/dashboard/contact-tasks/${taskId}/complete`, {});
      return { success: true };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Party CRM Resource
// ─────────────────────────────────────────────────────────────────────────────

export type PartyCrmResource = {
  notes: PartyNotesResource;
  activity: PartyActivityResource;
  emails: PartyEmailsResource;
  events: PartyEventsResource;
  milestones: PartyMilestonesResource;
  dashboardTasks: ContactTasksResource;
};

export function makePartyCrm(http: Http): PartyCrmResource {
  return {
    notes: makePartyNotes(http),
    activity: makePartyActivity(http),
    emails: makePartyEmails(http),
    events: makePartyEvents(http),
    milestones: makePartyMilestones(http),
    dashboardTasks: makeContactTasks(http),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeList<T>(res: any, key?: string): ListResponse<T> {
  // Backend returns { [key]: [...] } format (e.g., { notes: [...] })
  if (key && res && typeof res === "object" && key in res) {
    const items = res[key] as T[];
    return { items, total: items.length };
  }
  if (Array.isArray(res)) {
    return { items: res as T[], total: res.length };
  }
  if (res && typeof res === "object") {
    if ("items" in res && "total" in res) {
      return res as ListResponse<T>;
    }
    if ("results" in res) {
      const items = (res as any).results as T[];
      const total = Number((res as any).total ?? items.length);
      return { items, total };
    }
    if ("data" in res) {
      const data = (res as any).data;
      if (Array.isArray(data)) {
        return { items: data as T[], total: data.length };
      }
      if (data && "items" in data) {
        return { items: data.items as T[], total: Number(data.total ?? data.items.length) };
      }
    }
  }
  return { items: [], total: 0 };
}

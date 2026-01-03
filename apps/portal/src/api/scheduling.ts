// apps/portal/src/api/scheduling.ts
// Scheduling API adapter for portal client booking flow.
// All endpoints are placeholders - backend will wire these later.
// This file isolates all scheduling API calls in one place.

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */

export interface SchedulingEventContext {
  eventId: string;
  eventType: string; // e.g., "Pickup", "Meet and Greet", "Vet Visit"
  breederName: string;
  breederId: number;
  // Subject context (offspring/placement/agreement)
  subjectName: string | null;
  subjectType: "offspring" | "placement" | "agreement" | "transaction" | null;
  subjectId: number | null;
}

export interface BookingRules {
  canCancel: boolean;
  canReschedule: boolean;
  cancellationDeadlineHours: number | null;
  rescheduleDeadlineHours: number | null;
  // Computed deadline timestamps (ISO 8601, relative to slot start)
  cancelDeadlineAt: string | null;
  rescheduleDeadlineAt: string | null;
}

// Machine-readable reason codes for blocked states
export type BlockedReasonCode =
  | "NOT_ELIGIBLE"
  | "WINDOW_NOT_OPEN"
  | "FULLY_BOOKED"
  | "DEADLINE_PASSED"
  | "EVENT_CANCELLED"
  | "ALREADY_BOOKED";

export interface BlockedResponse {
  code: BlockedReasonCode;
  message: string;
  context: {
    eventId?: string;
    slotId?: string;
    opensAt?: string;
    deadlineAt?: string;
  };
}

export interface SchedulingEventStatus {
  isOpen: boolean;
  isEligible: boolean;
  eligibilityReason: string | null; // null if eligible, reason string if not
  hasExistingBooking: boolean;
  existingBooking: ConfirmedBooking | null;
  // Blocked state with machine-readable code (null if not blocked)
  blocked: BlockedResponse | null;
}

export interface SchedulingSlot {
  slotId: string;
  startsAt: string; // ISO 8601 timestamp (canonical UTC)
  endsAt: string; // ISO 8601 timestamp (canonical UTC)
  location: string | null; // Optional: address or "Virtual" etc.
  mode: "in_person" | "virtual" | null;
}

export interface ConfirmedBooking {
  bookingId: string;
  eventId: string;
  slotId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  mode: "in_person" | "virtual" | null;
  confirmedAt: string;
  // Next steps text from breeder
  nextSteps: string | null;
}

export type BookingResult =
  | { status: "confirmed"; booking: ConfirmedBooking }
  | { status: "slot_taken"; message: string }
  | { status: "eligibility_changed"; message: string }
  | { status: "error"; message: string };

export type CancelResult =
  | { status: "cancelled" }
  | { status: "not_allowed"; message: string }
  | { status: "error"; message: string };

export type RescheduleResult =
  | { status: "confirmed"; booking: ConfirmedBooking }
  | { status: "slot_taken"; message: string }
  | { status: "not_allowed"; message: string }
  | { status: "error"; message: string };

export interface SchedulingEventResponse {
  context: SchedulingEventContext;
  rules: BookingRules;
  eventStatus: SchedulingEventStatus;
}

// Discovery endpoint types
export interface DiscoveryEventItem {
  eventId: string;
  eventType: string;
  label: string;
  mode: "in_person" | "virtual" | "mixed" | null;
  locationSummary: string | null;
  bookingRules: BookingRules;
  existingBooking: ConfirmedBooking | null;
}

export interface DiscoveryResponse {
  offspringGroupId: number;
  offspringGroupName: string | null;
  events: DiscoveryEventItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * API Base URL (same pattern as taskSources.ts)
 * ──────────────────────────────────────────────────────────────────────────── */

function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

/* ────────────────────────────────────────────────────────────────────────────
 * Fetch Helper
 * ──────────────────────────────────────────────────────────────────────────── */

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const base = getApiBase();
  const url = `${base}${path}`;

  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }

    // Try to extract error message from response
    let message = `HTTP ${res.status}`;
    try {
      const errorData = await res.json();
      message = errorData?.error?.message || errorData?.message || message;
    } catch {
      // Ignore parse errors
    }

    return { ok: false, status: res.status, message };
  } catch (err: any) {
    return { ok: false, status: 0, message: err?.message || "Network error" };
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Scheduling API Functions
 *
 * Endpoints:
 * - GET  /api/v1/portal/scheduling/offspring-groups/:offspringGroupId/events (discovery)
 * - GET  /api/v1/portal/scheduling/events/:eventId
 * - GET  /api/v1/portal/scheduling/events/:eventId/slots
 * - POST /api/v1/portal/scheduling/events/:eventId/book
 * - POST /api/v1/portal/scheduling/events/:eventId/cancel
 * - POST /api/v1/portal/scheduling/events/:eventId/reschedule
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Discover available scheduling events for an offspring group.
 * Returns list of bookable events with context and existing bookings.
 */
export async function discoverSchedulingEvents(
  offspringGroupId: number
): Promise<{ ok: true; data: DiscoveryResponse } | { ok: false; status: number; message: string }> {
  return apiFetch<DiscoveryResponse>(`/api/v1/portal/scheduling/offspring-groups/${offspringGroupId}/events`);
}

/**
 * Get scheduling event details, rules, and current status.
 * Returns event context (type, breeder, subject), booking rules, and eligibility.
 */
export async function getSchedulingEvent(
  eventId: string
): Promise<{ ok: true; data: SchedulingEventResponse } | { ok: false; status: number; message: string }> {
  return apiFetch<SchedulingEventResponse>(`/api/v1/portal/scheduling/events/${eventId}`);
}

/**
 * List available slots for booking.
 * Only returns slots the current user can book (server filters by eligibility and capacity).
 */
export async function listAvailableSlots(
  eventId: string
): Promise<{ ok: true; data: { slots: SchedulingSlot[] } } | { ok: false; status: number; message: string }> {
  return apiFetch<{ slots: SchedulingSlot[] }>(`/api/v1/portal/scheduling/events/${eventId}/slots`);
}

/**
 * Book a specific slot.
 * Atomic operation - either confirms booking or returns rejection reason.
 */
export async function bookSlot(
  eventId: string,
  slotId: string
): Promise<BookingResult> {
  const result = await apiFetch<{ booking?: ConfirmedBooking; error?: string; code?: string }>(
    `/api/v1/portal/scheduling/events/${eventId}/book`,
    {
      method: "POST",
      body: JSON.stringify({ slotId }),
    }
  );

  if (result.ok && result.data.booking) {
    return { status: "confirmed", booking: result.data.booking };
  }

  if (!result.ok) {
    // Map HTTP status codes to specific outcomes
    if (result.status === 409) {
      return { status: "slot_taken", message: result.message || "This time slot is no longer available." };
    }
    if (result.status === 403) {
      return { status: "eligibility_changed", message: result.message || "You are no longer eligible for this appointment." };
    }
    return { status: "error", message: result.message };
  }

  // Unexpected response shape
  return { status: "error", message: "Unexpected response from server." };
}

/**
 * Cancel an existing booking.
 * Only available if rules.canCancel is true and within deadline.
 */
export async function cancelBooking(
  eventId: string
): Promise<CancelResult> {
  const result = await apiFetch<{ cancelled?: boolean; error?: string }>(
    `/api/v1/portal/scheduling/events/${eventId}/cancel`,
    { method: "POST" }
  );

  if (result.ok && result.data.cancelled) {
    return { status: "cancelled" };
  }

  if (!result.ok) {
    if (result.status === 403) {
      return { status: "not_allowed", message: result.message || "Cancellation is not allowed." };
    }
    return { status: "error", message: result.message };
  }

  return { status: "error", message: "Unexpected response from server." };
}

/**
 * Reschedule an existing booking to a new slot.
 * Only available if rules.canReschedule is true and within deadline.
 */
export async function rescheduleBooking(
  eventId: string,
  newSlotId: string
): Promise<RescheduleResult> {
  const result = await apiFetch<{ booking?: ConfirmedBooking; error?: string; code?: string }>(
    `/api/v1/portal/scheduling/events/${eventId}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify({ slotId: newSlotId }),
    }
  );

  if (result.ok && result.data.booking) {
    return { status: "confirmed", booking: result.data.booking };
  }

  if (!result.ok) {
    if (result.status === 409) {
      return { status: "slot_taken", message: result.message || "This time slot is no longer available." };
    }
    if (result.status === 403) {
      return { status: "not_allowed", message: result.message || "Rescheduling is not allowed." };
    }
    return { status: "error", message: result.message };
  }

  return { status: "error", message: "Unexpected response from server." };
}

/* ────────────────────────────────────────────────────────────────────────────
 * UI Message Helpers
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Maps backend reason codes to deterministic UI messages.
 * Use this for displaying blocked states to users.
 */
export function getBlockedMessage(blocked: BlockedResponse | null): string | null {
  if (!blocked) return null;

  const messages: Record<BlockedReasonCode, string> = {
    NOT_ELIGIBLE: "You are not eligible for this appointment.",
    WINDOW_NOT_OPEN: blocked.context.opensAt
      ? `Booking opens ${formatDeadlineForDisplay(blocked.context.opensAt)}.`
      : "Booking is not yet open for this event.",
    FULLY_BOOKED: "All available time slots have been filled.",
    DEADLINE_PASSED: blocked.context.deadlineAt
      ? `The booking deadline was ${formatDeadlineForDisplay(blocked.context.deadlineAt)}.`
      : "The booking deadline has passed.",
    EVENT_CANCELLED: "This event has been cancelled.",
    ALREADY_BOOKED: "You already have a booking for this event.",
  };

  return messages[blocked.code] || blocked.message;
}

/**
 * Formats a deadline timestamp for display in the user's local timezone.
 */
export function formatDeadlineForDisplay(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    // If within 24 hours, show relative time
    if (diffHours > 0 && diffHours <= 24) {
      return `in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
    }
    if (diffHours < 0 && diffHours >= -24) {
      const absHours = Math.abs(diffHours);
      return `${absHours} hour${absHours === 1 ? "" : "s"} ago`;
    }

    // Otherwise show formatted date/time in local timezone
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoTimestamp;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Mock Data (for demo mode only)
 * ──────────────────────────────────────────────────────────────────────────── */

export function getMockSchedulingEvent(eventId: string): SchedulingEventResponse {
  // Compute mock deadline timestamps (24 hours before a hypothetical slot 3 days from now)
  const mockSlotStart = new Date();
  mockSlotStart.setDate(mockSlotStart.getDate() + 3);
  mockSlotStart.setHours(10, 0, 0, 0);
  const cancelDeadline = new Date(mockSlotStart.getTime() - 24 * 60 * 60 * 1000);
  const rescheduleDeadline = new Date(mockSlotStart.getTime() - 24 * 60 * 60 * 1000);

  return {
    context: {
      eventId,
      eventType: "Pickup Appointment",
      breederName: "Sarah Thompson",
      breederId: 100,
      subjectName: "Bella",
      subjectType: "offspring",
      subjectId: 101,
    },
    rules: {
      canCancel: true,
      canReschedule: true,
      cancellationDeadlineHours: 24,
      rescheduleDeadlineHours: 24,
      cancelDeadlineAt: cancelDeadline.toISOString(),
      rescheduleDeadlineAt: rescheduleDeadline.toISOString(),
    },
    eventStatus: {
      isOpen: true,
      isEligible: true,
      eligibilityReason: null,
      hasExistingBooking: false,
      existingBooking: null,
      blocked: null,
    },
  };
}

export function getMockSlots(): SchedulingSlot[] {
  // Generate slots for the next 7 days, 3 slots per day
  const slots: SchedulingSlot[] = [];
  const now = new Date();

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    // Morning slot: 10:00 AM
    const morning = new Date(date);
    morning.setHours(10, 0, 0, 0);
    slots.push({
      slotId: `slot-${dayOffset}-1`,
      startsAt: morning.toISOString(),
      endsAt: new Date(morning.getTime() + 60 * 60 * 1000).toISOString(),
      location: "123 Breeder Lane, Springfield, IL",
      mode: "in_person",
    });

    // Afternoon slot: 2:00 PM
    const afternoon = new Date(date);
    afternoon.setHours(14, 0, 0, 0);
    slots.push({
      slotId: `slot-${dayOffset}-2`,
      startsAt: afternoon.toISOString(),
      endsAt: new Date(afternoon.getTime() + 60 * 60 * 1000).toISOString(),
      location: "123 Breeder Lane, Springfield, IL",
      mode: "in_person",
    });

    // Evening slot: 5:00 PM (virtual)
    const evening = new Date(date);
    evening.setHours(17, 0, 0, 0);
    slots.push({
      slotId: `slot-${dayOffset}-3`,
      startsAt: evening.toISOString(),
      endsAt: new Date(evening.getTime() + 30 * 60 * 1000).toISOString(),
      location: null,
      mode: "virtual",
    });
  }

  return slots;
}

export function getMockConfirmedBooking(slotId: string, slot: SchedulingSlot): ConfirmedBooking {
  return {
    bookingId: `booking-${Date.now()}`,
    eventId: "demo",
    slotId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: slot.location,
    mode: slot.mode,
    confirmedAt: new Date().toISOString(),
    nextSteps: "Please arrive 10 minutes early. Bring a secure carrier for safe transport. If you have any questions, contact us through the Messages page.",
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * ICS Calendar Generation (client-side)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface IcsCalendarData {
  eventType: string;
  breederName: string;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  location: string | null;
  mode: "in_person" | "virtual" | null;
  nextSteps: string | null;
  bookingId: string;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildIcsLocation(location: string | null, mode: "in_person" | "virtual" | null): string {
  if (mode === "virtual") return "Virtual Meeting";
  return location || "Location to be confirmed";
}

function buildIcsDescription(data: IcsCalendarData): string {
  const parts: string[] = [];
  parts.push(`Your ${data.eventType} appointment is confirmed.`);
  parts.push("");
  parts.push(`With: ${data.breederName}`);
  if (data.mode === "virtual") {
    parts.push("Mode: Virtual Meeting");
  } else if (data.location) {
    parts.push(`Location: ${data.location}`);
  }
  if (data.nextSteps) {
    parts.push("");
    parts.push("Next Steps:");
    parts.push(data.nextSteps);
  }
  parts.push("");
  parts.push("Managed via BreederHQ Client Portal");
  return parts.join("\n");
}

/**
 * Generate ICS calendar content for a booking.
 */
export function generateBookingIcs(data: IcsCalendarData): string {
  const uid = `booking-${data.bookingId}@breederhq.com`;
  const dtstamp = formatIcsDateTime(new Date());
  const dtstart = formatIcsDateTime(new Date(data.startsAt));
  const dtend = formatIcsDateTime(new Date(data.endsAt));
  const location = escapeIcsText(buildIcsLocation(data.location, data.mode));
  const description = escapeIcsText(buildIcsDescription(data));
  const summary = escapeIcsText(`${data.eventType} with ${data.breederName}`);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BreederHQ//Client Portal//EN",
    "METHOD:PUBLISH",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${data.eventType} with ${data.breederName}`,
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/**
 * Download ICS file for a booking.
 */
export function downloadBookingIcs(data: IcsCalendarData): void {
  const icsContent = generateBookingIcs(data);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `appointment-${data.bookingId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// apps/portal/src/api/scheduling.ts
// Scheduling API adapter for portal client booking flow.
// All endpoints are placeholders - backend will wire these later.
// This file isolates all scheduling API calls in one place.

import { buildApiPath, getTenantSlug } from "../derived/tenantContext";

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
  | "ALREADY_BOOKED"
  // Phase 6: Placement order gating
  | "PLACEMENT_WINDOW_NOT_OPEN"
  | "PLACEMENT_WINDOW_CLOSED"
  | "NO_PLACEMENT_RANK";

export interface BlockedResponse {
  code: BlockedReasonCode;
  message: string;
  context: {
    eventId?: string;
    slotId?: string;
    opensAt?: string;
    deadlineAt?: string;
    // Phase 6: Placement window context
    offspringGroupId?: number;
    placementWindowStartAt?: string;
    placementWindowEndAt?: string;
    serverNow?: string;
    timezone?: string;
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
  // Phase 6: Placement blocking info (null if not blocked)
  placementBlocked: BlockedResponse | null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Fetch Helper
 * ──────────────────────────────────────────────────────────────────────────── */

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  // Use buildApiPath to get the URL (includes tenant slug in path)
  const tenantSlug = getTenantSlug();
  const url = buildApiPath(endpoint, tenantSlug);

  // Build headers
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> || {}),
      },
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
  return apiFetch<DiscoveryResponse>(`/portal/scheduling/offspring-groups/${offspringGroupId}/events`);
}

/**
 * Get scheduling event details, rules, and current status.
 * Returns event context (type, breeder, subject), booking rules, and eligibility.
 */
export async function getSchedulingEvent(
  eventId: string
): Promise<{ ok: true; data: SchedulingEventResponse } | { ok: false; status: number; message: string }> {
  return apiFetch<SchedulingEventResponse>(`/portal/scheduling/events/${eventId}`);
}

/**
 * List available slots for booking.
 * Only returns slots the current user can book (server filters by eligibility and capacity).
 * Returns placementBlocked on 403 if placement window gating applies.
 */
export async function listAvailableSlots(
  eventId: string
): Promise<
  | { ok: true; data: { slots: SchedulingSlot[] } }
  | { ok: false; status: number; message: string; placementBlocked?: BlockedResponse }
> {
  const tenantSlug = getTenantSlug();
  const url = buildApiPath(`/portal/scheduling/events/${eventId}/slots`, tenantSlug);

  // Build headers
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  try {
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }

    // Handle 403 with placement blocking info
    if (res.status === 403) {
      try {
        const errorData = await res.json();
        if (
          errorData?.code &&
          (errorData.code === "PLACEMENT_WINDOW_NOT_OPEN" ||
            errorData.code === "PLACEMENT_WINDOW_CLOSED" ||
            errorData.code === "NO_PLACEMENT_RANK")
        ) {
          return {
            ok: false,
            status: 403,
            message: errorData.message || "Placement window not available",
            placementBlocked: errorData as BlockedResponse,
          };
        }
        return { ok: false, status: 403, message: errorData?.message || "Not authorized" };
      } catch {
        return { ok: false, status: 403, message: "Not authorized" };
      }
    }

    let message = `HTTP ${res.status}`;
    try {
      const errorData = await res.json();
      message = errorData?.message || message;
    } catch {
      // Ignore parse errors
    }
    return { ok: false, status: res.status, message };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Network error";
    return { ok: false, status: 0, message: errMessage };
  }
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
    `/portal/scheduling/events/${eventId}/book`,
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
    `/portal/scheduling/events/${eventId}/cancel`,
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
    `/portal/scheduling/events/${eventId}/reschedule`,
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
    // Phase 6: Placement order gating
    PLACEMENT_WINDOW_NOT_OPEN: "Your scheduling window hasn't opened yet. Please wait until your turn.",
    PLACEMENT_WINDOW_CLOSED: "Your scheduling window has closed.",
    NO_PLACEMENT_RANK: "You don't have a placement rank for this litter. Please contact your breeder.",
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

/* ────────────────────────────────────────────────────────────────────────────
 * Phase 6: Placement Window Formatting
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Format placement window timestamps for display.
 * Returns times in user's local timezone with policy timezone label.
 */
export function formatPlacementWindow(
  startAt: string | undefined,
  endAt: string | undefined,
  timezone: string | undefined
): { startLocal: string | null; endLocal: string | null; policyTimezone: string | null } {
  const formatTime = (iso: string | undefined): string | null => {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return {
    startLocal: formatTime(startAt),
    endLocal: formatTime(endAt),
    policyTimezone: timezone || null,
  };
}

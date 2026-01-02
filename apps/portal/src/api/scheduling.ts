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
}

export interface SchedulingEventStatus {
  isOpen: boolean;
  isEligible: boolean;
  eligibilityReason: string | null; // null if eligible, reason string if not
  hasExistingBooking: boolean;
  existingBooking: ConfirmedBooking | null;
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
 * PLACEHOLDER ENDPOINTS - Backend will implement these:
 * - GET  /api/v1/portal/scheduling/events/:eventId
 * - GET  /api/v1/portal/scheduling/events/:eventId/slots
 * - POST /api/v1/portal/scheduling/events/:eventId/book
 * - POST /api/v1/portal/scheduling/events/:eventId/cancel
 * - POST /api/v1/portal/scheduling/events/:eventId/reschedule
 * ──────────────────────────────────────────────────────────────────────────── */

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
 * Mock Data (for demo mode only)
 * ──────────────────────────────────────────────────────────────────────────── */

export function getMockSchedulingEvent(eventId: string): SchedulingEventResponse {
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
    },
    eventStatus: {
      isOpen: true,
      isEligible: true,
      eligibilityReason: null,
      hasExistingBooking: false,
      existingBooking: null,
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

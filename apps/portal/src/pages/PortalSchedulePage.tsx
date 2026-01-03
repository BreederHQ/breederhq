// apps/portal/src/pages/PortalSchedulePage.tsx
// Client scheduling page with deterministic state machine.
// Allows clients to book breeder-authorized appointments.

import * as React from "react";
import { PageScaffold, SectionHeader } from "../design/PageScaffold";
import { PortalCard, CardRow } from "../design/PortalCard";
import { Button } from "../design/Button";
import { isPortalMockEnabled } from "../dev/mockFlag";
import {
  getSchedulingEvent,
  listAvailableSlots,
  bookSlot,
  cancelBooking,
  rescheduleBooking,
  getMockSchedulingEvent,
  getMockSlots,
  getMockConfirmedBooking,
  downloadBookingIcs,
  type SchedulingEventResponse,
  type SchedulingSlot,
  type ConfirmedBooking,
  type BookingRules,
  type IcsCalendarData,
  type BlockedResponse,
} from "../api/scheduling";
import {
  PlacementWindowBanner,
  isPlacementWindowBlock,
} from "../design/PlacementWindowBanner";

/* ────────────────────────────────────────────────────────────────────────────
 * State Machine Definition
 *
 * States:
 * - LOADING              : Initial load, fetching event and session
 * - BLOCKED_AUTH         : User not authenticated
 * - BLOCKED_TENANT       : User authenticated but wrong tenant
 * - BLOCKED_ELIGIBILITY  : User not eligible for this event
 * - BLOCKED_NOT_OPEN     : Event not open for booking
 * - ELIGIBLE_SELECT_SLOT : User can select a slot
 * - BOOKING_IN_PROGRESS  : Booking request in flight
 * - BOOKING_CONFIRMED    : Booking successful
 * - BOOKING_REJECTED_SLOT_TAKEN           : Slot was taken during booking
 * - BOOKING_REJECTED_ELIGIBILITY_CHANGED  : Eligibility changed during booking
 * - ERROR_NETWORK        : Network failure
 * - ERROR_SYSTEM         : System/server error
 *
 * Transitions:
 * LOADING -> BLOCKED_* | ELIGIBLE_SELECT_SLOT | BOOKING_CONFIRMED | ERROR_*
 * ELIGIBLE_SELECT_SLOT -> BOOKING_IN_PROGRESS
 * BOOKING_IN_PROGRESS -> BOOKING_CONFIRMED | BOOKING_REJECTED_* | ERROR_*
 * BOOKING_REJECTED_SLOT_TAKEN -> ELIGIBLE_SELECT_SLOT (after refetch)
 * BOOKING_REJECTED_ELIGIBILITY_CHANGED -> BLOCKED_ELIGIBILITY
 * ──────────────────────────────────────────────────────────────────────────── */

type ScheduleState =
  | "LOADING"
  | "BLOCKED_AUTH"
  | "BLOCKED_TENANT"
  | "BLOCKED_ELIGIBILITY"
  | "BLOCKED_NOT_OPEN"
  | "ELIGIBLE_SELECT_SLOT"
  | "BOOKING_IN_PROGRESS"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REJECTED_SLOT_TAKEN"
  | "BOOKING_REJECTED_ELIGIBILITY_CHANGED"
  | "ERROR_NETWORK"
  | "ERROR_SYSTEM";

interface SchedulePageState {
  state: ScheduleState;
  eventData: SchedulingEventResponse | null;
  slots: SchedulingSlot[];
  selectedSlotId: string | null;
  confirmedBooking: ConfirmedBooking | null;
  errorMessage: string | null;
  rules: BookingRules | null;
  // Phase 6: Placement blocking info (from slots endpoint 403)
  placementBlocked: BlockedResponse | null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Time Formatting Utilities
 * Always show timezone abbreviation for clarity.
 * ──────────────────────────────────────────────────────────────────────────── */

function formatSlotDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getTimezoneLabel(): string {
  // Get timezone abbreviation or offset
  const date = new Date();
  const timezoneName = Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  return timezoneName || `UTC${date.getTimezoneOffset() > 0 ? "-" : "+"}${Math.abs(date.getTimezoneOffset() / 60)}`;
}

function formatSlotTimeWithTimezone(isoString: string): string {
  return `${formatSlotTime(isoString)} ${getTimezoneLabel()}`;
}

function formatSlotDuration(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  if (durationMinutes >= 60) {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${durationMinutes}m`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Blocked State Card
 * ──────────────────────────────────────────────────────────────────────────── */

interface BlockedCardProps {
  reason: string;
}

function BlockedCard({ reason }: BlockedCardProps) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "var(--portal-space-4)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--portal-error-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <span style={{ fontSize: "24px" }}>!</span>
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-base)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: "0 0 var(--portal-space-2) 0",
          }}
        >
          Booking Unavailable
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          {reason}
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State Card
 * ──────────────────────────────────────────────────────────────────────────── */

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

function ErrorCard({ title, message, onRetry }: ErrorCardProps) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "var(--portal-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--portal-font-size-base)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-error)",
            margin: "0 0 var(--portal-space-2) 0",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            margin: "0 0 var(--portal-space-3) 0",
          }}
        >
          {message}
        </p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Event Context Header
 * ──────────────────────────────────────────────────────────────────────────── */

interface EventContextProps {
  eventType: string;
  breederName: string;
  subjectName: string | null;
}

function EventContext({ eventType, breederName, subjectName }: EventContextProps) {
  return (
    <PortalCard variant="flat" padding="md">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
        <div>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Appointment Type
          </span>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            {eventType}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--portal-space-4)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              With
            </span>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-primary)",
              }}
            >
              {breederName}
            </div>
          </div>
          {subjectName && (
            <div>
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Regarding
              </span>
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-primary)",
                }}
              >
                {subjectName}
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Slot Row
 * ──────────────────────────────────────────────────────────────────────────── */

interface SlotRowProps {
  slot: SchedulingSlot;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
}

function SlotRow({ slot, isSelected, onSelect, isLast }: SlotRowProps) {
  const date = formatSlotDate(slot.startsAt);
  const time = formatSlotTimeWithTimezone(slot.startsAt);
  const duration = formatSlotDuration(slot.startsAt, slot.endsAt);

  return (
    <CardRow onClick={onSelect} isLast={isLast}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
        {/* Radio indicator */}
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: `2px solid ${isSelected ? "var(--portal-accent)" : "var(--portal-border)"}`,
            background: isSelected ? "var(--portal-accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all var(--portal-transition)",
          }}
        >
          {isSelected && (
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--portal-bg)",
              }}
            />
          )}
        </div>

        {/* Slot details */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            {date}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginTop: "2px",
            }}
          >
            {time} ({duration})
          </div>
          {(slot.location || slot.mode) && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginTop: "4px",
              }}
            >
              {slot.mode === "virtual" ? "Virtual appointment" : slot.location}
            </div>
          )}
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Confirmed Booking View
 * ──────────────────────────────────────────────────────────────────────────── */

interface ConfirmedViewProps {
  booking: ConfirmedBooking;
  eventContext: SchedulingEventResponse["context"];
  rules: BookingRules;
  onCancel?: () => void;
  onReschedule?: () => void;
  onAddToCalendar?: () => void;
  cancelInProgress?: boolean;
}

function ConfirmedView({
  booking,
  eventContext,
  rules,
  onCancel,
  onReschedule,
  onAddToCalendar,
  cancelInProgress,
}: ConfirmedViewProps) {
  const date = formatSlotDate(booking.startsAt);
  const time = formatSlotTimeWithTimezone(booking.startsAt);
  const duration = formatSlotDuration(booking.startsAt, booking.endsAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {/* Success message */}
      <PortalCard variant="flat" padding="md">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-3)",
            padding: "var(--portal-space-2)",
            background: "var(--portal-success-soft)",
            borderRadius: "var(--portal-radius-md)",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--portal-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
          <span
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-success)",
            }}
          >
            Appointment Confirmed
          </span>
        </div>

        {/* Booking details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          <div>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Date
            </span>
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {date}
            </div>
          </div>
          <div>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Time
            </span>
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {time} ({duration})
            </div>
          </div>
          {booking.location && (
            <div>
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Location
              </span>
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-primary)",
                }}
              >
                {booking.mode === "virtual" ? "Virtual appointment" : booking.location}
              </div>
            </div>
          )}
          <div>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              With
            </span>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-primary)",
              }}
            >
              {eventContext.breederName}
            </div>
          </div>
        </div>

        {/* Add to Calendar button */}
        {onAddToCalendar && (
          <div style={{ marginTop: "var(--portal-space-3)" }}>
            <Button
              variant="secondary"
              onClick={onAddToCalendar}
              style={{ width: "100%" }}
            >
              Add to Calendar
            </Button>
          </div>
        )}
      </PortalCard>

      {/* Next steps */}
      {booking.nextSteps && (
        <PortalCard variant="flat" padding="md">
          <SectionHeader title="Next Steps" />
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: 0,
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
            }}
          >
            {booking.nextSteps}
          </p>
        </PortalCard>
      )}

      {/* Cancel/Reschedule controls */}
      {(rules.canCancel || rules.canReschedule) && (
        <PortalCard variant="flat" padding="md">
          <SectionHeader title="Manage Appointment" />
          <div style={{ display: "flex", gap: "var(--portal-space-2)", flexWrap: "wrap" }}>
            {rules.canReschedule && onReschedule && (
              <Button variant="secondary" onClick={onReschedule}>
                Reschedule
              </Button>
            )}
            {rules.canCancel && onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={cancelInProgress}
                style={{ color: "var(--portal-error)" }}
              >
                {cancelInProgress ? "Cancelling..." : "Cancel Appointment"}
              </Button>
            )}
          </div>
          {/* Show deadline info with computed timestamp if available */}
          {rules.cancelDeadlineAt ? (
            <p
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                margin: "var(--portal-space-2) 0 0 0",
              }}
            >
              Cancellation deadline: {new Date(rules.cancelDeadlineAt).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : rules.cancellationDeadlineHours ? (
            <p
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                margin: "var(--portal-space-2) 0 0 0",
              }}
            >
              Cancellation must be made at least {rules.cancellationDeadlineHours} hours before the appointment.
            </p>
          ) : null}
        </PortalCard>
      )}

      {/* No cancel/reschedule allowed */}
      {!rules.canCancel && !rules.canReschedule && (
        <PortalCard variant="flat" padding="md">
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
              textAlign: "center",
            }}
          >
            This appointment cannot be cancelled or rescheduled online.
          </p>
        </PortalCard>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Slot Selection View
 * ──────────────────────────────────────────────────────────────────────────── */

interface SlotSelectionViewProps {
  slots: SchedulingSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onConfirm: () => void;
  isBooking: boolean;
}

function SlotSelectionView({
  slots,
  selectedSlotId,
  onSelectSlot,
  onConfirm,
  isBooking,
}: SlotSelectionViewProps) {
  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    const groups: Map<string, SchedulingSlot[]> = new Map();
    for (const slot of slots) {
      const dateKey = formatSlotDate(slot.startsAt);
      const existing = groups.get(dateKey) || [];
      existing.push(slot);
      groups.set(dateKey, existing);
    }
    return groups;
  }, [slots]);

  if (slots.length === 0) {
    return (
      <PortalCard variant="flat" padding="lg">
        <div
          style={{
            textAlign: "center",
            padding: "var(--portal-space-4)",
          }}
        >
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: 0,
            }}
          >
            No available time slots at this time. Please check back later.
          </p>
        </div>
      </PortalCard>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      <SectionHeader title="Select a Time" />

      <PortalCard variant="elevated" padding="none">
        <div style={{ padding: "var(--portal-space-1) 0" }}>
          {slots.map((slot, index) => (
            <SlotRow
              key={slot.slotId}
              slot={slot}
              isSelected={selectedSlotId === slot.slotId}
              onSelect={() => onSelectSlot(slot.slotId)}
              isLast={index === slots.length - 1}
            />
          ))}
        </div>
      </PortalCard>

      {/* Confirm button */}
      <div style={{ marginTop: "var(--portal-space-2)" }}>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={!selectedSlotId || isBooking}
          style={{ width: "100%" }}
        >
          {isBooking ? "Confirming..." : "Confirm Appointment"}
        </Button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading Skeleton
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "80px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Page Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalSchedulePage() {
  // Extract eventId from URL path: /schedule/:eventId
  const eventId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/schedule\/([^/]+)/);
    return match?.[1] || "demo";
  }, []);

  const mockEnabled = isPortalMockEnabled();

  // State machine
  const [pageState, setPageState] = React.useState<SchedulePageState>({
    state: "LOADING",
    eventData: null,
    slots: [],
    selectedSlotId: null,
    confirmedBooking: null,
    errorMessage: null,
    rules: null,
    placementBlocked: null,
  });

  // Transition helper
  const transition = (
    newState: ScheduleState,
    updates: Partial<Omit<SchedulePageState, "state">> = {}
  ) => {
    setPageState((prev) => ({ ...prev, state: newState, ...updates }));
  };

  // Load event and check eligibility
  const loadEvent = React.useCallback(async () => {
    transition("LOADING");

    if (mockEnabled) {
      // Use mock data in demo mode
      const mockEvent = getMockSchedulingEvent(eventId);
      const mockSlots = getMockSlots();

      // Check for existing booking in mock
      if (mockEvent.eventStatus.hasExistingBooking && mockEvent.eventStatus.existingBooking) {
        transition("BOOKING_CONFIRMED", {
          eventData: mockEvent,
          confirmedBooking: mockEvent.eventStatus.existingBooking,
          rules: mockEvent.rules,
        });
      } else {
        transition("ELIGIBLE_SELECT_SLOT", {
          eventData: mockEvent,
          slots: mockSlots,
          rules: mockEvent.rules,
        });
      }
      return;
    }

    // Real API call
    const eventResult = await getSchedulingEvent(eventId);

    if (!eventResult.ok) {
      if (eventResult.status === 401) {
        transition("BLOCKED_AUTH");
        return;
      }
      if (eventResult.status === 403) {
        transition("BLOCKED_TENANT");
        return;
      }
      if (eventResult.status === 0) {
        transition("ERROR_NETWORK", { errorMessage: eventResult.message });
        return;
      }
      transition("ERROR_SYSTEM", { errorMessage: eventResult.message });
      return;
    }

    const eventData = eventResult.data;

    // Check entry conditions
    if (!eventData.eventStatus.isOpen) {
      transition("BLOCKED_NOT_OPEN", { eventData });
      return;
    }

    if (!eventData.eventStatus.isEligible) {
      transition("BLOCKED_ELIGIBILITY", {
        eventData,
        errorMessage: eventData.eventStatus.eligibilityReason,
      });
      return;
    }

    // Check for existing booking
    if (eventData.eventStatus.hasExistingBooking && eventData.eventStatus.existingBooking) {
      transition("BOOKING_CONFIRMED", {
        eventData,
        confirmedBooking: eventData.eventStatus.existingBooking,
        rules: eventData.rules,
      });
      return;
    }

    // Load available slots
    const slotsResult = await listAvailableSlots(eventId);
    if (!slotsResult.ok) {
      // Phase 6: Check for placement blocking on 403
      if (slotsResult.status === 403 && slotsResult.placementBlocked) {
        transition("ELIGIBLE_SELECT_SLOT", {
          eventData,
          slots: [],
          rules: eventData.rules,
          placementBlocked: slotsResult.placementBlocked,
        });
        return;
      }
      if (slotsResult.status === 0) {
        transition("ERROR_NETWORK", { errorMessage: slotsResult.message, eventData });
      } else {
        transition("ERROR_SYSTEM", { errorMessage: slotsResult.message, eventData });
      }
      return;
    }

    transition("ELIGIBLE_SELECT_SLOT", {
      eventData,
      slots: slotsResult.data.slots,
      rules: eventData.rules,
      placementBlocked: null,
    });
  }, [eventId, mockEnabled]);

  // Initial load
  React.useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Handle slot selection
  const handleSelectSlot = (slotId: string) => {
    setPageState((prev) => ({ ...prev, selectedSlotId: slotId }));
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    const { selectedSlotId, eventData, slots } = pageState;
    if (!selectedSlotId) return;

    transition("BOOKING_IN_PROGRESS");

    if (mockEnabled) {
      // Simulate booking in demo mode
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const slot = slots.find((s) => s.slotId === selectedSlotId);
      if (slot) {
        const mockBooking = getMockConfirmedBooking(selectedSlotId, slot);
        transition("BOOKING_CONFIRMED", { confirmedBooking: mockBooking });
      }
      return;
    }

    const result = await bookSlot(eventId, selectedSlotId);

    switch (result.status) {
      case "confirmed":
        transition("BOOKING_CONFIRMED", { confirmedBooking: result.booking });
        break;
      case "slot_taken":
        transition("BOOKING_REJECTED_SLOT_TAKEN", { errorMessage: result.message });
        // Refetch slots after a moment
        setTimeout(() => loadEvent(), 1500);
        break;
      case "eligibility_changed":
        transition("BOOKING_REJECTED_ELIGIBILITY_CHANGED", { errorMessage: result.message });
        break;
      case "error":
        transition("ERROR_SYSTEM", { errorMessage: result.message });
        break;
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (mockEnabled) {
      // In demo mode, just reload to show slot selection
      loadEvent();
      return;
    }

    transition("LOADING");
    const result = await cancelBooking(eventId);

    if (result.status === "cancelled") {
      loadEvent();
    } else if (result.status === "not_allowed") {
      transition("BOOKING_CONFIRMED", { errorMessage: result.message });
    } else {
      transition("ERROR_SYSTEM", { errorMessage: result.message });
    }
  };

  // Handle reschedule (returns to slot selection)
  const handleReschedule = () => {
    setPageState((prev) => ({
      ...prev,
      state: "ELIGIBLE_SELECT_SLOT",
      confirmedBooking: null,
      selectedSlotId: null,
    }));
  };

  // Handle add to calendar (download ICS file)
  const handleAddToCalendar = () => {
    if (!confirmedBooking || !eventData) return;

    const icsData: IcsCalendarData = {
      eventType: eventData.context.eventType,
      breederName: eventData.context.breederName,
      startsAt: confirmedBooking.startsAt,
      endsAt: confirmedBooking.endsAt,
      location: confirmedBooking.location,
      mode: confirmedBooking.mode,
      nextSteps: confirmedBooking.nextSteps,
      bookingId: confirmedBooking.bookingId,
    };

    downloadBookingIcs(icsData);
  };

  // Render based on state
  const { state, eventData, slots, selectedSlotId, confirmedBooking, errorMessage, rules, placementBlocked } = pageState;

  // Determine page title and status
  const getPageTitle = () => {
    if (state === "BOOKING_CONFIRMED") return "Appointment Confirmed";
    if (eventData?.context?.eventType) return eventData.context.eventType;
    return "Schedule Appointment";
  };

  const getPageStatus = (): { status?: "success" | "warning" | "error" | "info"; label?: string } => {
    if (state === "BOOKING_CONFIRMED") return { status: "success", label: "Confirmed" };
    if (state.startsWith("BLOCKED")) return { status: "error", label: "Unavailable" };
    if (state.startsWith("ERROR")) return { status: "error", label: "Error" };
    return {};
  };

  const pageStatus = getPageStatus();

  return (
    <PageScaffold
      title={getPageTitle()}
      subtitle={eventData?.context?.breederName ? `with ${eventData.context.breederName}` : undefined}
      status={pageStatus.status}
      statusLabel={pageStatus.label}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        {/* LOADING */}
        {state === "LOADING" && <LoadingSkeleton />}

        {/* BLOCKED STATES */}
        {state === "BLOCKED_AUTH" && (
          <BlockedCard reason="Sign in required." />
        )}
        {state === "BLOCKED_TENANT" && (
          <BlockedCard reason="Tenant mismatch." />
        )}
        {state === "BLOCKED_ELIGIBILITY" && (
          <BlockedCard reason={errorMessage || "You are not eligible for this appointment."} />
        )}
        {state === "BLOCKED_NOT_OPEN" && (
          <BlockedCard reason="This appointment is not open." />
        )}

        {/* ERROR STATES */}
        {state === "ERROR_NETWORK" && (
          <ErrorCard
            title="Network Error"
            message={errorMessage || "Unable to connect. Please check your connection and try again."}
            onRetry={loadEvent}
          />
        )}
        {state === "ERROR_SYSTEM" && (
          <ErrorCard
            title="System Error"
            message={errorMessage || "Something went wrong. Please try again later."}
            onRetry={loadEvent}
          />
        )}

        {/* BOOKING REJECTED STATES */}
        {state === "BOOKING_REJECTED_SLOT_TAKEN" && (
          <PortalCard variant="flat" padding="md">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--portal-space-2)",
                padding: "var(--portal-space-2)",
                background: "var(--portal-warning-soft)",
                borderRadius: "var(--portal-radius-md)",
              }}
            >
              <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-warning)" }}>
                {errorMessage || "This time slot is no longer available. Please select another time."}
              </span>
            </div>
          </PortalCard>
        )}
        {state === "BOOKING_REJECTED_ELIGIBILITY_CHANGED" && (
          <BlockedCard reason={errorMessage || "Your eligibility has changed. You can no longer book this appointment."} />
        )}

        {/* ELIGIBLE - SLOT SELECTION */}
        {(state === "ELIGIBLE_SELECT_SLOT" || state === "BOOKING_IN_PROGRESS") && eventData && (
          <>
            <EventContext
              eventType={eventData.context.eventType}
              breederName={eventData.context.breederName}
              subjectName={eventData.context.subjectName}
            />
            {/* Phase 6: Placement window blocking banner */}
            {placementBlocked && isPlacementWindowBlock(placementBlocked) && (
              <PlacementWindowBanner blocked={placementBlocked} />
            )}
            {/* Only show slot selection if not placement blocked */}
            {!placementBlocked && (
              <SlotSelectionView
                slots={slots}
                selectedSlotId={selectedSlotId}
                onSelectSlot={handleSelectSlot}
                onConfirm={handleConfirmBooking}
                isBooking={state === "BOOKING_IN_PROGRESS"}
              />
            )}
          </>
        )}

        {/* BOOKING CONFIRMED */}
        {state === "BOOKING_CONFIRMED" && confirmedBooking && eventData && rules && (
          <>
            <EventContext
              eventType={eventData.context.eventType}
              breederName={eventData.context.breederName}
              subjectName={eventData.context.subjectName}
            />
            <ConfirmedView
              booking={confirmedBooking}
              eventContext={eventData.context}
              rules={rules}
              onCancel={rules.canCancel ? handleCancel : undefined}
              onReschedule={rules.canReschedule ? handleReschedule : undefined}
              onAddToCalendar={handleAddToCalendar}
            />
          </>
        )}
      </div>
    </PageScaffold>
  );
}

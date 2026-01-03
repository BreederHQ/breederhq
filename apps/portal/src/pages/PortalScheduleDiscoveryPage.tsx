// apps/portal/src/pages/PortalScheduleDiscoveryPage.tsx
// Discovers and lists available scheduling events for an offspring group.
// Route: /schedule/group/:offspringGroupId

import * as React from "react";
import { PageScaffold, SectionHeader } from "../design/PageScaffold";
import { PortalCard, CardRow } from "../design/PortalCard";
import { Button } from "../design/Button";
import {
  discoverSchedulingEvents,
  type DiscoveryResponse,
  type DiscoveryEventItem,
} from "../api/scheduling";
import {
  PlacementWindowBanner,
  isPlacementWindowBlock,
} from "../design/PlacementWindowBanner";

/* ────────────────────────────────────────────────────────────────────────────
 * State Machine
 * ──────────────────────────────────────────────────────────────────────────── */

type PageState =
  | "LOADING"
  | "LOADED"
  | "ERROR_NOT_ELIGIBLE"
  | "ERROR_NOT_FOUND"
  | "ERROR_NETWORK"
  | "ERROR_SYSTEM";

interface DiscoveryPageState {
  state: PageState;
  discovery: DiscoveryResponse | null;
  errorMessage: string | null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Event Card
 * ──────────────────────────────────────────────────────────────────────────── */

interface EventCardProps {
  event: DiscoveryEventItem;
  isLast: boolean;
}

function EventCard({ event, isLast }: EventCardProps) {
  const hasBooking = !!event.existingBooking;

  const handleClick = () => {
    window.history.pushState({}, "", `/schedule/${event.eventId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <CardRow onClick={handleClick} isLast={isLast}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
        {/* Status indicator */}
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: hasBooking ? "var(--portal-success)" : "var(--portal-accent)",
            flexShrink: 0,
          }}
        />

        {/* Event details */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            {event.label || event.eventType}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-secondary)",
              marginTop: "2px",
            }}
          >
            {event.mode === "virtual" ? "Virtual" : event.mode === "in_person" ? "In Person" : ""}
            {event.locationSummary && event.mode !== "virtual" && ` - ${event.locationSummary}`}
          </div>
          {hasBooking && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-success)",
                marginTop: "4px",
                fontWeight: "var(--portal-font-weight-medium)",
              }}
            >
              Booked: {new Date(event.existingBooking!.startsAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div
          style={{
            color: "var(--portal-text-tertiary)",
            fontSize: "var(--portal-font-size-lg)",
          }}
        >
          &rsaquo;
        </div>
      </div>
    </CardRow>
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
            height: "72px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error Card
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
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
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
          No scheduling events are available for this litter at this time.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Page Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalScheduleDiscoveryPage() {
  // Extract offspringGroupId from URL: /schedule/group/:offspringGroupId
  const offspringGroupId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/schedule\/group\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const [pageState, setPageState] = React.useState<DiscoveryPageState>({
    state: "LOADING",
    discovery: null,
    errorMessage: null,
  });

  const loadDiscovery = React.useCallback(async () => {
    if (!offspringGroupId) {
      setPageState({
        state: "ERROR_NOT_FOUND",
        discovery: null,
        errorMessage: "Invalid offspring group ID",
      });
      return;
    }

    setPageState((prev) => ({ ...prev, state: "LOADING" }));

    const result = await discoverSchedulingEvents(offspringGroupId);

    if (!result.ok) {
      if (result.status === 403) {
        setPageState({
          state: "ERROR_NOT_ELIGIBLE",
          discovery: null,
          errorMessage: result.message || "You are not authorized to view scheduling for this litter.",
        });
        return;
      }
      if (result.status === 404) {
        setPageState({
          state: "ERROR_NOT_FOUND",
          discovery: null,
          errorMessage: result.message || "Litter not found.",
        });
        return;
      }
      if (result.status === 0) {
        setPageState({
          state: "ERROR_NETWORK",
          discovery: null,
          errorMessage: result.message,
        });
        return;
      }
      setPageState({
        state: "ERROR_SYSTEM",
        discovery: null,
        errorMessage: result.message,
      });
      return;
    }

    setPageState({
      state: "LOADED",
      discovery: result.data,
      errorMessage: null,
    });
  }, [offspringGroupId]);

  React.useEffect(() => {
    loadDiscovery();
  }, [loadDiscovery]);

  const { state, discovery, errorMessage } = pageState;

  // Determine page title
  const getPageTitle = () => {
    if (discovery?.offspringGroupName) {
      return `Schedule - ${discovery.offspringGroupName}`;
    }
    return "Schedule Appointment";
  };

  return (
    <PageScaffold title={getPageTitle()} subtitle="Select an appointment type">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        {/* LOADING */}
        {state === "LOADING" && <LoadingSkeleton />}

        {/* ERRORS */}
        {state === "ERROR_NOT_ELIGIBLE" && (
          <ErrorCard title="Not Authorized" message={errorMessage || "You are not authorized to view scheduling for this litter."} />
        )}
        {state === "ERROR_NOT_FOUND" && (
          <ErrorCard title="Not Found" message={errorMessage || "Litter not found."} />
        )}
        {state === "ERROR_NETWORK" && (
          <ErrorCard
            title="Network Error"
            message={errorMessage || "Unable to connect. Please check your connection and try again."}
            onRetry={loadDiscovery}
          />
        )}
        {state === "ERROR_SYSTEM" && (
          <ErrorCard
            title="System Error"
            message={errorMessage || "Something went wrong. Please try again later."}
            onRetry={loadDiscovery}
          />
        )}

        {/* LOADED */}
        {state === "LOADED" && discovery && (
          <>
            {/* Phase 6: Placement window blocking banner */}
            {discovery.placementBlocked && isPlacementWindowBlock(discovery.placementBlocked) && (
              <PlacementWindowBanner blocked={discovery.placementBlocked} />
            )}

            {discovery.events.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <SectionHeader title="Available Appointments" />
                <PortalCard variant="elevated" padding="none">
                  <div style={{ padding: "var(--portal-space-1) 0" }}>
                    {discovery.events.map((event, index) => (
                      <EventCard
                        key={event.eventId}
                        event={event}
                        isLast={index === discovery.events.length - 1}
                      />
                    ))}
                  </div>
                </PortalCard>
              </>
            )}
          </>
        )}
      </div>
    </PageScaffold>
  );
}

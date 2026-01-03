// apps/portal/src/design/PlacementWindowBanner.tsx
// Phase 6: Compact banner for placement window blocking states.
import * as React from "react";
import {
  type BlockedResponse,
  getBlockedMessage,
  formatPlacementWindow,
} from "../api/scheduling";

interface PlacementWindowBannerProps {
  blocked: BlockedResponse;
}

/**
 * Compact banner showing placement window status.
 * Displays static open/close timestamps in user's local timezone
 * with policy timezone label in small text.
 */
export function PlacementWindowBanner({ blocked }: PlacementWindowBannerProps) {
  const message = getBlockedMessage(blocked);
  const { startLocal, endLocal, policyTimezone } = formatPlacementWindow(
    blocked.context.placementWindowStartAt,
    blocked.context.placementWindowEndAt,
    blocked.context.timezone
  );

  const isWindowNotOpen = blocked.code === "PLACEMENT_WINDOW_NOT_OPEN";
  const isWindowClosed = blocked.code === "PLACEMENT_WINDOW_CLOSED";
  const hasWindowTimes = startLocal || endLocal;

  // Use warning color for "not open yet", error for "closed" or "no rank"
  const borderColor = isWindowNotOpen ? "var(--portal-warning)" : "var(--portal-error)";
  const bgColor = isWindowNotOpen
    ? "color-mix(in srgb, var(--portal-warning) 10%, transparent)"
    : "color-mix(in srgb, var(--portal-error) 10%, transparent)";

  return (
    <div
      style={{
        padding: "var(--portal-space-3)",
        borderLeft: `3px solid ${borderColor}`,
        background: bgColor,
        borderRadius: "var(--portal-radius-sm)",
      }}
    >
      {/* Primary message */}
      <div
        style={{
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-medium)",
          color: "var(--portal-text-primary)",
          marginBottom: hasWindowTimes ? "var(--portal-space-2)" : 0,
        }}
      >
        {message}
      </div>

      {/* Window times */}
      {hasWindowTimes && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--portal-space-1)",
          }}
        >
          {isWindowNotOpen && startLocal && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
              }}
            >
              Opens: <span style={{ fontWeight: "var(--portal-font-weight-medium)" }}>{startLocal}</span>
            </div>
          )}
          {(isWindowNotOpen || isWindowClosed) && endLocal && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
              }}
            >
              {isWindowClosed ? "Closed" : "Closes"}: <span style={{ fontWeight: "var(--portal-font-weight-medium)" }}>{endLocal}</span>
            </div>
          )}
          {/* Policy timezone label */}
          {policyTimezone && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginTop: "var(--portal-space-1)",
              }}
            >
              Breeder timezone: {policyTimezone}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Check if a blocked response is a placement window block.
 */
export function isPlacementWindowBlock(blocked: BlockedResponse | null): boolean {
  if (!blocked) return false;
  return (
    blocked.code === "PLACEMENT_WINDOW_NOT_OPEN" ||
    blocked.code === "PLACEMENT_WINDOW_CLOSED" ||
    blocked.code === "NO_PLACEMENT_RANK"
  );
}

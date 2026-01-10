// apps/breeding/src/components/CreateAvailabilityBlockDialog.tsx
// Dialog for creating a new scheduling availability block with slot generation

import * as React from "react";
import { Dialog } from "@bhq/ui/components/Dialog";
import { Button } from "@bhq/ui/components/Button";
import { makeBreedingApi, type CreateBlockInput } from "../api";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (blockId: number, slotCount: number) => void;
  initialDate?: Date;
}

// Get browser timezone
function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

// Format date for datetime-local input
function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateAvailabilityBlockDialog({ open, onClose, onCreated, initialDate }: Props) {
  const tenantId = readTenantIdFast?.();

  // Form state
  const defaultStartDate = initialDate ?? new Date();
  defaultStartDate.setHours(9, 0, 0, 0);
  const defaultEndDate = new Date(defaultStartDate);
  defaultEndDate.setHours(17, 0, 0, 0);

  const [startAt, setStartAt] = React.useState(toLocalDateTimeString(defaultStartDate));
  const [endAt, setEndAt] = React.useState(toLocalDateTimeString(defaultEndDate));
  const [timezone, setTimezone] = React.useState(getBrowserTimezone());
  const [slotIntervalMinutes, setSlotIntervalMinutes] = React.useState(60);
  const [slotDurationMinutes, setSlotDurationMinutes] = React.useState(60);
  const [capacity, setCapacity] = React.useState(1);
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = React.useState(0);
  const [bufferAfterMinutes, setBufferAfterMinutes] = React.useState(0);
  const [mode, setMode] = React.useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [location, setLocation] = React.useState("");
  const [nextStepsText, setNextStepsText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      const start = initialDate ?? new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(17, 0, 0, 0);
      setStartAt(toLocalDateTimeString(start));
      setEndAt(toLocalDateTimeString(end));
      setTimezone(getBrowserTimezone());
      setSlotIntervalMinutes(60);
      setSlotDurationMinutes(60);
      setCapacity(1);
      setBufferBeforeMinutes(0);
      setBufferAfterMinutes(0);
      setMode("IN_PERSON");
      setLocation("");
      setNextStepsText("");
      setError(null);
    }
  }, [open, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("No tenant context available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });

      const input: CreateBlockInput = {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        timezone,
        slotIntervalMinutes,
        slotDurationMinutes,
        capacity,
        bufferBeforeMinutes: bufferBeforeMinutes || undefined,
        bufferAfterMinutes: bufferAfterMinutes || undefined,
        mode,
        location: location.trim() || undefined,
        nextStepsText: nextStepsText.trim() || undefined,
      };

      const result = await api.scheduling.createBlock(input);
      onCreated?.(result.block.id, result.slotCount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create availability block");
    } finally {
      setLoading(false);
    }
  };

  // Calculate preview of slots that will be generated
  const previewSlotCount = React.useMemo(() => {
    try {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;

      const effectiveStart = new Date(start.getTime() + bufferBeforeMinutes * 60 * 1000);
      const effectiveEnd = new Date(end.getTime() - bufferAfterMinutes * 60 * 1000);

      if (effectiveEnd <= effectiveStart) return 0;

      let count = 0;
      let current = effectiveStart.getTime();
      while (current < effectiveEnd.getTime()) {
        const slotEnd = current + slotDurationMinutes * 60 * 1000;
        if (slotEnd > effectiveEnd.getTime()) break;
        count++;
        current += slotIntervalMinutes * 60 * 1000;
      }
      return count;
    } catch {
      return 0;
    }
  }, [startAt, endAt, bufferBeforeMinutes, bufferAfterMinutes, slotIntervalMinutes, slotDurationMinutes]);

  return (
    <Dialog open={open} onClose={onClose} title="Create Availability Block" size="lg">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Time Range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Start</span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>End</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            />
          </label>
        </div>

        {/* Timezone */}
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Timezone</span>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
            required
            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </label>

        {/* Slot Configuration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Slot Interval (min)</span>
            <select
              value={slotIntervalMinutes}
              onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            >
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
              <option value={120}>120</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Slot Duration (min)</span>
            <select
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            >
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
              <option value={120}>120</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Capacity</span>
            <input
              type="number"
              min={1}
              max={10}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </label>
        </div>

        {/* Buffer Configuration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Buffer Before (min)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={bufferBeforeMinutes}
              onChange={(e) => setBufferBeforeMinutes(Number(e.target.value))}
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Buffer After (min)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={bufferAfterMinutes}
              onChange={(e) => setBufferAfterMinutes(Number(e.target.value))}
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </label>
        </div>

        {/* Mode */}
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "IN_PERSON" | "VIRTUAL")}
            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
          >
            <option value="IN_PERSON">In Person</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </label>

        {/* Location (for in-person) */}
        {mode === "IN_PERSON" && (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, City, State"
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </label>
        )}

        {/* Next Steps Text */}
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Next Steps Text (shown after booking)</span>
          <textarea
            value={nextStepsText}
            onChange={(e) => setNextStepsText(e.target.value)}
            placeholder="Please arrive 10 minutes early..."
            rows={3}
            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", resize: "vertical" }}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </label>

        {/* Preview */}
        <div style={{ padding: "0.75rem", backgroundColor: "#f3f4f6", borderRadius: "0.375rem" }}>
          <strong>Preview:</strong> {previewSlotCount} slot{previewSlotCount !== 1 ? "s" : ""} will be created
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "0.75rem", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "0.375rem" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || previewSlotCount === 0}>
            {loading ? "Creating..." : `Create Block (${previewSlotCount} slots)`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default CreateAvailabilityBlockDialog;

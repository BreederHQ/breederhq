import * as React from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import type { CycleHistoryEntry } from "./types";
import "@bhq/ui/styles/datepicker.css";

type CollapsibleCycleHistoryProps = {
  cycles: CycleHistoryEntry[];
  onViewBreedingPlan?: (planId: number) => void;
  /** Which cycle is currently being edited (controlled) */
  editingCycleId?: number | null;
  /** Called when pencil is clicked - parent should set editingCycleId */
  onEditCycle?: (cycleId: number) => void;
  /** Called when a new date is selected */
  onEditComplete?: (cycleId: number, newDateIso: string) => void;
  /** Called when edit is cancelled */
  onEditCancel?: () => void;
  onDeleteCycle?: (cycleId: number) => void;
  /** Center the toggle header */
  centered?: boolean;
};

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local date to avoid timezone issues.
 */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseISOToDate(iso: string | null): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return undefined;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CollapsibleCycleHistory({
  cycles,
  onViewBreedingPlan,
  editingCycleId,
  onEditCycle,
  onEditComplete,
  onEditCancel,
  onDeleteCycle,
  centered = false,
}: CollapsibleCycleHistoryProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [popoverPos, setPopoverPos] = React.useState<{ top: number; left: number } | null>(null);
  const editButtonRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

  // When editingCycleId changes, calculate popover position
  React.useLayoutEffect(() => {
    if (editingCycleId == null) {
      setPopoverPos(null);
      return;
    }
    const btn = editButtonRefs.current.get(editingCycleId);
    if (!btn) {
      // Fallback to center
      setPopoverPos({
        top: Math.max(12, (window.innerHeight - 340) / 2),
        left: Math.max(12, (window.innerWidth - 300) / 2),
      });
      return;
    }
    const r = btn.getBoundingClientRect();
    let top = r.bottom + 8;
    if (top + 340 + 12 > window.innerHeight) {
      top = Math.max(12, r.top - 340 - 8);
    }
    let left = r.left;
    left = Math.max(12, Math.min(left, window.innerWidth - 12 - 300));
    setPopoverPos({ top, left });
  }, [editingCycleId]);

  // Close on Escape
  React.useEffect(() => {
    if (editingCycleId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEditCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingCycleId, onEditCancel]);

  if (cycles.length === 0) {
    return null;
  }

  // Sort by date descending (most recent first)
  // Use string comparison since ISO dates sort correctly as strings
  const sortedCycles = [...cycles].sort((a, b) =>
    b.cycleStart.localeCompare(a.cycleStart)
  );

  const editingCycle = editingCycleId != null ? cycles.find(c => c.id === editingCycleId) : null;
  const selectedDate = editingCycle ? parseISOToDate(editingCycle.cycleStart) : undefined;

  const handleDaySelect = (date: Date | undefined) => {
    if (!date || editingCycleId == null) return;
    const iso = formatDateToISO(date);
    onEditComplete?.(editingCycleId, iso);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors ${centered ? "justify-center w-full" : "w-full"}`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {isExpanded ? "Hide" : "View"} cycle history ({cycles.length} recorded)
        </span>
      </button>

      {/* Card list - most recent first */}
      {isExpanded && (
        <div className={`mt-3 space-y-2 ${centered ? "" : "pl-6"}`}>
          {sortedCycles.map((cycle, idx) => {
            const isEditing = editingCycleId === cycle.id;
            const isLatest = idx === 0;

            return (
              <div
                key={cycle.id}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: isLatest ? "1px solid rgba(255, 107, 53, 0.3)" : "1px solid rgba(60, 60, 60, 0.5)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#222222";
                  e.currentTarget.style.borderColor = "rgba(255, 107, 53, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                  e.currentTarget.style.borderColor = isLatest ? "rgba(255, 107, 53, 0.3)" : "rgba(60, 60, 60, 0.5)";
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Calendar icon */}
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isLatest ? "rgba(255, 107, 53, 0.15)" : "rgba(60, 60, 60, 0.4)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: isLatest ? "#ff6b35" : "rgba(255, 255, 255, 0.5)" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {/* Date and badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{formatDate(cycle.cycleStart)}</span>
                    {isLatest && (
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "rgba(255, 107, 53, 0.2)", color: "#ff6b35" }}
                      >
                        latest
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onEditCycle && (
                    <button
                      ref={(el) => {
                        if (el) editButtonRefs.current.set(cycle.id, el);
                        else editButtonRefs.current.delete(cycle.id);
                      }}
                      type="button"
                      onClick={() => onEditCycle(cycle.id)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{
                        color: isEditing ? "#3b82f6" : "rgba(255, 255, 255, 0.4)",
                        backgroundColor: isEditing ? "rgba(59, 130, 246, 0.15)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isEditing) {
                          e.currentTarget.style.color = "#3b82f6";
                          e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditing) {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                      title="Edit date"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteCycle && !isEditing && (
                    <button
                      type="button"
                      onClick={() => onDeleteCycle(cycle.id)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "rgba(255, 255, 255, 0.4)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DayPicker popover - portaled to body, opens immediately when editing */}
      {editingCycleId != null && popoverPos && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onEditCancel?.();
          }}
        >
          <div
            role="dialog"
            className="rounded-md border border-hairline bg-surface p-2 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              width: 300,
              zIndex: 2147483647,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              defaultMonth={selectedDate || new Date()}
              showOutsideDays
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(2035, 11)}
              classNames={{
                root: "rdp-root",
                months: "rdp-months",
                month: "rdp-month",
                month_caption: "rdp-month_caption",
                caption_label: "rdp-caption_label",
                nav: "rdp-nav",
                button_previous: "rdp-button_previous",
                button_next: "rdp-button_next",
                month_grid: "rdp-month_grid",
                weekdays: "rdp-weekdays",
                weekday: "rdp-weekday",
                week: "rdp-week",
                day: "rdp-day",
                day_button: "rdp-day_button",
                selected: "rdp-selected",
                today: "rdp-today",
                outside: "rdp-outside",
                disabled: "rdp-disabled",
                hidden: "rdp-hidden",
                dropdowns: "rdp-dropdowns",
                dropdown: "rdp-dropdown",
                dropdown_root: "rdp-dropdown_root",
                months_dropdown: "rdp-months_dropdown",
                years_dropdown: "rdp-years_dropdown",
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// apps/breeding/src/components/PlanJourney.tsx
// Visual timeline showing breeding plan phases with guidance

import * as React from "react";
import { DatePicker } from "@bhq/ui";
import "@bhq/ui/styles/datepicker.css";

// Phase definitions
const PHASES = [
  { key: "PLANNING", label: "Planning", shortLabel: "Planning" },
  { key: "COMMITTED", label: "Committed", shortLabel: "Committed" },
  { key: "BRED", label: "Breeding", shortLabel: "Breeding" },
  { key: "BIRTHED", label: "Birth", shortLabel: "Birth" },
  { key: "WEANED", label: "Weaned", shortLabel: "Weaned" },
  { key: "PLACEMENT_STARTED", label: "Placement Started", shortLabel: "Placement" },
  { key: "PLACEMENT_COMPLETED", label: "Placement Completed", shortLabel: "Placed" },
  { key: "COMPLETE", label: "Plan Complete", shortLabel: "Complete" },
] as const;

type PhaseKey = typeof PHASES[number]["key"];

// Map status to phase index
function getPhaseIndex(status: string | null | undefined): number {
  if (!status) return 0;
  const idx = PHASES.findIndex(p => p.key === status);
  return idx >= 0 ? idx : 0;
}

// Requirements for each phase transition
type Requirement = {
  key: string;
  label: string;
  met: boolean;
  action?: string; // Hint for what to do
};

export type PlanJourneyProps = {
  status: string | null | undefined;
  // For Planning → Committed requirements
  hasPlanName: boolean;
  hasSpecies: boolean;
  hasDam: boolean;
  hasSire: boolean;
  hasBreed: boolean;
  hasLockedCycle: boolean;
  // For phase transitions (actual dates)
  hasActualCycleStart: boolean;
  hasActualBreedDate: boolean;
  hasActualBirthDate: boolean;
  hasActualWeanedDate: boolean;
  hasPlacementStarted: boolean;
  hasPlacementCompleted: boolean;
  hasPlanCompleted: boolean;
  // Actual date values for inline editing
  actualCycleStartDate?: string | null;
  actualHormoneTestingStartDate?: string | null;
  actualBreedDate?: string | null;
  actualBirthDate?: string | null;
  actualWeanedDate?: string | null;
  actualPlacementStartDate?: string | null;
  actualPlacementCompletedDate?: string | null;
  actualPlanCompletedDate?: string | null;
  // Expected date values (used to pre-populate calendar when opening empty fields)
  expectedCycleStartDate?: string | null;
  expectedHormoneTestingStartDate?: string | null;
  expectedBreedDate?: string | null;
  expectedBirthDate?: string | null;
  expectedWeanedDate?: string | null;
  expectedPlacementStartDate?: string | null;
  expectedPlacementCompletedDate?: string | null;
  expectedPlanCompletedDate?: string | null;
  // Callbacks
  onAdvancePhase?: (toPhase: PhaseKey) => void;
  onNavigateToTab?: (tab: string) => void;
  onDateChange?: (field: "actualCycleStartDate" | "actualHormoneTestingStartDate" | "actualBreedDate" | "actualBirthDate" | "actualWeanedDate" | "actualPlacementStartDate" | "actualPlacementCompletedDate" | "actualPlanCompletedDate", value: string | null) => void;
  // Confirm modal for phase transitions
  confirmModal?: (opts: { title: string; message: React.ReactNode; confirmText: string; cancelText: string }) => Promise<boolean>;
  // Control guidance visibility
  guidanceCollapsed?: boolean;
  onToggleGuidance?: (collapsed: boolean) => void;
  // Edit mode - advance button only visible in edit mode
  isEdit?: boolean;
};

export function PlanJourney({
  status,
  hasPlanName,
  hasSpecies,
  hasDam,
  hasSire,
  hasBreed,
  hasLockedCycle,
  hasActualCycleStart,
  hasActualBreedDate,
  hasActualBirthDate,
  hasActualWeanedDate,
  hasPlacementStarted,
  hasPlacementCompleted,
  hasPlanCompleted,
  actualCycleStartDate,
  actualHormoneTestingStartDate,
  actualBreedDate,
  actualBirthDate,
  actualWeanedDate,
  actualPlacementStartDate,
  actualPlacementCompletedDate,
  actualPlanCompletedDate,
  expectedCycleStartDate,
  expectedHormoneTestingStartDate,
  expectedBreedDate,
  expectedBirthDate,
  expectedWeanedDate,
  expectedPlacementStartDate,
  expectedPlacementCompletedDate,
  expectedPlanCompletedDate,
  onAdvancePhase,
  onNavigateToTab,
  onDateChange,
  confirmModal,
  guidanceCollapsed = false,
  onToggleGuidance,
  isEdit = false,
}: PlanJourneyProps) {
  const currentPhaseIdx = getPhaseIndex(status);
  const currentPhase = PHASES[currentPhaseIdx];
  const nextPhase = PHASES[currentPhaseIdx + 1];

  // Helper to get actual date value for a requirement key
  const getActualDateForRequirement = (reqKey: string): string | null => {
    switch (reqKey) {
      case "cycleStart": return actualCycleStartDate ?? null;
      case "breedDate": return actualBreedDate ?? null;
      case "birthDate": return actualBirthDate ?? null;
      case "weanedDate": return actualWeanedDate ?? null;
      case "placementStarted": return actualPlacementStartDate ?? null;
      case "placementCompleted": return actualPlacementCompletedDate ?? null;
      default: return null;
    }
  };

  // Helper to format date for display (e.g., "Jan 5, 2026")
  const formatDateDisplay = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      // Extract YYYY-MM-DD from either date-only string or ISO timestamp
      const dateOnly = dateStr.slice(0, 10); // Gets "YYYY-MM-DD" from both formats
      const [year, month, day] = dateOnly.split("-").map(Number);

      if (!year || !month || !day) return "";

      // Create date using local timezone components to avoid UTC shift
      const date = new Date(year, month - 1, day);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  // Refs for measuring node positions
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [lineSegments, setLineSegments] = React.useState<Array<{ left: number; width: number; top: number }>>([]);

  // Measure positions of all line segments after render
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setLineSegments([]);
      return;
    }

    const measure = () => {
      const circles = container.querySelectorAll("[data-phase-circle]");
      const segments: Array<{ left: number; width: number; top: number }> = [];
      const containerRect = container.getBoundingClientRect();

      // Measure each gap between circles (6 segments for 7 circles)
      for (let i = 0; i < circles.length - 1; i++) {
        const currentCircle = circles[i] as HTMLElement;
        const nextCircle = circles[i + 1] as HTMLElement;

        const currentRect = currentCircle.getBoundingClientRect();
        const nextRect = nextCircle.getBoundingClientRect();

        const left = currentRect.right - containerRect.left;
        const width = nextRect.left - currentRect.right;
        const top = (currentRect.top + currentRect.height / 2) - containerRect.top;

        if (width > 0) {
          segments.push({ left, width, top });
        }
      }

      setLineSegments(segments);
    };

    // Measure after a brief delay to ensure layout is complete
    const timer = setTimeout(measure, 50);

    // Also measure on resize
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);

  // Build requirements for the next phase
  const getNextPhaseRequirements = (): Requirement[] => {
    if (!nextPhase) return []; // Already complete

    switch (nextPhase.key) {
      case "COMMITTED":
        // Requirements to commit the plan
        return [
          { key: "planName", label: "Plan Name", met: hasPlanName, action: "Enter a plan name" },
          { key: "species", label: "Species", met: hasSpecies, action: "Select a species" },
          { key: "dam", label: "Dam (Female)", met: hasDam, action: "Your plan must have a dam selected" },
          { key: "sire", label: "Sire (Male)", met: hasSire, action: "Your plan must have sire selected" },
          { key: "breed", label: "Breed (Offspring)", met: hasBreed, action: "Choose the offspring Breed for this plan" },
          { key: "cycle", label: "Locked Cycle", met: hasLockedCycle, action: "Select the upcoming estimated cycle start date" },
        ];
      case "BRED":
        // To advance to Breeding, cycle must have started
        return [
          { key: "cycleStart", label: "Actual Cycle Start", met: hasActualCycleStart, action: "Enter when the cycle actually started" },
        ];
      case "BIRTHED":
        // To advance to Birth, breeding must have occurred
        return [
          { key: "breedDate", label: "Actual Breed Date", met: hasActualBreedDate, action: "Enter the date when breeding occured" },
        ];
      case "WEANED":
        // To advance to Weaned, birth must have occurred
        return [
          { key: "birthDate", label: "Actual Birth Date", met: hasActualBirthDate, action: "Enter the actual birth date" },
        ];
      case "PLACEMENT_STARTED":
        // To advance to Placement Started, weaning must have occurred
        return [
          { key: "weanedDate", label: "Actual Weaned Date", met: hasActualWeanedDate, action: "Enter the weaning date" },
        ];
      case "PLACEMENT_COMPLETED":
        // To advance to Placement Completed, placement must have started
        return [
          { key: "placementStarted", label: "Actual Placement Start Date", met: hasPlacementStarted, action: "Enter the placement start date" },
        ];
      case "COMPLETE":
        // To advance to Complete phase, placement completed date must be entered
        return [
          { key: "placementCompleted", label: "Actual Placement Completed Date", met: hasPlacementCompleted, action: "Enter the placement completed date" },
        ];
      default:
        return [];
    }
  };

  const requirements = getNextPhaseRequirements();
  // If no requirements, consider them all met (allows free advancement)
  const allRequirementsMet = requirements.length === 0 || requirements.every(r => r.met);
  const metCount = requirements.filter(r => r.met).length;

  // Section titles - collapsed shows context-aware title, expanded shows phase-specific guidance title
  const nextPhaseIdx = nextPhase ? PHASES.findIndex(p => p.key === nextPhase.key) + 1 : null;
  const collapsedTitle = !nextPhase
    ? hasPlanCompleted
      ? "Plan Complete"
      : isEdit
        ? "Enter Plan Completion Date"
        : "Final Completion Phase — Click Edit"
    : allRequirementsMet
      ? isEdit
        ? `Breeding Plan Ready for Phase ${nextPhaseIdx}`
        : `Breeding Plan Ready for Phase ${nextPhaseIdx} — Click Edit to Advance`
      : "Remaining Tasks";

  // Phase-specific guidance titles when expanded
  const getExpandedTitle = (): string => {
    switch (currentPhase.key) {
      case "PLANNING":
        return "Planning Phase Guidance";
      case "COMMITTED":
        return "Committed Phase Guidance";
      case "BRED":
        return "Bred Phase Guidance";
      case "BIRTHED":
        return "Birthed Phase Guidance";
      case "WEANED":
        return "Weaned Phase Guidance";
      case "PLACEMENT_STARTED":
        return "Placement Phase Guidance";
      case "PLACEMENT_COMPLETED":
        return "Completing Plan Guidance";
      case "COMPLETE":
        return hasPlanCompleted ? "Plan Complete" : "Final Completion Phase";
      default:
        return "Phase Guidance";
    }
  };

  const sectionTitle = guidanceCollapsed ? collapsedTitle : getExpandedTitle();

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      {/* Timeline */}
      <div className="relative">
        {/* Phase circles */}
        <div ref={containerRef} className="flex items-center justify-between relative">
          {/* Line segments between circles */}
          {lineSegments.map((segment, idx) => {
            const isCompleted = idx < currentPhaseIdx;
            const isCurrent = idx === currentPhaseIdx;

            return (
              <div
                key={idx}
                className="absolute"
                style={{ left: segment.left, width: segment.width, top: segment.top, transform: 'translateY(-50%)' }}
              >
                {isCompleted ? (
                  // Completed segment - solid green
                  <div className="h-0.5 bg-emerald-500 rounded-full" />
                ) : isCurrent ? (
                  // Current segment - animated dashed line moving left to right
                  <div
                    className="h-1 rounded-full overflow-hidden animate-[marchingAnts_3s_linear_infinite]"
                    style={{
                      background: `repeating-linear-gradient(
                        90deg,
                        #f59e0b 0px,
                        #f59e0b 6px,
                        transparent 6px,
                        transparent 12px
                      )`,
                      backgroundSize: '24px 100%',
                    }}
                  />
                ) : (
                  // Future segment - gray
                  <div className="h-0.5 bg-zinc-700 rounded-full" />
                )}
              </div>
            );
          })}

          {PHASES.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIdx;
            const isCurrent = idx === currentPhaseIdx;
            const isNext = idx === currentPhaseIdx + 1;

            return (
              <div key={phase.key} className="relative z-10 flex flex-col items-center">
                {/* Circle */}
                <div
                  data-phase-circle
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-300
                    ${isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-amber-500 text-white ring-4 ring-amber-500/30"
                        : isNext
                          ? "bg-surface border-2 border-amber-500 text-amber-500"
                          : "bg-surface border-2 border-hairline text-secondary"
                    }
                    ${isNext ? "animate-pulse" : ""}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-[10px] font-medium whitespace-nowrap
                    ${isCompleted ? "text-emerald-500" : isCurrent ? "text-amber-500" : isNext ? "text-amber-500/70" : "text-secondary"}
                  `}
                >
                  {phase.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist Section */}
      <div className="mt-4">
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => onToggleGuidance?.(!guidanceCollapsed)}
          className="w-full flex items-center justify-between text-left group hover:bg-white/5 rounded-lg py-1 px-2 -mx-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${allRequirementsMet ? "text-amber-400" : "text-primary"}`}>{sectionTitle}</span>
            {nextPhase && requirements.length > 0 && !allRequirementsMet && (
              <span className="text-xs text-secondary">
                ({metCount}/{requirements.length} complete)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {guidanceCollapsed && (
              <span className="text-xs text-secondary">Expand for Guidance</span>
            )}
            <svg
              className={`w-4 h-4 text-secondary transition-transform ${guidanceCollapsed ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Preview of incomplete items when collapsed */}
        {guidanceCollapsed && nextPhase && requirements.length > 0 && metCount < requirements.length && (() => {
          const incompleteItems = requirements.filter(r => !r.met);
          return (
            <div className="mt-1 pl-2 text-xs space-y-0.5">
              {incompleteItems.map(item => {
                // Special case for Locked Cycle
                if (item.key === "cycle") {
                  return (
                    <div key={item.key} className="flex items-center gap-1.5 text-primary">
                      <span className="text-amber-500">•</span>
                      <span>Select and Lock a <span style={{ color: "#fbbf24", fontWeight: 500 }}>Cycle Start</span> date.</span>
                    </div>
                  );
                }
                // Special case for Breed
                if (item.key === "breed") {
                  return (
                    <div key={item.key} className="flex items-center gap-1.5 text-primary">
                      <span className="text-amber-500">•</span>
                      <span>Choose the offspring <span style={{ color: "#fbbf24", fontWeight: 500 }}>Breed</span> for this plan.</span>
                    </div>
                  );
                }
                // Special case for Dam
                if (item.key === "dam") {
                  return (
                    <div key={item.key} className="flex items-center gap-1.5 text-primary">
                      <span className="text-amber-500">•</span>
                      <span>Your plan must have a <span style={{ color: "#fbbf24", fontWeight: 500 }}>Dam</span> selected.</span>
                    </div>
                  );
                }
                // Special case for Sire
                if (item.key === "sire") {
                  return (
                    <div key={item.key} className="flex items-center gap-1.5 text-primary">
                      <span className="text-amber-500">•</span>
                      <span>Your plan must have a <span style={{ color: "#fbbf24", fontWeight: 500 }}>Sire</span> selected.</span>
                    </div>
                  );
                }
                // Default case for other items (Plan Name, Species, etc.)
                const labelName = item.label.split(' (')[0];
                return (
                  <div key={item.key} className="flex items-center gap-1.5 text-primary">
                    <span className="text-amber-500">•</span>
                    <span>Select <span style={{ color: "#fbbf24", fontWeight: 500 }}>{labelName}</span> for this plan.</span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Call-to-action button when collapsed and all requirements are met */}
        {guidanceCollapsed && nextPhase && allRequirementsMet && onAdvancePhase && isEdit && (
          <button
            type="button"
            onClick={() => onAdvancePhase(nextPhase.key)}
            className="mt-3 w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors animate-pulse"
          >
            Advance to {nextPhase.label} Phase
          </button>
        )}

        {/* Inline date input in COLLAPSED mode for date-based requirements */}
        {guidanceCollapsed && nextPhase && requirements.length > 0 && onDateChange && isEdit && (
          <div className={`mt-2 px-2 py-1 rounded-lg border-2 ${allRequirementsMet ? "border-green-500/60 bg-green-500/10" : "border-amber-500/60 bg-amber-500/10"}`}>
            <div className={`text-xs font-medium ${nextPhase.key !== "COMMITTED" ? "mb-1" : ""} ${allRequirementsMet ? "text-green-400" : "text-amber-400"}`}>
              {allRequirementsMet
                ? nextPhase.key === "COMMITTED"
                  ? "All requirements met — Click Advance to Committed Phase to proceed"
                  : nextPhase.key === "BRED"
                    ? "Cycle Start Recorded — Click Advance to Breeding Phase to proceed"
                    : nextPhase.key === "BIRTHED"
                      ? "Breed Date Recorded — Click Advance to Birth Phase to proceed"
                      : nextPhase.key === "WEANED"
                        ? "Birth Date Recorded — Click Advance to Weaned Phase to proceed"
                        : nextPhase.key === "PLACEMENT_STARTED"
                          ? "Weaned Date Recorded — Click Advance to Placement Phase to proceed"
                          : nextPhase.key === "PLACEMENT_COMPLETED"
                            ? "Placement Start Recorded — Click Advance to Placement Completed Phase to proceed"
                            : nextPhase.key === "COMPLETE"
                              ? "Placement Completed Recorded — Click Advance to Complete Plan"
                              : "Ready to advance"
                : "Enter the required information below:"}
            </div>
            {nextPhase.key === "BRED" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Cycle Start (Actual):</label>
                <DatePicker
                  value={actualCycleStartDate ?? ""}
                  defaultDate={expectedCycleStartDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualCycleStartDate", val || null);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualCycleStart ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
            {nextPhase.key === "BIRTHED" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Breed Date (Actual):</label>
                <DatePicker
                  value={actualBreedDate ?? ""}
                  defaultDate={expectedBreedDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualBreedDate", val || null);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualBreedDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
            {nextPhase.key === "WEANED" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Birth Date (Actual):</label>
                <DatePicker
                  value={actualBirthDate ?? ""}
                  defaultDate={expectedBirthDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualBirthDate", val || null);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualBirthDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
            {nextPhase.key === "PLACEMENT_STARTED" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Weaning Completed (Actual):</label>
                <DatePicker
                  value={actualWeanedDate ?? ""}
                  defaultDate={expectedWeanedDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualWeanedDate", val || null);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualWeanedDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
            {nextPhase.key === "PLACEMENT_COMPLETED" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Placement Start Date (Actual):</label>
                <DatePicker
                  value={actualPlacementStartDate ?? ""}
                  defaultDate={expectedPlacementStartDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val) {
                      onDateChange("actualPlacementStartDate", null);
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualPlacementStartDate", val);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlacementStarted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
            {nextPhase.key === "COMPLETE" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-primary font-medium whitespace-nowrap">Placement Completed Date (Actual):</label>
                <DatePicker
                  value={actualPlacementCompletedDate ?? ""}
                  defaultDate={expectedPlacementCompletedDate ?? undefined}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (!val) {
                      onDateChange("actualPlacementCompletedDate", null);
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      onDateChange("actualPlacementCompletedDate", val);
                    }
                  }}
                  className="flex-1"
                  inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlacementCompleted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Optional Hormone Testing Date - separate card in COLLAPSED mode for BREEDING phase (advancing to Birth) */}
        {guidanceCollapsed && currentPhase.key === "BRED" && nextPhase?.key === "BIRTHED" && onDateChange && isEdit && (
          <div className="mt-3 p-3 rounded-lg border border-sky-500/40 bg-sky-500/5">
            <div className="text-xs text-sky-300/80 mb-2">
              <span className="font-medium text-sky-300">Optional:</span> Record when hormone testing began
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-primary font-medium whitespace-nowrap">Hormone Testing Started:</label>
              <DatePicker
                value={actualHormoneTestingStartDate ?? ""}
                defaultDate={expectedHormoneTestingStartDate ?? undefined}
                onChange={(e) => onDateChange("actualHormoneTestingStartDate", e.currentTarget.value || null)}
                className="flex-1"
                inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-sky-500/40 bg-surface text-primary focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/30"
              />
            </div>
          </div>
        )}

        {/* Phase 8 (COMPLETE) - Collapsed mode date input */}
        {guidanceCollapsed && currentPhase.key === "COMPLETE" && !hasPlanCompleted && isEdit && onDateChange && (
          <div className="mt-2 px-3 py-2 rounded-lg border-2 ring-2 soft-pulse border-amber-500/60 bg-amber-500/10 ring-amber-500/20">
            <div className="text-xs font-medium mb-2 text-amber-400">
              Enter the official plan completion date:
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-primary font-medium whitespace-nowrap">Plan Completed (Actual):</label>
              <DatePicker
                value={actualPlanCompletedDate ?? ""}
                defaultDate={expectedPlanCompletedDate ?? undefined}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  if (!val) {
                    onDateChange("actualPlanCompletedDate", null);
                  } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                    onDateChange("actualPlanCompletedDate", val);
                  }
                }}
                className="flex-1"
                inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlanCompleted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
              />
            </div>
          </div>
        )}

        {/* Phase 8 (COMPLETE) - Collapsed mode completion status */}
        {guidanceCollapsed && currentPhase.key === "COMPLETE" && hasPlanCompleted && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="text-emerald-500 text-sm font-semibold">
              ✓ Breeding Plan Complete
            </div>
            {actualPlanCompletedDate && (
              <div className="text-xs text-emerald-300/70 mt-1">
                Completed on {formatDateDisplay(actualPlanCompletedDate)}
              </div>
            )}
            {/* Show Change button when in edit mode - allows user to modify completion date */}
            {isEdit && onDateChange && (
              <button
                type="button"
                onClick={() => onDateChange("actualPlanCompletedDate", null)}
                className="mt-2 text-xs text-secondary hover:text-primary underline"
              >
                Change Completion Date
              </button>
            )}
          </div>
        )}

        {/* Message when collapsed and not in edit mode */}
        {guidanceCollapsed && !allRequirementsMet && nextPhase && nextPhase.key !== "COMMITTED" && !isEdit && (
          <div className="mt-2 text-xs text-secondary italic">
            Click Edit to enter the actual date and advance.
          </div>
        )}

        {/* Collapsible content */}
        {!guidanceCollapsed && (
          <div className="mt-2 pl-2">
            {/* Phase-specific guidance card */}
            {currentPhase.key === "PLANNING" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Planning Phase</span>. In this phase you may still be weighing options that will influence your decision to proceed or not. Factors like cycle timing or who the sire will be may influence the outcome of whether this plan is executed or not. While in the planning phase, you can still make changes or even abandon the plan entirely.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Only a Plan Name is required to save your plan. You can add the Dam, Sire, and other details later as you finalize your decisions.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "COMMITTED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Committed Phase</span>. In this phase you are preparing for the Dam's cycle to begin. Once you have confirmed the Dam's cycle has started, record the actual start date (to the best of your ability) and move forward with the Breeding Phase.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Once the cycle has started, enter the Actual Cycle Start date below and save to advance to the next phase.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>

              </div>
            )}

            {currentPhase.key === "BRED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Breeding Phase</span>. In this phase you are actively managing the breeding process. Monitor the Dam closely during this time. You may also be considering performing hormone testing to confirm ovulation and optimize breeding timing.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Once breeding has occurred, enter the Actual Breed Date below and save to advance to the Birth phase.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "BIRTHED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Birth Phase</span>. In this phase you are waiting for the arrival of the new offspring. Monitor the Dam closely during gestation and prepare for the upcoming birth.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Once the offspring are born, enter the Actual Birth Date below to advance to the Weaned phase.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "WEANED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Weaned Phase</span>. Congratulations on the new offspring! In this phase you are caring for the Dam and her offspring during the critical early weeks. Monitor your new offsprings' health and development closely.
                </p>
                <p className="mt-3 text-sm text-primary leading-relaxed">
                  <span className="font-medium text-amber-400">Important:</span> You have reached a critical milestone where your focus will naturally shift to offspring care and placement. Everything you need to manage this new operational phase can be found over in the Offspring page - just look for the Breeding Plan name to see the linked Offspring Group.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Once you have completed weaning all of the offspring, enter the Actual Weaned Date below and save to advance to the Placement phase.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "PLACEMENT_STARTED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Placement Started Phase</span>. Puppies are now ready to go to their forever homes. Coordinate with families, complete health checks, and begin transitioning puppies to their new environments.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Enter the Actual Placement Start Date below and save to advance to the Placement Completed phase.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "PLACEMENT_COMPLETED" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed">
                  Your Breeding Plan is currently in the <span className="text-purple-400 font-medium">Placement Completed Phase</span>. All puppies have been placed with their new families. Complete any final paperwork and follow-ups.
                </p>
                <p className="mt-3 text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Enter the Placement Completed Date below and save to mark the plan as Complete.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {currentPhase.key === "COMPLETE" && (
              <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
                <p className="text-sm text-primary leading-relaxed mb-3">
                  Your Breeding Plan is in the <span className="text-purple-400 font-medium">Final Completion Phase</span>. Before officially closing out this plan, please ensure all administrative tasks have been completed.
                </p>
                <div className="text-xs text-secondary space-y-1.5 mb-3">
                  <div className="font-medium text-primary mb-1">Pre-Completion Checklist:</div>
                  <div className="pl-3 space-y-1">
                    <div>• All health records have been entered for each individual offspring</div>
                    <div>• All client contracts and agreements have been signed and completed</div>
                    <div>• All invoices and financial transactions have been closed out</div>
                    <div>• All media (photos and videos) have been uploaded to the Offspring Group or individual Offspring pages</div>
                  </div>
                </div>
                <p className="text-xs text-secondary">
                  <span className="font-medium text-primary">Tip:</span> Once all tasks are complete, enter the official Plan Completed Date below to close out this breeding plan.
                </p>
                <p className="mt-2 text-xs text-secondary italic">
                  Remember: You must be in <span className="font-medium text-red-500 underline">EDIT</span> mode to make changes to the plan.
                </p>
              </div>
            )}

            {/* Optional: Hormone Testing Start Date - shown in expanded view for BREEDING phase */}
            {currentPhase.key === "BRED" && onDateChange && isEdit && (
              <div className="mb-4 p-3 rounded-lg border border-sky-500/40 bg-sky-500/5">
                <div className="text-xs text-sky-300/80 mb-2">
                  <span className="font-medium text-sky-300">Optional:</span> Record when hormone testing began
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-primary font-medium whitespace-nowrap">Hormone Testing Started:</label>
                  <DatePicker
                    value={actualHormoneTestingStartDate ?? ""}
                    defaultDate={expectedHormoneTestingStartDate ?? undefined}
                    onChange={(e) => onDateChange("actualHormoneTestingStartDate", e.currentTarget.value || null)}
                    className="flex-1"
                    inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-sky-500/40 bg-surface text-primary focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/30"
                  />
                </div>
              </div>
            )}

            {/* Requirements checklist */}
            {nextPhase && requirements.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-secondary">
                  In order to advance the plan to the {nextPhase.label} phase you must complete the following tasks:
                </div>
                <div className="space-y-1.5">
                  {requirements.map(req => {
                    // Get formatted action with gold highlighting for key terms
                    const GoldText = ({ children }: { children: React.ReactNode }) => (
                      <span data-gold-highlight="true">{children}</span>
                    );
                    const getFormattedAction = () => {
                      switch (req.key) {
                        case "planName":
                          return <>enter a <GoldText>Plan Name</GoldText></>;
                        case "species":
                          return <>select a <GoldText>Species</GoldText></>;
                        case "breed":
                          return <>choose the offspring <GoldText>Breed</GoldText> for this plan</>;
                        case "sire":
                          return <>your plan must have <GoldText>Sire</GoldText> selected</>;
                        case "dam":
                          return <>your plan must have a <GoldText>Dam</GoldText> selected</>;
                        case "cycle":
                          return <>select and lock a <GoldText>Cycle Start</GoldText> date</>;
                        default:
                          return <>{req.action?.toLowerCase() ?? ''}</>;
                      }
                    };

                    // Check if this is a date-based requirement
                    const isDateRequirement = ["cycleStart", "breedDate", "birthDate", "weanedDate", "placementStarted", "placementCompleted"].includes(req.key);
                    const actualDate = isDateRequirement ? getActualDateForRequirement(req.key) : null;

                    // Map requirement key to the onDateChange field name
                    const getDateFieldForRequirement = (reqKey: string): "actualCycleStartDate" | "actualBreedDate" | "actualBirthDate" | "actualWeanedDate" | "actualPlacementStartDate" | "actualPlacementCompletedDate" | null => {
                      switch (reqKey) {
                        case "cycleStart": return "actualCycleStartDate";
                        case "breedDate": return "actualBreedDate";
                        case "birthDate": return "actualBirthDate";
                        case "weanedDate": return "actualWeanedDate";
                        case "placementStarted": return "actualPlacementStartDate";
                        case "placementCompleted": return "actualPlacementCompletedDate";
                        default: return null;
                      }
                    };

                    return (
                      <div key={req.key} className="flex items-center gap-2 text-sm">
                        <span className={req.met ? "text-green-400" : "text-secondary"}>
                          {req.met ? "✓" : "○"}
                        </span>
                        <span className={req.met ? "text-primary" : "text-secondary"}>
                          {req.label}
                          {/* Show the date value when met */}
                          {req.met && actualDate && (
                            <>
                              <span className="ml-1">—</span>
                              <span className="ml-1 text-green-400 font-medium">
                                {formatDateDisplay(actualDate)}
                              </span>
                            </>
                          )}
                          {/* Show Change button when met and in edit mode - clears the date to go back to input state */}
                          {req.met && isDateRequirement && isEdit && onDateChange && (
                            <button
                              type="button"
                              onClick={() => {
                                const field = getDateFieldForRequirement(req.key);
                                if (field) {
                                  onDateChange(field, null);
                                }
                              }}
                              className="ml-2 text-xs text-secondary hover:text-primary underline"
                            >
                              Change
                            </button>
                          )}
                          {!req.met && req.action && (
                            <span style={{ color: "inherit" }}> ({getFormattedAction()})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Inline date input for date-based requirements - HIGHLIGHTED */}
                {/* Show when: requirements not met */}
                {/* Don't show for COMMITTED phase since it has no date input - only cycle lock is needed */}
                {requirements.length > 0 && onDateChange && isEdit && !allRequirementsMet && nextPhase?.key !== "COMMITTED" && (
                  <div className="mt-3 px-2 py-1 rounded-lg border-2 ring-2 soft-pulse border-amber-500/60 bg-amber-500/10 ring-amber-500/20">
                    <div className="text-xs font-medium mb-1 text-amber-400">
                      Enter the required information below:
                    </div>
                    {nextPhase.key === "BRED" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Cycle Start (Actual):</label>
                        <DatePicker
                          value={actualCycleStartDate ?? ""}
                          defaultDate={expectedCycleStartDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualCycleStartDate", val || null);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualCycleStart ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                    {nextPhase.key === "BIRTHED" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Breed Date (Actual):</label>
                        <DatePicker
                          value={actualBreedDate ?? ""}
                          defaultDate={expectedBreedDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualBreedDate", val || null);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualBreedDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                    {nextPhase.key === "WEANED" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Birth Date (Actual):</label>
                        <DatePicker
                          value={actualBirthDate ?? ""}
                          defaultDate={expectedBirthDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualBirthDate", val || null);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualBirthDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                    {nextPhase.key === "PLACEMENT_STARTED" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Weaning Completed (Actual):</label>
                        <DatePicker
                          value={actualWeanedDate ?? ""}
                          defaultDate={expectedWeanedDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualWeanedDate", val || null);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasActualWeanedDate ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                    {nextPhase.key === "PLACEMENT_COMPLETED" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Placement Start Date (Actual):</label>
                        <DatePicker
                          value={actualPlacementStartDate ?? ""}
                          defaultDate={expectedPlacementStartDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val) {
                              onDateChange("actualPlacementStartDate", null);
                            } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualPlacementStartDate", val);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlacementStarted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                    {nextPhase.key === "COMPLETE" && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-primary font-medium whitespace-nowrap">Placement Completed Date (Actual):</label>
                        <DatePicker
                          value={actualPlacementCompletedDate ?? ""}
                          defaultDate={expectedPlacementCompletedDate ?? undefined}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            if (!val) {
                              onDateChange("actualPlacementCompletedDate", null);
                            } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                              onDateChange("actualPlacementCompletedDate", val);
                            }
                          }}
                          className="flex-1"
                          inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlacementCompleted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Advance button */}
                {allRequirementsMet && onAdvancePhase && isEdit && (
                  <button
                    type="button"
                    onClick={async () => {
                      // Show confirmation dialog when advancing to Committed phase
                      if (nextPhase.key === "COMMITTED" && confirmModal) {
                        const confirmed = await confirmModal({
                          title: "Commit to This Breeding Plan?",
                          message: (
                            <div className="space-y-3">
                              <p>You are about to commit to this breeding plan. This confirms that you have:</p>
                              <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>Finalized your dam and sire selection</li>
                                <li>Locked in your estimated cycle start date</li>
                                <li>Every intention to proceed with breeding this pairing</li>
                              </ul>
                              <p className="text-sm text-secondary mt-2">
                                You can still make changes after committing, but this marks the plan as actively in progress.
                              </p>
                            </div>
                          ),
                          confirmText: "I'm Committed",
                          cancelText: "Not Yet",
                        });
                        if (!confirmed) return;
                      }
                      onAdvancePhase(nextPhase.key);
                    }}
                    className="mt-3 w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors animate-pulse"
                  >
                    Advance to {nextPhase.label} Phase
                  </button>
                )}

              </div>
            )}

            {/* Celebration message - show when in PLACEMENT_COMPLETED phase and placement completed date is entered */}
            {/* Note: hasPlacementCompleted implies allRequirementsMet since that's the only requirement for COMPLETE phase */}
            {currentPhase.key === "PLACEMENT_COMPLETED" && hasPlacementCompleted && (
              <div className="relative rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-amber-500/20 border-2 border-emerald-400/40 p-6 text-center overflow-hidden celebration-card mt-4">
                {/* Confetti animation */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="confetti">🎉</div>
                  <div className="confetti">🎊</div>
                  <div className="confetti">✨</div>
                  <div className="confetti">🌟</div>
                  <div className="confetti">🎉</div>
                  <div className="confetti">🎊</div>
                  <div className="confetti">✨</div>
                  <div className="confetti">🌟</div>
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-3 animate-bounce">🎉</div>
                  <div className="text-emerald-400 text-xl font-bold mb-2 celebrate-text">
                    Congratulations!
                  </div>
                  <div className="text-emerald-300 text-lg font-semibold mb-3">
                    All Offspring Placed Successfully!
                  </div>
                  <div className="text-sm text-emerald-200/80 max-w-md mx-auto">
                    All offspring have been successfully placed with their new families.
                    You've put in a lot of hard work getting here - well done! 🏆
                  </div>
                  <div className="mt-4 text-xs text-emerald-300/70">
                    Click "Advance to Plan Complete Phase" above to close out this breeding plan.
                  </div>
                </div>
              </div>
            )}

            {/* Phase 8 (COMPLETE) - Prompt for official plan completed date (EDIT MODE ONLY) */}
            {currentPhase.key === "COMPLETE" && !hasPlanCompleted && isEdit && onDateChange && (
              <div className="mt-4 px-4 py-3 rounded-lg border-2 ring-2 soft-pulse border-amber-500/60 bg-amber-500/10 ring-amber-500/20">
                <div className="text-sm font-medium mb-3 text-amber-400">
                  Enter the official plan completion date to close out this breeding plan:
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-primary font-medium whitespace-nowrap">Plan Completed (Actual):</label>
                  <DatePicker
                    value={actualPlanCompletedDate ?? ""}
                    defaultDate={expectedPlanCompletedDate ?? undefined}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      if (!val) {
                        onDateChange("actualPlanCompletedDate", null);
                      } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        onDateChange("actualPlanCompletedDate", val);
                      }
                    }}
                    className="flex-1"
                    inputClassName={`w-full px-2 py-1 text-sm rounded-lg border-2 bg-surface text-primary focus:outline-none focus:ring-2 ${hasPlanCompleted ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/30" : "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30"}`}
                  />
                </div>
                <div className="mt-2 text-xs text-amber-300/70">
                  This marks the official completion date of your breeding plan.
                </div>
              </div>
            )}

            {/* Final completion message - show when plan completed date has been entered */}
            {currentPhase.key === "COMPLETE" && hasPlanCompleted && (
              <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                <div className="text-emerald-500 text-lg font-semibold mb-2">
                  ✓ Breeding Plan Complete
                </div>
                <div className="text-sm text-emerald-400/80 mb-2">
                  This breeding plan has been successfully completed and closed.
                </div>
                {actualPlanCompletedDate && (
                  <div className="text-xs text-emerald-300/70">
                    Completed on {formatDateDisplay(actualPlanCompletedDate)}
                  </div>
                )}
                {/* Show Change button when in edit mode - allows user to modify completion date */}
                {isEdit && onDateChange && (
                  <button
                    type="button"
                    onClick={() => onDateChange("actualPlanCompletedDate", null)}
                    className="mt-3 text-xs text-secondary hover:text-primary underline"
                  >
                    Change Completion Date
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS for animated marching ants line, gold highlighting, soft pulse, and celebration effects */}
      <style>{`
        @keyframes marchingAnts {
          0% { background-position: 0 0; }
          100% { background-position: 24px 0; }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
          50% { opacity: 0.92; box-shadow: 0 0 12px 2px rgba(251, 191, 36, 0.15); }
        }
        .soft-pulse {
          animation: softPulse 2.5s ease-in-out infinite;
        }
        [data-gold-highlight="true"] {
          color: #fbbf24 !important;
          font-weight: 600 !important;
        }

        /* Celebration animations */
        .celebration-card {
          animation: celebrationPulse 3s ease-in-out infinite;
        }
        @keyframes celebrationPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(52, 211, 153, 0.3), 0 0 40px rgba(52, 211, 153, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(52, 211, 153, 0.5), 0 0 60px rgba(52, 211, 153, 0.2);
          }
        }

        .celebrate-text {
          animation: colorShift 3s ease-in-out infinite;
        }
        @keyframes colorShift {
          0%, 100% { color: #34d399; }
          33% { color: #fbbf24; }
          66% { color: #60a5fa; }
        }

        /* Confetti animation */
        .confetti {
          position: absolute;
          font-size: 1.5rem;
          animation: confettiFall 4s ease-in-out infinite;
          opacity: 0;
        }
        .confetti:nth-child(1) { left: 10%; animation-delay: 0s; }
        .confetti:nth-child(2) { left: 25%; animation-delay: 0.5s; }
        .confetti:nth-child(3) { left: 40%; animation-delay: 1s; }
        .confetti:nth-child(4) { left: 55%; animation-delay: 1.5s; }
        .confetti:nth-child(5) { left: 70%; animation-delay: 2s; }
        .confetti:nth-child(6) { left: 85%; animation-delay: 2.5s; }
        .confetti:nth-child(7) { left: 15%; animation-delay: 3s; }
        .confetti:nth-child(8) { left: 90%; animation-delay: 3.5s; }

        @keyframes confettiFall {
          0% {
            top: -10%;
            opacity: 0;
            transform: translateX(0) rotate(0deg);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 110%;
            opacity: 0;
            transform: translateX(100px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default PlanJourney;

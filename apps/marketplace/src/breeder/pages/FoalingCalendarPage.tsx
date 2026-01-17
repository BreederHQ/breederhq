// apps/marketplace/src/breeder/pages/FoalingCalendarPage.tsx
// Dedicated Foaling Calendar page showing all expected and actual foaling dates
// Provides month/year calendar view with color-coded dots and summary cards

import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@bhq/ui";
import {
  Baby,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Eye,
} from "lucide-react";

import { getBreederBreedingPlans, type BreederBreedingPlanItem } from "../../api/client";
import { calculateFoalingStatus, type FoalingStatus } from "../../../../breeding/src/components/FoalingCountdownBadge";
import { FoalingCountdownBadge } from "../../../../breeding/src/components/FoalingCountdownBadge";
import { RecordFoalingModal } from "../../../../breeding/src/components/RecordFoalingModal";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isSameMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CalendarEvent {
  plan: BreederBreedingPlanItem;
  date: Date;
  type: "expected" | "actual";
  status: FoalingStatus;
  daysUntil: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════════════════

function SummaryCards({
  overdue,
  imminent,
  upcoming,
  foaled,
}: {
  overdue: number;
  imminent: number;
  upcoming: number;
  foaled: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Overdue */}
      <div
        className={`rounded-xl p-4 border ${
          overdue > 0
            ? "bg-red-500/10 border-red-500/30"
            : "bg-portal-card border-hairline"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              overdue > 0 ? "bg-red-500/20" : "bg-white/5"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                overdue > 0 ? "text-red-400" : "text-secondary"
              }`}
            />
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                overdue > 0 ? "text-red-400" : "text-secondary"
              }`}
            >
              {overdue}
            </div>
            <div className="text-xs text-secondary">Overdue</div>
          </div>
        </div>
      </div>

      {/* Imminent (< 14 days) */}
      <div
        className={`rounded-xl p-4 border ${
          imminent > 0
            ? "bg-orange-500/10 border-orange-500/30"
            : "bg-portal-card border-hairline"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              imminent > 0 ? "bg-orange-500/20" : "bg-white/5"
            }`}
          >
            <Clock
              className={`w-5 h-5 ${
                imminent > 0 ? "text-orange-400" : "text-secondary"
              }`}
            />
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                imminent > 0 ? "text-orange-400" : "text-secondary"
              }`}
            >
              {imminent}
            </div>
            <div className="text-xs text-secondary">Within 14 Days</div>
          </div>
        </div>
      </div>

      {/* Upcoming (14-60 days) */}
      <div className="rounded-xl p-4 bg-portal-card border border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{upcoming}</div>
            <div className="text-xs text-secondary">Upcoming</div>
          </div>
        </div>
      </div>

      {/* Foaled This Year */}
      <div className="rounded-xl p-4 bg-portal-card border border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{foaled}</div>
            <div className="text-xs text-secondary">Foaled This Year</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function FoalingCalendar({
  events,
  currentMonth,
  onMonthChange,
  onEventClick,
}: {
  events: CalendarEvent[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  // Get first day of month and days in month
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Build calendar grid
  const calendarDays: Array<Date | null> = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
    );
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((e) => isSameDay(e.date, date));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goToPrevMonth = () => {
    const prev = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    onMonthChange(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    onMonthChange(next);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="bg-portal-card border border-hairline rounded-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {formatMonthYear(currentMonth)}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-secondary" />
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-hairline">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-secondary uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[100px] border-b border-r border-hairline bg-portal-surface/30"
              />
            );
          }

          const dayEvents = getEventsForDate(date);
          const isToday = isSameDay(date, today);
          const isCurrentMonth = isSameMonth(date, currentMonth);

          return (
            <div
              key={date.toISOString()}
              className={`min-h-[100px] border-b border-r border-hairline p-2 ${
                isCurrentMonth ? "bg-portal-card" : "bg-portal-surface/30"
              } ${isToday ? "ring-2 ring-inset ring-accent/50" : ""}`}
            >
              {/* Day Number */}
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday
                    ? "text-accent"
                    : isCurrentMonth
                      ? "text-white"
                      : "text-secondary/50"
                }`}
              >
                {date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => {
                  const bgColor =
                    event.status === "OVERDUE" || event.status === "DUE_TODAY"
                      ? "bg-red-500"
                      : event.status === "IMMINENT"
                        ? "bg-orange-500"
                        : event.status === "FOALED"
                          ? "bg-emerald-500"
                          : "bg-blue-500";

                  return (
                    <button
                      key={`${event.plan.id}-${i}`}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate text-white ${bgColor} hover:opacity-80 transition-opacity`}
                      title={`${event.plan.dam?.name || event.plan.name} - ${event.type === "actual" ? "Born" : "Expected"} ${formatDate(event.type === "actual" ? event.plan.birthDateActual : event.plan.expectedBirthDate)}`}
                    >
                      {event.plan.dam?.name || event.plan.name}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-secondary px-1.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-hairline flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-secondary">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-secondary">Imminent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-secondary">Expected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-secondary">Foaled</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FoalingCalendarPage() {
  const tenantId = getTenantId();

  const [plans, setPlans] = React.useState<BreederBreedingPlanItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  // Foaling modal state
  const [foalingPlan, setFoalingPlan] = React.useState<BreederBreedingPlanItem | null>(null);

  // Load breeding plans
  React.useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    getBreederBreedingPlans(tenantId, { limit: 200 })
      .then((res) => {
        // Filter for HORSE species only
        const horsePlans = (res.items || []).filter(
          (p) => p.species?.toUpperCase() === "HORSE"
        );
        setPlans(horsePlans);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  // Build calendar events
  const events = React.useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = [];

    for (const plan of plans) {
      const { status, daysUntil } = calculateFoalingStatus(
        plan.expectedBirthDate,
        plan.birthDateActual,
        plan.breedDateActual
      );

      // Add expected date event
      if (plan.expectedBirthDate && !plan.birthDateActual) {
        result.push({
          plan,
          date: new Date(plan.expectedBirthDate),
          type: "expected",
          status,
          daysUntil,
        });
      }

      // Add actual birth date event
      if (plan.birthDateActual) {
        result.push({
          plan,
          date: new Date(plan.birthDateActual),
          type: "actual",
          status: "FOALED",
          daysUntil: null,
        });
      }
    }

    return result;
  }, [plans]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    let overdue = 0;
    let imminent = 0;
    let upcoming = 0;
    let foaled = 0;

    const thisYear = new Date().getFullYear();

    for (const plan of plans) {
      const { status } = calculateFoalingStatus(
        plan.expectedBirthDate,
        plan.birthDateActual,
        plan.breedDateActual
      );

      if (status === "OVERDUE" || status === "DUE_TODAY") {
        overdue++;
      } else if (status === "IMMINENT") {
        imminent++;
      } else if (status === "EXPECTING" || status === "MONITORING") {
        upcoming++;
      } else if (status === "FOALED" && plan.birthDateActual) {
        const birthYear = new Date(plan.birthDateActual).getFullYear();
        if (birthYear === thisYear) {
          foaled++;
        }
      }
    }

    return { overdue, imminent, upcoming, foaled };
  }, [plans]);

  // Handle foaling submission
  const handleFoalingSubmit = React.useCallback(
    async (data: {
      actualBirthDate: string;
      foals: Array<{ sex: "MALE" | "FEMALE"; color?: string; name?: string }>;
    }) => {
      if (!foalingPlan || !tenantId) return;

      const response = await fetch(
        `/api/v1/breeding/plans/${foalingPlan.id}/record-foaling`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}`
        );
      }

      // Refresh plans
      const res = await getBreederBreedingPlans(tenantId, { limit: 200 });
      const horsePlans = (res.items || []).filter(
        (p) => p.species?.toUpperCase() === "HORSE"
      );
      setPlans(horsePlans);
      setFoalingPlan(null);
      setSelectedEvent(null);
    },
    [foalingPlan, tenantId]
  );

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-portal-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/manage/breeding-programs"
            className="inline-flex items-center gap-2 text-sm text-secondary hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Breeding Programs
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15">
              <Baby className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Foaling Calendar</h1>
              <p className="text-sm text-secondary">
                Track expected and actual foaling dates for your breeding program
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards {...stats} />

        {/* Calendar */}
        <FoalingCalendar
          events={events}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEventClick={handleEventClick}
        />

        {/* Event Detail Popover */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="bg-portal-card border border-hairline rounded-xl max-w-md w-full p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedEvent.plan.dam?.name || selectedEvent.plan.name}
                  </h3>
                  {selectedEvent.plan.sire && (
                    <p className="text-sm text-secondary">
                      × {selectedEvent.plan.sire.name}
                    </p>
                  )}
                </div>
                <FoalingCountdownBadge
                  expectedBirthDate={selectedEvent.plan.expectedBirthDate}
                  birthDateActual={selectedEvent.plan.birthDateActual}
                  breedDateActual={selectedEvent.plan.breedDateActual}
                  size="md"
                />
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-secondary">Expected:</span>
                  <span className="text-white">
                    {formatDate(selectedEvent.plan.expectedBirthDate)}
                  </span>
                </div>
                {selectedEvent.plan.birthDateActual && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Actual Birth:</span>
                    <span className="text-emerald-400">
                      {formatDate(selectedEvent.plan.birthDateActual)}
                    </span>
                  </div>
                )}
                {selectedEvent.plan.breedDateActual && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Bred:</span>
                    <span className="text-white">
                      {formatDate(selectedEvent.plan.breedDateActual)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!selectedEvent.plan.birthDateActual &&
                  selectedEvent.plan.breedDateActual && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setFoalingPlan(selectedEvent.plan);
                      }}
                    >
                      <Baby className="w-4 h-4 mr-1.5" />
                      Record Foaling
                    </Button>
                  )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Record Foaling Modal */}
        <RecordFoalingModal
          open={!!foalingPlan}
          onClose={() => setFoalingPlan(null)}
          planId={foalingPlan?.id ?? 0}
          damName={foalingPlan?.dam?.name}
          sireName={foalingPlan?.sire?.name}
          expectedBirthDate={foalingPlan?.expectedBirthDate}
          breedDateActual={foalingPlan?.breedDateActual}
          onSubmit={handleFoalingSubmit}
        />
      </div>
    </div>
  );
}

export default FoalingCalendarPage;

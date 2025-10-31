import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/calendar.css";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;               // exclusive end for FullCalendar
  allDay?: boolean;
  calendarId?: string;               // which left-rail toggle controls this
  color?: string;                    // color dot and event color
  extendedProps?: Record<string, unknown>;
};

export type CalendarGroup = {
  id: string;                        // e.g., "females:dog", "breeding:plans"
  label: string;                     // section heading
  items: Array<{
    id: string;                      // e.g., "female:12" or "plan:5"
    label: string;                   // what shows in the rail
    color?: string;
    defaultOn?: boolean;
  }>;
};

export type BHQCalendarProps = {
  events: CalendarEvent[];
  groups?: CalendarGroup[];          // left-rail checkboxes, in order
  storageKey?: string;               // persist which calendars are on
  initialView?: "dayGridMonth" | "dayGridWeek";
  headerTitle?: string;
  onEventClick?: (ev: CalendarEvent) => void;
  className?: string;
};

const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

export default function BHQCalendar({
  events,
  groups = [],
  storageKey = "bhq_calendar_prefs_v1",
  initialView = "dayGridMonth",
  headerTitle,
  onEventClick,
  className,
}: BHQCalendarProps) {
  const allIds = React.useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.id)),
    [groups]
  );

  const [enabled, setEnabled] = React.useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    const defaults = groups.flatMap((g) => g.items.filter((i) => i.defaultOn).map((i) => i.id));
    return new Set(defaults.length ? defaults : allIds);
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(enabled)));
    } catch {}
  }, [enabled, storageKey]);

  function toggle(id: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleEvents = React.useMemo(() => {
    return events
      .filter((e) => !e.calendarId || enabled.has(e.calendarId))
      .map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay ?? true,
        extendedProps: { ...e.extendedProps, color: e.color, calendarId: e.calendarId },
        color: e.color,
      }));
  }, [events, enabled]);

  const Dot: React.FC<{ color?: string }> = ({ color }) => (
    <span
      className="inline-block h-2 w-2 rounded-full mr-2"
      style={{ backgroundColor: color || "var(--fc-event-border-color, #888)" }}
      aria-hidden
    />
  );

  function MiniMonth() {
    const [current, setCurrent] = React.useState(() => {
      const d = new Date();
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
    });
    const monthName = current.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    function shift(by: number) {
      setCurrent((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + by, 1)));
    }

    function weeksOfMonth(first: Date) {
      const firstDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
      const startDay = firstDay.getUTCDay();
      const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
      const cells: Array<{ day: number | null }> = [];
      for (let i = 0; i < startDay; i++) cells.push({ day: null });
      for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
      while (cells.length % 7 !== 0) cells.push({ day: null });
      const rows: typeof cells[] = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
      return rows;
    }

    const rows = weeksOfMonth(current);
    const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
      <div className="text-xs" role="group" aria-label={`Mini month ${monthName}`}>
        <div className="flex items-center justify-between mb-1">
          <button
            className="px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
            onClick={() => shift(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="font-medium" aria-live="polite">{monthName}</div>
          <button
            className="px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
            onClick={() => shift(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <table className="w-full border-separate border-spacing-y-[2px]" role="grid" aria-readonly>
          <thead>
            <tr>
              {DOW_FULL.map((label, i) => (
                <th key={`dow-${i}`} className="text-[10px] font-normal text-center text-gray-500" title={label} scope="col">
                  {label[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="h-6 text-center align-middle">
                    {c.day ? (
                      <span className="inline-block min-w-[18px]" aria-label={`Day ${c.day}`}>{c.day}</span>
                    ) : (
                      <span className="inline-block min-w-[18px] opacity-0">.</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn("bhq-cal flex gap-3", className)}>
      {/* Left rail */}
      <aside
        className="w-[220px] shrink-0 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 h-max"
        aria-label="Calendar filters"
      >
        <MiniMonth />
        {groups.map((group) => (
          <div key={group.id} className="mt-3" role="group" aria-label={group.label}>
            <div className="bhq-cal__rail-head mb-1">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={enabled.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Toggle ${item.label}`}
                  />
                  <Dot color={item.color} />
                  <span className="truncate" title={item.label}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {allIds.length > 0 && (
          <div className="mt-3 flex gap-2">
            <button className="bhq-chip text-xs px-2 py-1 rounded" onClick={() => setEnabled(new Set(allIds))} aria-label="Enable all calendars">
              All
            </button>
            <button className="bhq-chip text-xs px-2 py-1 rounded" onClick={() => setEnabled(new Set())} aria-label="Disable all calendars">
              Clear
            </button>
          </div>
        )}
      </aside>

      {/* Main calendar */}
      <div className="flex-1">
        {headerTitle ? <div className="mb-2 text-sm font-semibold" aria-live="polite">{headerTitle}</div> : null}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={initialView}
          height="auto"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
          buttonText={{ today: "today", month: "month", week: "week" }}
          dayMaxEvents={3}
          events={visibleEvents}
          eventClick={(arg) => {
            const e = arg.event;
            onEventClick?.({
              id: e.id,
              title: e.title,
              start: e.start!,
              end: e.end ?? undefined,
              allDay: e.allDay,
              calendarId: (e as any)._def?.extendedProps?.calendarId ?? undefined,
              color: (e as any).backgroundColor || (e as any).borderColor,
              extendedProps: e.extendedProps as any,
            });
          }}
          eventColor=""
          eventBackgroundColor=""
          eventBorderColor=""
          eventDidMount={(info) => {
            const props = (info.event as any).extendedProps || {};
            const color = props.color || (info.event as any).backgroundColor;
            const variant = props.variant as "range" | "expected" | "actual" | "availability" | undefined;

            // Base color plumbing
            if (color) info.el.style.setProperty("--fc-event-border-color", color);

            if (variant === "expected") {
              info.el.style.backgroundColor = "transparent";
              info.el.style.borderColor = color || "currentColor";
              info.el.style.borderStyle = "dashed";
              info.el.style.color = "var(--cal-text, #e5e7eb)";
              return;
            }

            if (variant === "actual") {
              info.el.style.backgroundColor = color || "var(--cal-btn-bg,#374151)";
              info.el.style.borderColor = color || "var(--cal-btn-bg,#374151)";
              info.el.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.14) inset";
              info.el.style.color = "white";
              return;
            }

            if (variant === "availability") {
              const kind = (props as any).availabilityKind as "risky" | "unlikely" | undefined;
              // transparent fill with tinted border/background to act like a wrapper
              const tint =
                kind === "risky" ? "rgba(239, 68, 68, 0.18)" : // red-500 @ ~18%
                "rgba(245, 158, 11, 0.16)";                     // amber-500 @ ~16%
              const stroke =
                kind === "risky" ? "rgba(239, 68, 68, 0.9)" :   // red-500 strong
                "rgba(245, 158, 11, 0.9)";                      // amber-500 strong

              info.el.style.backgroundColor = tint;
              info.el.style.borderColor = stroke;
              info.el.style.borderStyle = "dashed";
              info.el.style.color = "var(--cal-text, #e5e7eb)";
              return;
            }

            // range default – filled
            if (color) {
              info.el.style.backgroundColor = color;
              info.el.style.borderColor = color;
              info.el.style.color = "white";
            }
          }}
        />
      </div>
    </div>
  );
}

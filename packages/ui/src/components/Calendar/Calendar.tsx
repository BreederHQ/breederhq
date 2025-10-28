import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string; // exclusive end
  allDay?: boolean;
  extendedProps?: Record<string, unknown>;
};

export type BHQCalendarProps = {
  events: CalendarEvent[];
  initialView?: "dayGridMonth" | "dayGridWeek";
  headerTitle?: string;
  onEventClick?: (ev: CalendarEvent) => void;
  className?: string;
};

export default function BHQCalendar({
  events,
  initialView = "dayGridMonth",
  headerTitle,
  onEventClick,
  className,
}: BHQCalendarProps) {
  return (
    <div className={className}>
      {headerTitle ? <div className="mb-2 text-sm font-semibold">{headerTitle}</div> : null}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        height="auto"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
        events={events}
        eventClick={(arg) => {
          const e = arg.event;
          onEventClick?.({
            id: e.id,
            title: e.title,
            start: e.start!,
            end: e.end ?? undefined,
            allDay: e.allDay,
            extendedProps: e.extendedProps as any,
          });
        }}
      />
    </div>
  );
}

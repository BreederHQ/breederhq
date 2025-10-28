// imports
import BHQCalendar from "@bhq/ui/components/Calendar";
import { planToCalendarEvents } from "./adapters/planToEvents";

// where you map plans to events:
const events = plans.flatMap(p => planToCalendarEvents({
  id: p.id,
  species: p.species,
  earliestHeatStart: p.earliestHeatStart,
  latestHeatStart: p.latestHeatStart,
  ovulationDate: p.ovulationDate ?? null,
  title: p.name,
}));

<BHQCalendar
  headerTitle="Breeding Calendar"
  events={events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay ?? true,
    extendedProps: e.meta,
  }))}
  onEventClick={(ev) => {
    const planId = String(ev.extendedProps?.planId ?? "");
    if (planId) {
      // route to your planner or plan drawer
      navigateToPlan(planId);
    }
  }}
/>;

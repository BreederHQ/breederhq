// apps/contacts/src/components/EventsSection.tsx
// Events & Follow-ups section for the Overview tab

import * as React from "react";
import { SectionCard, Button, Input } from "@bhq/ui";
import { Calendar, Bell, CheckCircle, Clock, Plus, Trash2, Gift, Award, X } from "lucide-react";
import type { PartyEvent, PartyMilestone, EventKind, MilestoneKind, EventStatus } from "@bhq/api";

interface EventsSectionProps {
  partyId: number;
  partyName: string;
  birthday?: string | null;
  api: {
    partyCrm: {
      events: {
        list: (params: { partyId?: number; status?: EventStatus }) => Promise<{ items: PartyEvent[]; total: number }>;
        create: (input: any) => Promise<PartyEvent>;
        update: (partyId: number, eventId: number | string, input: any) => Promise<PartyEvent>;
        delete: (partyId: number, eventId: number | string) => Promise<{ success: true }>;
        complete: (partyId: number, eventId: number | string) => Promise<PartyEvent>;
      };
      milestones: {
        list: (partyId: number) => Promise<{ items: PartyMilestone[]; total: number }>;
        create: (input: any) => Promise<PartyMilestone>;
        update: (partyId: number, milestoneId: number | string, input: any) => Promise<PartyMilestone>;
        delete: (partyId: number, milestoneId: number | string) => Promise<{ success: true }>;
      };
    };
  };
}

const EVENT_KINDS: { value: EventKind; label: string; icon: React.ReactNode }[] = [
  { value: "FOLLOW_UP", label: "Follow-up", icon: <Bell className="h-3.5 w-3.5" /> },
  { value: "CALL", label: "Call", icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "MEETING", label: "Meeting", icon: <Calendar className="h-3.5 w-3.5" /> },
  { value: "VISIT", label: "Visit", icon: <CheckCircle className="h-3.5 w-3.5" /> },
];

const MILESTONE_KINDS: { value: MilestoneKind; label: string; icon: React.ReactNode }[] = [
  { value: "BIRTHDAY", label: "Birthday", icon: <Gift className="h-3.5 w-3.5" /> },
  { value: "PLACEMENT_ANNIVERSARY", label: "Placement Anniversary", icon: <Award className="h-3.5 w-3.5" /> },
  { value: "CUSTOMER_ANNIVERSARY", label: "Customer Anniversary", icon: <Award className="h-3.5 w-3.5" /> },
  { value: "CUSTOM", label: "Custom", icon: <Calendar className="h-3.5 w-3.5" /> },
];

export function EventsSection({ partyId, partyName, birthday, api }: EventsSectionProps) {
  const [events, setEvents] = React.useState<PartyEvent[]>([]);
  const [milestones, setMilestones] = React.useState<PartyMilestone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Add event form
  const [showAddEvent, setShowAddEvent] = React.useState(false);
  const [newEventKind, setNewEventKind] = React.useState<EventKind>("FOLLOW_UP");
  const [newEventTitle, setNewEventTitle] = React.useState("");
  const [newEventDate, setNewEventDate] = React.useState("");
  const [savingEvent, setSavingEvent] = React.useState(false);

  // Add milestone form
  const [showAddMilestone, setShowAddMilestone] = React.useState(false);
  const [newMilestoneKind, setNewMilestoneKind] = React.useState<MilestoneKind>("BIRTHDAY");
  const [newMilestoneLabel, setNewMilestoneLabel] = React.useState("");
  const [newMilestoneDate, setNewMilestoneDate] = React.useState("");
  const [savingMilestone, setSavingMilestone] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, milestonesRes] = await Promise.all([
        api.partyCrm.events.list({ partyId, status: "SCHEDULED" }),
        api.partyCrm.milestones.list(partyId),
      ]);
      setEvents(eventsRes.items);
      setMilestones(milestonesRes.items);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [api, partyId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    setSavingEvent(true);
    try {
      const created = await api.partyCrm.events.create({
        partyId,
        kind: newEventKind,
        title: newEventTitle.trim(),
        scheduledAt: new Date(newEventDate).toISOString(),
      });
      setEvents((prev) => [...prev, created].sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
      setNewEventTitle("");
      setNewEventDate("");
      setShowAddEvent(false);
    } catch (e: any) {
      setError(e?.message || "Failed to create event");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleCompleteEvent = async (eventId: number | string) => {
    try {
      await api.partyCrm.events.complete(partyId, eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e: any) {
      setError(e?.message || "Failed to complete event");
    }
  };

  const handleDeleteEvent = async (eventId: number | string) => {
    try {
      await api.partyCrm.events.delete(partyId, eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete event");
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneLabel.trim() || !newMilestoneDate) return;
    setSavingMilestone(true);
    try {
      const created = await api.partyCrm.milestones.create({
        partyId,
        kind: newMilestoneKind,
        label: newMilestoneLabel.trim(),
        date: newMilestoneDate,
        reminderDaysBefore: 7,
        enabled: true,
      });
      setMilestones((prev) => [...prev, created]);
      setNewMilestoneLabel("");
      setNewMilestoneDate("");
      setShowAddMilestone(false);
    } catch (e: any) {
      setError(e?.message || "Failed to create milestone");
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number | string) => {
    try {
      await api.partyCrm.milestones.delete(partyId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete milestone");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days > 1 && days <= 7) return `In ${days} days`;
    if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getEventIcon = (kind: EventKind) => {
    const found = EVENT_KINDS.find((k) => k.value === kind);
    return found?.icon || <Calendar className="h-3.5 w-3.5" />;
  };

  const getMilestoneIcon = (kind: MilestoneKind) => {
    const found = MILESTONE_KINDS.find((k) => k.value === kind);
    return found?.icon || <Calendar className="h-3.5 w-3.5" />;
  };

  // Get upcoming milestone dates for display
  const getNextMilestoneDate = (milestone: PartyMilestone) => {
    const today = new Date();
    const [_, month, day] = milestone.date.split("-").map(Number);
    let nextDate = new Date(today.getFullYear(), month - 1, day);
    if (nextDate < today) {
      nextDate = new Date(today.getFullYear() + 1, month - 1, day);
    }
    return nextDate;
  };

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <span className="text-lg opacity-70">📅</span>
          <span>Events & Reminders</span>
        </span>
      }
      right={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddMilestone(true)}>
            <Gift className="h-3.5 w-3.5 mr-1" />
            Milestone
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddEvent(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Event
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-3 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Add Event Form */}
      {showAddEvent && (
        <div className="mb-4 p-3 rounded-lg border border-[hsl(var(--brand-orange))]/30 bg-[hsl(var(--brand-orange))]/5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Add Event</div>
            <button type="button" onClick={() => setShowAddEvent(false)} className="text-secondary hover:text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={newEventKind}
              onChange={(e) => setNewEventKind(e.target.value as EventKind)}
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
            >
              {EVENT_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <Input
              size="sm"
              placeholder="Title..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle((e.target as HTMLInputElement).value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
            />
            <Button size="sm" onClick={handleAddEvent} disabled={savingEvent || !newEventTitle.trim() || !newEventDate}>
              {savingEvent ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

      {/* Add Milestone Form */}
      {showAddMilestone && (
        <div className="mb-4 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Add Milestone</div>
            <button type="button" onClick={() => setShowAddMilestone(false)} className="text-secondary hover:text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={newMilestoneKind}
              onChange={(e) => setNewMilestoneKind(e.target.value as MilestoneKind)}
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
            >
              {MILESTONE_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <Input
              size="sm"
              placeholder="Label..."
              value={newMilestoneLabel}
              onChange={(e) => setNewMilestoneLabel((e.target as HTMLInputElement).value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
            <input
              type="date"
              value={newMilestoneDate}
              onChange={(e) => setNewMilestoneDate(e.target.value)}
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
            />
            <Button size="sm" onClick={handleAddMilestone} disabled={savingMilestone || !newMilestoneLabel.trim() || !newMilestoneDate}>
              {savingMilestone ? "Adding..." : "Add"}
            </Button>
          </div>
          <div className="text-xs text-secondary mt-2">
            Milestones repeat annually. You'll be reminded 7 days before.
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-4 text-center text-sm text-secondary">Loading...</div>
      ) : events.length === 0 && milestones.length === 0 ? (
        <div className="py-6 text-center">
          <Calendar className="h-8 w-8 mx-auto text-secondary/50 mb-2" />
          <div className="text-sm text-secondary mb-1">No events or milestones</div>
          <div className="text-xs text-secondary">
            Add follow-ups, calls, meetings, or recurring milestones like birthdays.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upcoming Events */}
          {events.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                Upcoming Events
              </div>
              <div className="space-y-2">
                {events.map((event) => {
                  const isOverdue = new Date(event.scheduledAt) < new Date();
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 p-2 rounded-md border ${
                        isOverdue
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-hairline bg-surface"
                      }`}
                    >
                      <div className={`p-1.5 rounded ${isOverdue ? "bg-red-500/10 text-red-400" : "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"}`}>
                        {getEventIcon(event.kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{event.title}</div>
                        <div className={`text-xs ${isOverdue ? "text-red-400" : "text-secondary"}`}>
                          {formatDate(event.scheduledAt)}
                          {isOverdue && " (Overdue)"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCompleteEvent(event.id)}
                          className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Mark complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">
                Annual Milestones
              </div>
              <div className="space-y-2">
                {milestones.map((milestone) => {
                  const nextDate = getNextMilestoneDate(milestone);
                  const daysUntil = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUpcoming = daysUntil <= 30;

                  return (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-2 rounded-md border ${
                        !milestone.enabled
                          ? "border-hairline bg-surface opacity-50"
                          : isUpcoming
                          ? "border-purple-500/30 bg-purple-500/5"
                          : "border-hairline bg-surface"
                      }`}
                    >
                      <div className={`p-1.5 rounded ${isUpcoming ? "bg-purple-500/10 text-purple-400" : "bg-surface-strong text-secondary"}`}>
                        {getMilestoneIcon(milestone.kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{milestone.label}</div>
                        <div className="text-xs text-secondary">
                          {nextDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                          {isUpcoming && milestone.enabled && (
                            <span className="text-purple-400 ml-1">
                              ({daysUntil === 0 ? "Today!" : `in ${daysUntil} days`})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="p-1.5 rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

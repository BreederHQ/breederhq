import * as React from "react";
import { PageHeader, SectionCard, Badge, Button } from "@bhq/ui";
import { makeApi } from "@bhq/api";

// ============================================================================
// Types
// ============================================================================

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

interface BusinessHoursSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BusinessHoursResponse {
  schedule: BusinessHoursSchedule;
  timeZone: string;
  isCustom: boolean;
  hasCustomTimeZone: boolean;
  defaults: {
    schedule: BusinessHoursSchedule;
    timeZone: string;
  };
  suggestedTimeZone: string | null;
  organizationZip: string | null;
  quickResponderBadge: boolean;
  avgResponseTimeSeconds: number | null;
  totalResponseCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DAYS: { key: keyof BusinessHoursSchedule; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// Common time options (15-minute intervals)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// Common timezones for US breeders
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];

// ============================================================================
// Helpers
// ============================================================================

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ============================================================================
// Components
// ============================================================================

interface DayRowProps {
  day: { key: keyof BusinessHoursSchedule; label: string };
  schedule: DaySchedule;
  onChange: (update: Partial<DaySchedule>) => void;
  disabled?: boolean;
}

function DayRow({ day, schedule, onChange, disabled }: DayRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-hairline last:border-b-0">
      {/* Day name and toggle */}
      <div className="w-32 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ enabled: !schedule.enabled })}
          disabled={disabled}
          className={`
            relative w-10 h-6 rounded-full transition-colors
            ${schedule.enabled ? "bg-[hsl(var(--brand-orange))]" : "bg-surface-strong"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div
            className={`
              absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
              ${schedule.enabled ? "left-5" : "left-1"}
            `}
          />
        </button>
        <span className={`text-sm font-medium ${schedule.enabled ? "text-primary" : "text-secondary"}`}>
          {day.label}
        </span>
      </div>

      {/* Time selectors */}
      {schedule.enabled ? (
        <div className="flex items-center gap-2">
          <select
            value={schedule.open}
            onChange={(e) => onChange({ open: e.target.value })}
            disabled={disabled}
            className="px-3 py-1.5 rounded-md bg-surface border border-hairline text-sm text-primary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
          <span className="text-secondary text-sm">to</span>
          <select
            value={schedule.close}
            onChange={(e) => onChange({ close: e.target.value })}
            disabled={disabled}
            className="px-3 py-1.5 rounded-md bg-surface border border-hairline text-sm text-primary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
          >
            {TIME_OPTIONS.filter((time) => time > schedule.open).map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <span className="text-sm text-secondary">Closed</span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BusinessHoursPage() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [schedule, setSchedule] = React.useState<BusinessHoursSchedule | null>(null);
  const [timeZone, setTimeZone] = React.useState<string>("America/New_York");
  const [isCustom, setIsCustom] = React.useState(false);
  const [hasCustomTimeZone, setHasCustomTimeZone] = React.useState(false);
  const [defaults, setDefaults] = React.useState<{ schedule: BusinessHoursSchedule; timeZone: string } | null>(null);
  const [suggestedTimeZone, setSuggestedTimeZone] = React.useState<string | null>(null);
  const [organizationZip, setOrganizationZip] = React.useState<string | null>(null);

  // Badge info
  const [quickResponderBadge, setQuickResponderBadge] = React.useState(false);
  const [avgResponseTime, setAvgResponseTime] = React.useState<number | null>(null);
  const [totalResponses, setTotalResponses] = React.useState(0);

  // Fetch current settings
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api.http.get<BusinessHoursResponse>("/business-hours");
        if (ignore) return;
        setSchedule(data.schedule);
        setTimeZone(data.timeZone);
        setIsCustom(data.isCustom);
        setHasCustomTimeZone(data.hasCustomTimeZone);
        setDefaults(data.defaults);
        setSuggestedTimeZone(data.suggestedTimeZone);
        setOrganizationZip(data.organizationZip);
        setQuickResponderBadge(data.quickResponderBadge);
        setAvgResponseTime(data.avgResponseTimeSeconds);
        setTotalResponses(data.totalResponseCount);
      } catch (err: any) {
        if (!ignore) setError(err.message || "Failed to load settings");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [api]);

  const handleDayChange = (day: keyof BusinessHoursSchedule, update: Partial<DaySchedule>) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], ...update },
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await api.http.put<{ ok: boolean; schedule: BusinessHoursSchedule; timeZone: string; isCustom: boolean }>(
        "/business-hours",
        { schedule, timeZone }
      );
      setSchedule(data.schedule);
      setTimeZone(data.timeZone);
      setIsCustom(data.isCustom);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await api.http.put<{ ok: boolean; schedule: BusinessHoursSchedule; timeZone: string; isCustom: boolean }>(
        "/business-hours",
        { resetToDefaults: true }
      );
      setSchedule(data.schedule);
      setTimeZone(data.timeZone);
      setIsCustom(data.isCustom);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/marketing");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-strong rounded w-1/3" />
          <div className="h-4 bg-surface-strong rounded w-1/2" />
          <div className="h-64 bg-surface-strong rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBackClick}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          {isCustom && (
            <Badge variant="success" className="text-xs">CUSTOM</Badge>
          )}
        </div>
        <PageHeader
          title="Business Hours"
          subtitle="Define when you are available for messages and inquiries. Hours outside of business hours won't count against your response time."
        />
      </div>

      {/* Quick Responder Badge Status */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${quickResponderBadge
                ? "bg-[hsl(var(--brand-orange))]/20"
                : "bg-surface-strong"}
            `}>
              {quickResponderBadge ? "⚡" : "🕐"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">Quick Responder Badge</span>
                {totalResponses < 5 ? (
                  <Badge variant="neutral" className="text-xs">PENDING</Badge>
                ) : quickResponderBadge ? (
                  <Badge variant="success" className="text-xs">EARNED</Badge>
                ) : (
                  <Badge variant="neutral" className="text-xs">NOT EARNED</Badge>
                )}
              </div>
              <p className="text-sm text-secondary mt-0.5">
                {totalResponses < 5
                  ? `Respond to ${5 - totalResponses} more ${5 - totalResponses === 1 ? "inquiry" : "inquiries"} to become eligible for this badge`
                  : "Respond within 4 hours (during business hours) to earn this badge"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-secondary">Average Response Time</div>
            <div className="text-lg font-semibold text-primary">
              {formatResponseTime(avgResponseTime)}
            </div>
            <div className="text-xs text-secondary">
              Based on {totalResponses} {totalResponses === 1 ? "response" : "responses"}
              {totalResponses < 5 && " (min. 5 required)"}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Schedule Form */}
      <SectionCard title="Weekly Schedule">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            Settings saved successfully!
          </div>
        )}

        {/* Timezone selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            Time Zone
          </label>
          <select
            value={timeZone}
            onChange={(e) => {
              setTimeZone(e.target.value);
              setSuccess(false);
            }}
            disabled={saving}
            className="w-full max-w-xs px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-secondary">
            Your business hours will be displayed to clients in their local time.
            {!hasCustomTimeZone && (
              suggestedTimeZone
                ? ` Based on your zip code (${organizationZip}), we suggest ${TIMEZONE_OPTIONS.find(tz => tz.value === suggestedTimeZone)?.label || suggestedTimeZone}.`
                : " If you don't set a timezone, Eastern Time (ET) is used by default."
            )}
          </p>
          {!hasCustomTimeZone && suggestedTimeZone && timeZone !== suggestedTimeZone && (
            <button
              type="button"
              onClick={() => {
                setTimeZone(suggestedTimeZone);
                setSuccess(false);
              }}
              className="mt-2 text-xs text-[hsl(var(--brand-orange))] hover:underline"
            >
              Use suggested timezone ({TIMEZONE_OPTIONS.find(tz => tz.value === suggestedTimeZone)?.label})
            </button>
          )}
        </div>

        {/* Day schedules */}
        <div className="border border-hairline rounded-lg overflow-hidden">
          <div className="bg-surface-strong px-4 py-2 border-b border-hairline">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
              Operating Hours
            </span>
          </div>
          <div className="px-4">
            {schedule && DAYS.map((day) => (
              <DayRow
                key={day.key}
                day={day}
                schedule={schedule[day.key]}
                onChange={(update) => handleDayChange(day.key, update)}
                disabled={saving}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {isCustom && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="text-sm text-secondary hover:text-primary transition-colors disabled:opacity-50"
              >
                Reset to defaults
              </button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SectionCard>

      {/* Info about response time */}
      <div className="rounded-xl border border-[hsl(var(--brand-orange))]/20 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-[hsl(var(--brand-teal))]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center text-lg">
            💡
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">How Response Time Works</div>
            <p className="text-xs text-secondary">
              Your response time is only calculated during your business hours. If a customer messages you at 10 PM and you respond at 9 AM the next day, only the time from 9 AM when you open counts toward your response time. This ensures you are not penalized for messages received outside of your operating hours.
            </p>
          </div>
        </div>
      </div>

      {/* Marketplace visibility note */}
      <div className="rounded-xl border border-hairline bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-strong flex items-center justify-center text-lg">
            🏪
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">Marketplace Visibility</div>
            <p className="text-xs text-secondary">
              Your business hours and Quick Responder badge are displayed on your marketplace listing, helping potential customers know when to expect a response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// apps/portal/src/pages/PortalProfilePage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockAppointments, type PortalAppointment } from "../mock";
import { useSession } from "../hooks/useSession";

/* ───────────────── Appointment Row ───────────────── */

function AppointmentRow({ appointment }: { appointment: PortalAppointment }) {
  const statusVariants: Record<PortalAppointment["status"], "green" | "neutral" | "red"> = {
    scheduled: "green",
    completed: "neutral",
    cancelled: "red",
  };

  const statusLabels: Record<PortalAppointment["status"], string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex flex-col items-center justify-center">
            <span className="text-xs text-secondary">{appointment.date.split("-")[1]}</span>
            <span className="text-lg font-bold text-[hsl(var(--brand-orange))]">{appointment.date.split("-")[2]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-primary">{appointment.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusVariants[appointment.status]}>
                {statusLabels[appointment.status]}
              </Badge>
              <span className="text-xs text-secondary">{appointment.time}</span>
            </div>
            <p className="text-xs text-secondary mt-1">{appointment.location}</p>
          </div>
        </div>
        {appointment.status === "scheduled" && (
          <Button variant="secondary" size="sm">
            Reschedule
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Empty Appointments ───────────────── */

function EmptyAppointments() {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-strong flex items-center justify-center text-2xl">
        📅
      </div>
      <h3 className="text-base font-medium text-primary mb-1">No appointments</h3>
      <p className="text-sm text-secondary max-w-xs mx-auto">
        When you have scheduled appointments, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Profile Section ───────────────── */

interface ProfileSectionProps {
  email: string | null;
  orgName: string | null;
  loading: boolean;
}

function ProfileSection({ email, orgName, loading }: ProfileSectionProps) {
  // Get initials from email for avatar
  const initials = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div className="rounded-xl border border-hairline bg-surface/50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-2xl font-semibold text-[hsl(var(--brand-orange))]">
          {loading ? "..." : initials}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-primary">Your Profile</h3>
          {loading ? (
            <p className="text-sm text-secondary mt-1 animate-pulse">Loading...</p>
          ) : (
            <>
              <p className="text-sm text-primary mt-1">{email || "No email"}</p>
              {orgName && (
                <p className="text-xs text-secondary mt-0.5">{orgName}</p>
              )}
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" disabled>
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Change Password
            </Button>
          </div>
          <p className="text-xs text-secondary/70 mt-2 italic">
            Profile editing coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Preferences Section ───────────────── */

function PreferencesSection() {
  return (
    <div className="rounded-xl border border-hairline bg-surface/50 p-6 opacity-60">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-primary">Communication Preferences</h3>
        <Badge variant="neutral">Coming Soon</Badge>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input
            type="checkbox"
            defaultChecked
            disabled
            className="w-4 h-4 rounded border-hairline bg-surface accent-[hsl(var(--brand-orange))] cursor-not-allowed"
          />
          <span className="text-sm text-secondary">Email notifications for messages</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input
            type="checkbox"
            defaultChecked
            disabled
            className="w-4 h-4 rounded border-hairline bg-surface accent-[hsl(var(--brand-orange))] cursor-not-allowed"
          />
          <span className="text-sm text-secondary">Email reminders for tasks</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input
            type="checkbox"
            disabled
            className="w-4 h-4 rounded border-hairline bg-surface accent-[hsl(var(--brand-orange))] cursor-not-allowed"
          />
          <span className="text-sm text-secondary">Marketing emails and updates</span>
        </label>
      </div>
      <div className="mt-4">
        <Button variant="secondary" size="sm" disabled>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalProfilePage() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "appointments">("profile");
  const { session, loading } = useSession();

  // Check URL for tab param
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "appointments") {
      setActiveTab("appointments");
    }
  }, []);

  // Extract session info
  const email = session?.user?.email || null;
  const orgName = session?.org?.name || null;

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your account and preferences"
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mt-6 flex border-b border-hairline">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "profile"
              ? "border-[hsl(var(--brand-orange))] text-primary"
              : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "appointments"
              ? "border-[hsl(var(--brand-orange))] text-primary"
              : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("appointments")}
        >
          Appointments
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "profile" ? (
          <div className="space-y-6">
            <ProfileSection email={email} orgName={orgName} loading={loading} />
            <PreferencesSection />
          </div>
        ) : (
          <>
            {mockAppointments.length === 0 ? (
              <EmptyAppointments />
            ) : (
              <div className="space-y-3">
                {mockAppointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

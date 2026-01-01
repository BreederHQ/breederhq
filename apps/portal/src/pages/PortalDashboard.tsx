// apps/portal/src/pages/PortalDashboard.tsx
import * as React from "react";
import { makeApi } from "@bhq/api";
import { fetchAllTasks } from "../tasks/taskSources";
import { fetchAllNotifications } from "../notifications/notificationSources";

// Resolve API base URL (same pattern as MessagesPage)
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    // Use relative path so Vite proxy handles it (preserves cookies)
    // Return empty string since resource paths already include /api/v1
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  // Strip trailing slashes and /api/v1 suffix since resource paths include it
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

// Dashboard counts state
interface DashboardCounts {
  unreadMessages: number;
  tasks: number;
  notifications: number;
}

function useDashboardCounts() {
  const [counts, setCounts] = React.useState<DashboardCounts>({
    unreadMessages: 0,
    tasks: 0,
    notifications: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      setLoading(true);
      setError(null);

      // Fetch messages, tasks, and notifications in parallel
      const [messagesResult, tasksResult, notificationsResult] = await Promise.allSettled([
        api.messages.threads.list(),
        fetchAllTasks(),
        fetchAllNotifications(),
      ]);

      if (cancelled) return;

      let unreadMessages = 0;
      let taskCount = 0;
      let notificationCount = 0;
      const errors: string[] = [];

      // Process messages result
      if (messagesResult.status === "fulfilled") {
        const threads = messagesResult.value?.threads || [];
        unreadMessages = threads.reduce(
          (sum, t) => sum + (t.unreadCount ?? 0),
          0
        );
      } else {
        const err = messagesResult.reason;
        if (!err?.message?.toLowerCase().includes("not found")) {
          errors.push("messages");
        }
      }

      // Process tasks result - count only action_required tasks
      if (tasksResult.status === "fulfilled") {
        const allTasks = tasksResult.value?.tasks || [];
        taskCount = allTasks.filter(t => t.urgency === "action_required").length;
      } else {
        // Tasks failures are non-blocking, just log
        console.error("[PortalDashboard] Failed to fetch tasks:", tasksResult.reason);
      }

      // Process notifications result
      if (notificationsResult.status === "fulfilled") {
        notificationCount = notificationsResult.value?.length || 0;
      } else {
        // Notifications failures are non-blocking, just log
        console.error("[PortalDashboard] Failed to fetch notifications:", notificationsResult.reason);
      }

      setCounts({ unreadMessages, tasks: taskCount, notifications: notificationCount });

      if (errors.length > 0) {
        setError(`Failed to load ${errors.join(", ")}`);
      }

      setLoading(false);
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  return { counts, loading, error };
}

/* ───────────────── Icons ───────────────── */

function TasksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="tasksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="6" stroke="url(#tasksGradient)" strokeWidth="3" fill="none" />
      <path d="M20 30 L28 38 L44 22" stroke="url(#tasksGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessagesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="messagesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <path
        d="M8 12 h40 a6 6 0 0 1 6 6 v20 a6 6 0 0 1-6 6 h-24 l-12 10 v-10 h-4 a6 6 0 0 1-6-6 v-20 a6 6 0 0 1 6-6z"
        stroke="url(#messagesGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="28" r="3" fill="url(#messagesGradient)" />
      <circle cx="29" cy="28" r="3" fill="url(#messagesGradient)" />
      <circle cx="41" cy="28" r="3" fill="url(#messagesGradient)" />
    </svg>
  );
}

function NotificationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="notificationsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <path d="M32 8 L32 12" stroke="url(#notificationsGradient)" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 48 L46 48" stroke="url(#notificationsGradient)" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 52 Q32 56 36 52" stroke="url(#notificationsGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M32 12 C20 12 14 18 14 28 L14 42 Q14 46 18 48 L46 48 Q50 46 50 42 L50 28 C50 18 44 12 32 12 Z" stroke="url(#notificationsGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

/* ───────────────── Summary Row Component ───────────────── */

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  count: number;
  href: string;
}

function SummaryRow({ icon, label, description, count, href }: SummaryRowProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="group flex items-center gap-4 py-4 px-0 cursor-pointer transition-opacity hover:opacity-80"
      style={{ textDecoration: "none" }}
    >
      <div className="flex-shrink-0 w-5 h-5" style={{ opacity: 0.8 }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium" style={{ color: "hsl(var(--text-primary))" }}>
          {label}
        </div>
        <div className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "2px" }}>
          {description}
        </div>
      </div>
      <div
        className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: "rgba(232, 121, 36, 0.15)", color: "#e87924" }}
      >
        {count}
      </div>
      <div
        className="flex-shrink-0 text-sm font-medium"
        style={{ color: "hsl(var(--text-secondary))", marginLeft: "8px" }}
      >
        View →
      </div>
    </a>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalDashboard() {
  const { counts, loading, error } = useDashboardCounts();

  // Determine what to show
  const hasActionRequiredTasks = !loading && counts.tasks > 0;
  const hasUnreadMessages = !loading && counts.unreadMessages > 0;
  const hasNotifications = !loading && counts.notifications > 0;

  const showPrimarySection = hasActionRequiredTasks || hasUnreadMessages;
  const showSecondarySection = hasNotifications;
  const showEmptyState = !loading && !showPrimarySection && !showSecondarySection;

  return (
    <div className="p-6" style={{ maxWidth: "920px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 className="text-2xl font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "4px" }}>
          Your personalized hub for tasks, messages, and updates.
        </p>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
          Loading...
        </div>
      )}

      {/* Primary Section: Needs your attention */}
      {showPrimarySection && (
        <section style={{ marginBottom: "32px" }}>
          <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--text-primary))", marginBottom: "12px" }}>
            Needs your attention
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {hasActionRequiredTasks && (
              <SummaryRow
                icon={<TasksIcon className="w-5 h-5" />}
                label="Tasks"
                description="Action items that need your attention"
                count={counts.tasks}
                href="/portal/tasks"
              />
            )}
            {hasUnreadMessages && (
              <SummaryRow
                icon={<MessagesIcon className="w-5 h-5" />}
                label="Messages"
                description="Unread conversations with your breeder"
                count={counts.unreadMessages}
                href="/portal/messages"
              />
            )}
          </div>
        </section>
      )}

      {/* Secondary Section: Recent updates */}
      {showSecondarySection && (
        <section style={{ marginBottom: "32px" }}>
          <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--text-primary))", marginBottom: "12px" }}>
            Recent updates
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <SummaryRow
              icon={<NotificationsIcon className="w-5 h-5" />}
              label="Notifications"
              description={`${counts.notifications} notification${counts.notifications !== 1 ? 's' : ''} in the last 7 days`}
              count={counts.notifications}
              href="/portal/notifications"
            />
          </div>
        </section>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <div style={{ marginTop: "64px", textAlign: "center" }}>
          <h3 className="text-xl font-medium" style={{ color: "hsl(var(--text-primary))" }}>
            You're all set.
          </h3>
          <p className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "8px" }}>
            We'll surface tasks, messages, and updates here when they need your attention.
          </p>
        </div>
      )}
    </div>
  );
}

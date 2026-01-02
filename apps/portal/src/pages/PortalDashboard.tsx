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
        // Silent failure for auth/forbidden errors (403, ACTOR_CONTEXT_UNRESOLVABLE)
        const err = tasksResult.reason;
        const is403 = err?.status === 403 || err?.code === 403;
        const isActorContext = err?.message?.includes("ACTOR_CONTEXT_UNRESOLVABLE");
        if (!is403 && !isActorContext) {
          // Only log non-auth errors
          console.error("[PortalDashboard] Failed to fetch tasks:", err);
        }
        // Treat as zero count regardless
      }

      // Process notifications result
      if (notificationsResult.status === "fulfilled") {
        notificationCount = notificationsResult.value?.length || 0;
      } else {
        // Silent failure for auth/forbidden errors (403, ACTOR_CONTEXT_UNRESOLVABLE)
        const err = notificationsResult.reason;
        const is403 = err?.status === 403 || err?.code === 403;
        const isActorContext = err?.message?.includes("ACTOR_CONTEXT_UNRESOLVABLE");
        if (!is403 && !isActorContext) {
          // Only log non-auth errors
          console.error("[PortalDashboard] Failed to fetch notifications:", err);
        }
        // Treat as zero count regardless
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

/* ───────────────── Dashboard Row Component ───────────────── */

interface DashboardRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  count: number;
  href: string;
  isLast?: boolean;
}

function DashboardRow({ icon, label, description, count, href, isLast = false }: DashboardRowProps) {
  const hasCount = count > 0;

  return (
    <a
      href={href}
      className="group flex items-center gap-5 px-0 cursor-pointer transition-colors hover:bg-white/[0.02]"
      style={{
        textDecoration: "none",
        borderBottom: isLast ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
        paddingTop: "20px",
        paddingBottom: "20px",
      }}
    >
      <div className="flex-shrink-0 w-5 h-5" style={{ opacity: hasCount ? 0.9 : 0.5 }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
          {label}
        </div>
        <div className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "3px" }}>
          {description}
        </div>
      </div>
      {hasCount && (
        <div
          className="flex-shrink-0 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(232, 121, 36, 0.12)", color: "#e87924", fontSize: "11px", fontWeight: 600 }}
        >
          {count}
        </div>
      )}
      <div
        className="flex-shrink-0 text-sm font-medium"
        style={{ color: "hsl(var(--text-secondary))", marginLeft: hasCount ? "8px" : "0" }}
      >
        View
      </div>
    </a>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalDashboard() {
  const { counts, loading, error } = useDashboardCounts();

  const allZero = !loading && counts.tasks === 0 && counts.unreadMessages === 0 && counts.notifications === 0;

  return (
    <div className="p-6" style={{ maxWidth: "920px", margin: "0 auto", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "12px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          Dashboard
        </h1>
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

      {/* Dashboard Sections - Always Visible */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Tasks Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-secondary))", marginBottom: "12px" }}>
              Tasks
            </h2>
            <div>
              <DashboardRow
                icon={<TasksIcon className="w-5 h-5" />}
                label="Tasks"
                description={counts.tasks > 0 ? "Action items that need your attention" : "Check your tasks"}
                count={counts.tasks}
                href="/portal/tasks"
                isLast={true}
              />
            </div>
          </section>

          {/* Messages Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-secondary))", marginBottom: "12px" }}>
              Messages
            </h2>
            <div>
              <DashboardRow
                icon={<MessagesIcon className="w-5 h-5" />}
                label="Messages"
                description={counts.unreadMessages > 0 ? "Unread conversations with your breeder" : "View your messages"}
                count={counts.unreadMessages}
                href="/portal/messages"
                isLast={true}
              />
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-secondary))", marginBottom: "12px" }}>
              Notifications
            </h2>
            <div>
              <DashboardRow
                icon={<NotificationsIcon className="w-5 h-5" />}
                label="Notifications"
                description={counts.notifications > 0 ? "Recent updates that may need your attention" : "View recent updates"}
                count={counts.notifications}
                href="/portal/notifications"
                isLast={true}
              />
            </div>
          </section>

          {/* Empty State Message - Additive */}
          {allZero && (
            <div style={{ marginTop: "16px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                You're all set.
              </h3>
              <p className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "8px" }}>
                When you have items that need attention, they'll appear above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

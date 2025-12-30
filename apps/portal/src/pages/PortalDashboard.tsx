// apps/portal/src/pages/PortalDashboard.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";
import { makeApi } from "@bhq/api";
import { PORTAL_FEATURE_FLAGS } from "../mock";
import { fetchAllTasks } from "../tasks/taskSources";

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
    return "http://localhost:6001/api/v1";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  const b = base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

const api = makeApi(getApiBase());

// Dashboard counts state
interface DashboardCounts {
  unreadMessages: number;
  tasks: number;
}

function useDashboardCounts() {
  const [counts, setCounts] = React.useState<DashboardCounts>({
    unreadMessages: 0,
    tasks: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      setLoading(true);
      setError(null);

      // Fetch messages and tasks in parallel
      const [messagesResult, tasksResult] = await Promise.allSettled([
        api.messages.threads.list(),
        fetchAllTasks(),
      ]);

      if (cancelled) return;

      let unreadMessages = 0;
      let taskCount = 0;
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

      // Process tasks result
      if (tasksResult.status === "fulfilled") {
        taskCount = tasksResult.value?.tasks?.length || 0;
      } else {
        // Tasks failures are non-blocking, just log
        console.error("[PortalDashboard] Failed to fetch tasks:", tasksResult.reason);
      }

      setCounts({ unreadMessages, tasks: taskCount });

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

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="billingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <rect x="8" y="16" width="48" height="36" rx="4" stroke="url(#billingGradient)" strokeWidth="3" fill="none" />
      <path d="M8 28 L56 28" stroke="url(#billingGradient)" strokeWidth="3" />
      <path d="M16 40 L28 40" stroke="url(#billingGradient)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function AgreementsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="agreementsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <path d="M16 8 L16 56 L48 56 L48 20 L36 8 Z" stroke="url(#agreementsGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M36 8 L36 20 L48 20" stroke="url(#agreementsGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M24 32 L40 32" stroke="url(#agreementsGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 40 L40 40" stroke="url(#agreementsGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 48 L32 48" stroke="url(#agreementsGradient)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DocumentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="documentsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <rect x="12" y="8" width="40" height="48" rx="4" stroke="url(#documentsGradient)" strokeWidth="3" fill="none" />
      <path d="M20 20 L44 20" stroke="url(#documentsGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 28 L44 28" stroke="url(#documentsGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 36 L36 36" stroke="url(#documentsGradient)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function OffspringIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="offspringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="24" r="12" stroke="url(#offspringGradient)" strokeWidth="3" fill="none" />
      <path d="M16 52 C16 42 24 36 32 36 C40 36 48 42 48 52" stroke="url(#offspringGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function WaitlistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="waitlistGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="24" stroke="url(#waitlistGradient)" strokeWidth="3" fill="none" />
      <path d="M32 16 L32 32 L44 38" stroke="url(#waitlistGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="scheduleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="48" height="44" rx="4" stroke="url(#scheduleGradient)" strokeWidth="3" fill="none" />
      <path d="M8 24 L56 24" stroke="url(#scheduleGradient)" strokeWidth="3" />
      <path d="M20 8 L20 16" stroke="url(#scheduleGradient)" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 8 L44 16" stroke="url(#scheduleGradient)" strokeWidth="3" strokeLinecap="round" />
      <rect x="16" y="32" width="8" height="8" rx="1" fill="url(#scheduleGradient)" />
    </svg>
  );
}

/* ───────────────── Status Badges ───────────────── */

type BadgeType = "live" | "active" | "pending";

function StatusBadge({ type }: { type: BadgeType }) {
  const styles: Record<BadgeType, { bg: string; text: string; label: string }> = {
    live: { bg: "#16a34a", text: "#fff", label: "Live" },
    active: { bg: "#2563eb", text: "#fff", label: "Active" },
    pending: { bg: "#d97706", text: "#fff", label: "Pending" },
  };
  const s = styles[type];

  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

/* ───────────────── Primary Action Tile ───────────────── */

interface PrimaryTileProps {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
  badge?: BadgeType;
  count?: number;
}

function PrimaryTile({ title, description, buttonLabel, href, icon, badge = "live", count }: PrimaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="relative rounded-2xl hover:brightness-110 transition-all overflow-hidden"
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(60, 60, 60, 0.5)",
        height: "200px",
      }}
    >
      {/* Badge in top-left */}
      <div style={{ position: "absolute", top: "16px", left: "16px" }} className="flex items-center gap-2">
        <StatusBadge type={badge} />
        {count !== undefined && count > 0 && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#e87924", color: "#fff" }}
          >
            {count}
          </span>
        )}
      </div>

      {/* Icon in top-right */}
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        {icon}
      </div>

      {/* Content at bottom-left */}
      <div style={{ position: "absolute", bottom: "24px", left: "24px" }}>
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        <p className="mt-1 text-sm text-secondary">{description}</p>
        <div className="mt-4">
          <Button onClick={handleClick}>{buttonLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Secondary Tile ───────────────── */

interface SecondaryTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  badge?: BadgeType;
  count?: number;
}

function SecondaryTile({ icon, title, description, href, badge = "live", count }: SecondaryTileProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-lg p-4 cursor-pointer transition-all relative"
      style={{
        border: isHovered ? "2px solid hsl(var(--brand-orange))" : "2px solid rgba(232, 121, 36, 0.3)",
        backgroundColor: isHovered ? "var(--surface)" : "rgba(var(--surface-rgb), 0.5)",
      }}
    >
      {/* Badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {count !== undefined && count > 0 && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#e87924", color: "#fff" }}
          >
            {count}
          </span>
        )}
        <StatusBadge type={badge} />
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-surface-strong border border-hairline flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-primary">{title}</div>
          <p className="mt-0.5 text-xs text-secondary">{description}</p>
        </div>
      </div>
    </a>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalDashboard() {
  const { counts, loading, error } = useDashboardCounts();

  return (
    <div className="p-6">
      {/* Page Header */}
      <PageHeader
        title="Client Portal"
        subtitle="Your personalized hub for tasks, messages, documents, and more."
      />

      {/* Error banner (non-blocking) */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Section 1: Active Items */}
      <section className="mt-8">
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 className="text-xl font-semibold text-primary">Active Items</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PrimaryTile
            title="Tasks"
            description="Action items that need your attention."
            buttonLabel="Open Tasks"
            href="/portal/tasks"
            icon={<TasksIcon className="w-24 h-24" />}
            badge={loading ? "live" : counts.tasks > 0 ? "active" : "live"}
            count={loading ? undefined : counts.tasks}
          />
          <PrimaryTile
            title="Messages"
            description="Private conversations with your breeder."
            buttonLabel="Open Inbox"
            href="/portal/messages"
            icon={<MessagesIcon className="w-24 h-24" />}
            badge={loading ? "live" : counts.unreadMessages > 0 ? "active" : "live"}
            count={loading ? undefined : counts.unreadMessages}
          />
        </div>
      </section>

      {/* Section 2: Key Workflows */}
      <section style={{ marginTop: "3rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 className="text-xl font-semibold text-primary">Key Workflows</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTAL_FEATURE_FLAGS.SHOW_BILLING && (
            <SecondaryTile
              icon={<BillingIcon className="w-5 h-5" />}
              title="Billing and Transactions"
              description="No items yet."
              href="/portal/billing"
              badge="live"
              count={0}
            />
          )}
          {PORTAL_FEATURE_FLAGS.SHOW_AGREEMENTS && (
            <SecondaryTile
              icon={<AgreementsIcon className="w-5 h-5" />}
              title="Agreements"
              description="No items yet."
              href="/portal/agreements"
              badge="live"
              count={0}
            />
          )}
          <SecondaryTile
            icon={<DocumentsIcon className="w-5 h-5" />}
            title="Documents"
            description="No items yet."
            href="/portal/documents"
            badge="live"
            count={0}
          />
        </div>
      </section>

      {/* Section 3: My Offspring */}
      {PORTAL_FEATURE_FLAGS.SHOW_OFFSPRING && (
        <section style={{ marginTop: "3rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 className="text-xl font-semibold text-primary">My Offspring</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SecondaryTile
              icon={<OffspringIcon className="w-5 h-5" />}
              title="Current Placements"
              description="No items yet."
              href="/portal/offspring"
              badge="live"
              count={0}
            />
            <SecondaryTile
              icon={<span className="text-base">👪</span>}
              title="Offspring Groups"
              description="No items yet."
              href="/portal/offspring?view=groups"
              badge="live"
              count={0}
            />
          </div>
        </section>
      )}

      {/* Section 4: Preferences */}
      <section style={{ marginTop: "3rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 className="text-xl font-semibold text-primary">Preferences</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTAL_FEATURE_FLAGS.SHOW_WAITLIST && (
            <SecondaryTile
              icon={<WaitlistIcon className="w-5 h-5" />}
              title="Waitlist"
              description="No items yet."
              href="/portal/waitlist"
              badge="live"
              count={0}
            />
          )}
          {PORTAL_FEATURE_FLAGS.SHOW_SCHEDULING && (
            <SecondaryTile
              icon={<ScheduleIcon className="w-5 h-5" />}
              title="Scheduling"
              description="No items yet."
              href="/portal/profile?tab=appointments"
              badge="live"
              count={0}
            />
          )}
        </div>
      </section>

    </div>
  );
}

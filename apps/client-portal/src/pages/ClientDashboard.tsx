// apps/client-portal/src/pages/ClientDashboard.tsx
// Clean, consumer-style dashboard for the standalone client portal.
// Centered max-width container with card-based layout.

import * as React from "react";
import { makeApi } from "@bhq/api";
import { fetchAllTasks } from "@bhq/portal/tasks/taskSources";
import { PORTAL_FEATURE_FLAGS } from "@bhq/portal/mock";
import { useOrg } from "../context/OrgContext";

// Resolve API base URL
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return envBase.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return window.location.origin.replace(/\/+$/, "");
}

const api = makeApi(getApiBase());

// Dashboard counts state
interface DashboardCounts {
  unreadMessages: number;
  tasks: number;
  agreements: number;
  documents: number;
  offspring: number;
}

function useDashboardCounts() {
  const [counts, setCounts] = React.useState<DashboardCounts>({
    unreadMessages: 0,
    tasks: 0,
    agreements: 0,
    documents: 0,
    offspring: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      setLoading(true);

      const [messagesResult, tasksResult, agreementsResult, documentsResult, offspringResult] = await Promise.allSettled([
        api.messages.threads.list(),
        fetchAllTasks(),
        api.portalData.getAgreements(),
        api.portalData.getDocuments(),
        api.portalData.getOffspringPlacements(),
      ]);

      if (cancelled) return;

      let unreadMessages = 0;
      let taskCount = 0;
      let agreementsCount = 0;
      let documentsCount = 0;
      let offspringCount = 0;

      if (messagesResult.status === "fulfilled") {
        const threads = messagesResult.value?.threads || [];
        unreadMessages = threads.reduce(
          (sum, t) => sum + (t.unreadCount ?? 0),
          0
        );
      }

      if (tasksResult.status === "fulfilled") {
        taskCount = tasksResult.value?.tasks?.length || 0;
      }

      if (agreementsResult.status === "fulfilled") {
        agreementsCount = agreementsResult.value?.agreements?.length || 0;
      }

      if (documentsResult.status === "fulfilled") {
        documentsCount = documentsResult.value?.documents?.length || 0;
      }

      if (offspringResult.status === "fulfilled") {
        offspringCount = offspringResult.value?.placements?.length || 0;
      }

      setCounts({ unreadMessages, tasks: taskCount, agreements: agreementsCount, documents: documentsCount, offspring: offspringCount });
      setLoading(false);
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  return { counts, loading };
}

/* ───────────────── Icons ───────────────── */

function TasksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function MessagesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function AgreementsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function DocumentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function OffspringIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function GroupsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="3" />
      <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function WaitlistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ───────────────── Card Components ───────────────── */

interface PrimaryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  count?: number;
  loading?: boolean;
  buttonLabel: string;
}

function PrimaryCard({ title, description, icon, href, count, loading, buttonLabel }: PrimaryCardProps) {
  const { navigate } = useOrg();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <div className="rounded-xl bg-surface border border-hairline p-6 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-surface-strong flex items-center justify-center text-secondary">
          {icon}
        </div>
        {!loading && count !== undefined && count > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-[hsl(var(--brand-orange))] text-white text-xs font-semibold">
            {count}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
      <p className="text-sm text-secondary mb-4">{description}</p>
      <button
        onClick={handleClick}
        className="px-4 py-2 rounded-lg bg-[hsl(var(--brand-orange))] text-black font-medium text-sm hover:brightness-110 transition-all"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

interface SimpleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  count?: number;
}

function SimpleCard({ title, description, icon, href, count }: SimpleCardProps) {
  const { navigate } = useOrg();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="group rounded-xl bg-surface border border-hairline p-5 hover:bg-surface-2 transition-colors block"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-strong flex items-center justify-center text-secondary group-hover:text-primary transition-colors flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-primary">{title}</h4>
            {count !== undefined && count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--brand-orange))] text-white text-xs font-semibold">
                {count}
              </span>
            )}
          </div>
          <p className="text-sm text-secondary mt-0.5">{description}</p>
        </div>
      </div>
    </a>
  );
}

/* ───────────────── Section Component ───────────────── */

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function ClientDashboard() {
  const { counts, loading } = useDashboardCounts();
  const [showWelcomeBanner, setShowWelcomeBanner] = React.useState(false);

  // Check if this is the first login by looking for a flag in sessionStorage
  React.useEffect(() => {
    const isFirstLogin = sessionStorage.getItem("portal_first_login");
    if (isFirstLogin === "true") {
      setShowWelcomeBanner(true);
      // Clear the flag so it only shows once
      sessionStorage.removeItem("portal_first_login");
    }
  }, []);

  function dismissBanner() {
    setShowWelcomeBanner(false);
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Centered container with max width */}
      <div className="max-w-[1140px] mx-auto px-6 py-8">
        {/* First Login Welcome Banner */}
        {showWelcomeBanner && (
          <div className="mb-6 p-4 rounded-xl bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-semibold text-primary mb-1">Welcome to your portal!</h2>
              <p className="text-sm text-secondary">
                Next steps are available below. Check your tasks and messages to get started.
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="ml-4 text-secondary hover:text-primary transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-primary">Welcome back</h1>
          <p className="text-secondary mt-1">Your portal dashboard</p>
        </div>

        {/* Active Section - Primary cards with action buttons */}
        <Section title="Active">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PrimaryCard
              title="Tasks"
              description="Action items that need your attention."
              icon={<TasksIcon className="w-6 h-6" />}
              href="/tasks"
              count={counts.tasks}
              loading={loading}
              buttonLabel="View Tasks"
            />
            <PrimaryCard
              title="Messages"
              description="Private conversations with your breeder."
              icon={<MessagesIcon className="w-6 h-6" />}
              href="/messages"
              count={counts.unreadMessages}
              loading={loading}
              buttonLabel="View Messages"
            />
          </div>
        </Section>

        {/* Your Account Section */}
        <Section title="Your Account">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PORTAL_FEATURE_FLAGS.SHOW_BILLING && (
              <SimpleCard
                title="Billing"
                description="No items yet."
                icon={<BillingIcon className="w-5 h-5" />}
                href="/billing"
              />
            )}
            {PORTAL_FEATURE_FLAGS.SHOW_AGREEMENTS && (
              <SimpleCard
                title="Agreements"
                description={
                  counts.agreements > 0
                    ? `${counts.agreements} agreement${counts.agreements !== 1 ? "s" : ""}`
                    : "No items yet."
                }
                icon={<AgreementsIcon className="w-5 h-5" />}
                href="/agreements"
                count={counts.agreements}
              />
            )}
            <SimpleCard
              title="Documents"
              description={
                counts.documents > 0
                  ? `${counts.documents} document${counts.documents !== 1 ? "s" : ""}`
                  : "No items yet."
              }
              icon={<DocumentsIcon className="w-5 h-5" />}
              href="/documents"
              count={counts.documents}
            />
          </div>
        </Section>

        {/* Your Offspring Section */}
        {PORTAL_FEATURE_FLAGS.SHOW_OFFSPRING && (
          <Section title="Your Offspring">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SimpleCard
                title="Current Placements"
                description={
                  counts.offspring > 0
                    ? `${counts.offspring} placement${counts.offspring !== 1 ? "s" : ""}`
                    : "No items yet."
                }
                icon={<OffspringIcon className="w-5 h-5" />}
                href="/offspring"
                count={counts.offspring}
              />
            </div>
          </Section>
        )}

        {/* Preferences Section */}
        <Section title="Preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PORTAL_FEATURE_FLAGS.SHOW_WAITLIST && (
              <SimpleCard
                title="Waitlist"
                description="No items yet."
                icon={<WaitlistIcon className="w-5 h-5" />}
                href="/waitlist"
              />
            )}
            {PORTAL_FEATURE_FLAGS.SHOW_SCHEDULING && (
              <SimpleCard
                title="Scheduling"
                description="No items yet."
                icon={<ScheduleIcon className="w-5 h-5" />}
                href="/profile?tab=appointments"
              />
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

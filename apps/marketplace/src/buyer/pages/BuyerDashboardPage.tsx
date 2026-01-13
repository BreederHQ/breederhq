// apps/marketplace/src/buyer/pages/BuyerDashboardPage.tsx
// Buyer dashboard overview page with stats, recent activity, and quick actions

import * as React from "react";
import { Link } from "react-router-dom";
import { useConversations, useWaitlistRequests } from "../../messages/hooks";

// =============================================================================
// Icons
// =============================================================================

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22 11.08V12a10 10 0 11-5.93-9.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 4L12 14.01l-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ icon, label, value, href, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Link
      to={href}
      className="rounded-xl border border-border-subtle bg-portal-card p-4 hover:border-border-default hover:bg-portal-card-hover transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-text-secondary">{label}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-accent transition-colors" />
      </div>
    </Link>
  );
}

// =============================================================================
// Recent Messages Section
// =============================================================================

interface Conversation {
  id: string;
  participants: Array<{ name: string; type: string }>;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

function RecentMessagesSection({ conversations, loading }: { conversations: Conversation[]; loading: boolean }) {
  const recent = conversations.slice(0, 3);

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Recent Messages</h2>
        <Link
          to="/inquiries"
          className="text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
              <div className="w-10 h-10 rounded-full bg-border-default" />
              <div className="flex-1">
                <div className="h-4 bg-border-default rounded w-1/3 mb-2" />
                <div className="h-3 bg-border-default rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="text-center py-6">
          <MessageIcon className="w-10 h-10 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-tertiary">No messages yet</p>
          <Link
            to="/breeders"
            className="inline-block mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Browse breeders
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((conv) => {
            const otherParticipant = conv.participants.find((p) => p.type !== "buyer");
            return (
              <Link
                key={conv.id}
                to={`/inquiries?c=${conv.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-border-default/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {(otherParticipant?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? "text-white" : "text-text-secondary"}`}>
                      {otherParticipant?.name || "Unknown"}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.lastMessagePreview && (
                    <p className="text-[13px] text-text-tertiary truncate">{conv.lastMessagePreview}</p>
                  )}
                </div>
                {conv.lastMessageAt && (
                  <span className="text-[11px] text-text-muted flex-shrink-0">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Waitlist Summary Section
// =============================================================================

interface WaitlistRequest {
  id: number;
  breederName: string | null;
  breederSlug: string | null;
  programName: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

function WaitlistSummarySection({ requests, loading }: { requests: WaitlistRequest[]; loading: boolean }) {
  const pending = requests.filter((r) => r.status === "pending").slice(0, 3);
  const approved = requests.filter((r) => r.status === "approved").slice(0, 2);
  const displayItems = [...pending, ...approved].slice(0, 3);

  const statusConfig = {
    pending: {
      icon: <ClockIcon className="w-4 h-4" />,
      label: "Pending",
      color: "text-amber-400",
    },
    approved: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      label: "Approved",
      color: "text-green-400",
    },
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Waitlist Status</h2>
        <Link
          to="/waitlist"
          className="text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg animate-pulse">
              <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
              <div className="h-3 bg-border-default rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-6">
          <ClipboardIcon className="w-10 h-10 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-tertiary">No waitlist requests</p>
          <Link
            to="/breeders"
            className="inline-block mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Find a breeder
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((request) => {
            const config = statusConfig[request.status as "pending" | "approved"];
            return (
              <Link
                key={request.id}
                to="/waitlist"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-border-default/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {request.breederName || "Unknown Breeder"}
                  </p>
                  {request.programName && (
                    <p className="text-[13px] text-text-tertiary truncate">{request.programName}</p>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Quick Actions Section
// =============================================================================

function QuickActionsSection() {
  const actions = [
    {
      icon: <SearchIcon className="w-5 h-5" />,
      label: "Browse Animals",
      description: "Find your perfect companion",
      href: "/animals",
    },
    {
      icon: <HeartIcon className="w-5 h-5" />,
      label: "Saved Listings",
      description: "View items you've saved",
      href: "/saved",
    },
    {
      icon: <MessageIcon className="w-5 h-5" />,
      label: "Messages",
      description: "Chat with breeders",
      href: "/inquiries",
    },
    {
      icon: <ClipboardIcon className="w-5 h-5" />,
      label: "My Waitlists",
      description: "Track your positions",
      href: "/waitlist",
    },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
      <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="flex items-center gap-3 p-3 rounded-lg bg-border-default/30 hover:bg-border-default/50 transition-colors group"
          >
            <div className="text-text-secondary group-hover:text-accent transition-colors">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{action.label}</p>
              <p className="text-[11px] text-text-tertiary truncate">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function BuyerDashboardPage() {
  const { conversations, loading: loadingConversations } = useConversations();
  const { requests: waitlistRequests, loading: loadingWaitlist } = useWaitlistRequests();

  // Calculate stats
  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;
  const pendingWaitlist = waitlistRequests.filter((r) => r.status === "pending").length;
  const approvedWaitlist = waitlistRequests.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Welcome back! Here's what's happening with your account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<MessageIcon className="w-6 h-6" />}
          label="Unread Messages"
          value={unreadCount}
          href="/inquiries"
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={<ClockIcon className="w-6 h-6" />}
          label="Pending Waitlists"
          value={pendingWaitlist}
          href="/waitlist"
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-400"
        />
        <StatCard
          icon={<CheckCircleIcon className="w-6 h-6" />}
          label="Approved"
          value={approvedWaitlist}
          href="/waitlist"
          iconBgColor="bg-green-500/10"
          iconColor="text-green-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <RecentMessagesSection
          conversations={conversations}
          loading={loadingConversations}
        />

        {/* Waitlist Summary */}
        <WaitlistSummarySection
          requests={waitlistRequests}
          loading={loadingWaitlist}
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsSection />
    </div>
  );
}

export default BuyerDashboardPage;

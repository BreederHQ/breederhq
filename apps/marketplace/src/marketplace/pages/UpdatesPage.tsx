// apps/marketplace/src/marketplace/pages/UpdatesPage.tsx
// Notifications surface for inquiry status updates
import * as React from "react";
import { Link } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getInquiries, type InquiryEntry } from "../../demo/inquiryOutbox";

interface UpdateNotification {
  id: string;
  type: "delivered" | "replied";
  inquiry: InquiryEntry;
  timestamp: string;
}

/**
 * Updates page - notifications about inquiry activity.
 * In demo mode: derives notifications from inquiry outbox.
 * In real mode: shows coming soon state.
 */
export function UpdatesPage() {
  const [updates, setUpdates] = React.useState<UpdateNotification[]>([]);
  const demoMode = isDemoMode();

  // Load updates from inquiry outbox (demo mode only)
  React.useEffect(() => {
    if (!demoMode) return;

    const deriveUpdates = () => {
      const inquiries = getInquiries();
      const notifications: UpdateNotification[] = [];

      for (const inquiry of inquiries) {
        // Add notification for delivered status
        if (inquiry.status === "delivered" || inquiry.status === "replied") {
          notifications.push({
            id: `${inquiry.id}-delivered`,
            type: "delivered",
            inquiry,
            timestamp: inquiry.lastUpdateAt,
          });
        }

        // Add notification for replied status
        if (inquiry.status === "replied") {
          notifications.push({
            id: `${inquiry.id}-replied`,
            type: "replied",
            inquiry,
            timestamp: inquiry.lastUpdateAt,
          });
        }
      }

      // Sort by timestamp, newest first
      notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setUpdates(notifications);
    };

    deriveUpdates();

    // Poll every 2 seconds
    const interval = setInterval(deriveUpdates, 2000);
    return () => clearInterval(interval);
  }, [demoMode]);

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // Real mode: show coming soon state
  if (!demoMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Updates
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Notifications about your inquiry activity.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Updates are coming soon</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            You will receive notifications when breeders respond to your inquiries. In the meantime, browse breeders to find animals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/breeders"
              className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Browse breeders
            </Link>
            <button
              type="button"
              onClick={handleEnableDemo}
              className="text-sm text-text-tertiary hover:text-white transition-colors"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Updates
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Notifications about your inquiry activity.
        </p>
      </div>

      {updates.length === 0 ? (
        // Empty state (demo mode but no updates yet)
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No updates yet</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            When breeders respond to your inquiries, updates will appear here.
          </p>
          <Link
            to="/animals"
            className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse animals
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <UpdateRow key={update.id} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function UpdateRow({ update }: { update: UpdateNotification }) {
  const timestamp = new Date(update.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const icon = update.type === "replied" ? (
    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const message = update.type === "replied"
    ? `${update.inquiry.breederName} replied to your inquiry`
    : `Your inquiry was delivered to ${update.inquiry.breederName}`;

  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          update.type === "replied" ? "bg-green-500/15" : "bg-amber-500/15"
        }`}>
          {icon}
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-[15px] text-white mb-1">{message}</p>
          <Link
            to={`/programs/${update.inquiry.breederSlug}/offspring-groups/${update.inquiry.listingSlug}`}
            className="text-sm text-text-secondary hover:text-accent transition-colors block truncate"
          >
            {update.inquiry.listingTitle}
          </Link>
        </div>

        <div className="text-[13px] text-text-tertiary flex-shrink-0">
          {timestamp}
        </div>
      </div>
    </div>
  );
}

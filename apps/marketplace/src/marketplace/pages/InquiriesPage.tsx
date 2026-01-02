// apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
// Buyer activity surface for sent inquiries
import * as React from "react";
import { Link } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getInquiries, type InquiryEntry, type InquiryStatus } from "../../demo/inquiryOutbox";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  replied: "Replied",
};

const STATUS_COLORS: Record<InquiryStatus, string> = {
  sent: "bg-text-muted/20 text-text-secondary",
  delivered: "bg-amber-500/20 text-amber-400",
  replied: "bg-green-500/20 text-green-400",
};

/**
 * Inquiries page - view sent inquiries and their status.
 * In demo mode: shows localStorage-backed inquiry outbox.
 * In real mode: shows coming soon state.
 */
export function InquiriesPage() {
  const [inquiries, setInquiries] = React.useState<InquiryEntry[]>([]);
  const [filter, setFilter] = React.useState<InquiryStatus | "all">("all");
  const demoMode = isDemoMode();

  // Load inquiries and poll for updates (demo mode only)
  React.useEffect(() => {
    if (!demoMode) return;

    const load = () => setInquiries(getInquiries());
    load();

    // Poll every 2 seconds to catch status updates
    const interval = setInterval(load, 2000);
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
            Inquiries
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            View your sent inquiries and responses.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Inquiry tracking is coming soon</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            When you send inquiries to breeders, they will appear here. In the meantime, browse breeders to find animals.
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

  // Filter inquiries
  const filteredInquiries = filter === "all"
    ? inquiries
    : inquiries.filter((i) => i.status === filter);

  // Count by status
  const sentCount = inquiries.filter((i) => i.status === "sent").length;
  const deliveredCount = inquiries.filter((i) => i.status === "delivered").length;
  const repliedCount = inquiries.filter((i) => i.status === "replied").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Inquiries
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          View your sent inquiries and responses.
        </p>
      </div>

      {inquiries.length === 0 ? (
        // Empty state (demo mode but no inquiries sent yet)
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No inquiries yet</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            When you send an inquiry to a breeder, it will appear here.
          </p>
          <Link
            to="/animals"
            className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse animals
          </Link>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              count={inquiries.length}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterButton
              label="Sent"
              count={sentCount}
              active={filter === "sent"}
              onClick={() => setFilter("sent")}
            />
            <FilterButton
              label="Delivered"
              count={deliveredCount}
              active={filter === "delivered"}
              onClick={() => setFilter("delivered")}
            />
            <FilterButton
              label="Replied"
              count={repliedCount}
              active={filter === "replied"}
              onClick={() => setFilter("replied")}
            />
          </div>

          {/* Inquiries list */}
          <div className="space-y-3">
            {filteredInquiries.length === 0 ? (
              <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
                <p className="text-sm text-text-tertiary">No inquiries match this filter.</p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => (
                <InquiryRow key={inquiry.id} inquiry={inquiry} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
        active
          ? "bg-border-default text-white"
          : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="ml-1.5 text-text-tertiary">({count})</span>
      )}
    </button>
  );
}

function InquiryRow({ inquiry }: { inquiry: InquiryEntry }) {
  const sentDate = new Date(inquiry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left: Breeder and listing info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/programs/${inquiry.breederSlug}`}
              className="text-[15px] font-semibold text-white hover:text-accent transition-colors truncate"
            >
              {inquiry.breederName}
            </Link>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[inquiry.status]}`}>
              {STATUS_LABELS[inquiry.status]}
            </span>
          </div>

          <Link
            to={`/programs/${inquiry.breederSlug}/offspring-groups/${inquiry.listingSlug}`}
            className="text-sm text-text-secondary hover:text-accent transition-colors block truncate"
          >
            {inquiry.listingTitle}
          </Link>

          <p className="text-[13px] text-text-tertiary mt-2 line-clamp-2">
            {inquiry.message}
          </p>
        </div>

        {/* Right: Date and actions */}
        <div className="flex-shrink-0 text-right">
          <div className="text-[13px] text-text-tertiary mb-2">{sentDate}</div>
          <div className="flex gap-2 justify-end">
            <Link
              to={`/programs/${inquiry.breederSlug}/offspring-groups/${inquiry.listingSlug}`}
              className="text-[13px] text-text-secondary hover:text-white transition-colors"
            >
              View listing
            </Link>
            <span className="text-text-muted">·</span>
            <Link
              to={`/programs/${inquiry.breederSlug}`}
              className="text-[13px] text-text-secondary hover:text-white transition-colors"
            >
              View breeder
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
// Full messaging UI with conversation list and thread view

import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useConversations, useConversation, useSendMessage, useWaitlistRequests, type WaitlistRequest } from "../../messages/hooks";
import { ConversationList, ThreadView } from "../../messages/components";


type InquiriesTab = "messages" | "waitlist";

/**
 * Inquiries page - full messaging experience.
 * Left: conversation list. Right: thread view.
 */
export function InquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get tab and selected conversation from URL
  const activeTab = (searchParams.get("tab") as InquiriesTab) || "messages";
  const selectedId = searchParams.get("c") || null;

  // Fetch conversations
  const { conversations, loading: loadingConversations, refresh: refreshConversations } = useConversations();

  // Fetch waitlist requests
  const { requests: waitlistRequests, loading: loadingWaitlist, refresh: refreshWaitlist } = useWaitlistRequests();

  // Fetch selected conversation and messages
  const {
    conversation,
    messages,
    loading: loadingThread,
  } = useConversation(activeTab === "messages" ? selectedId : null);

  // Send message hook
  const { sendMessage, sending } = useSendMessage();

  // Refresh data when tab changes
  React.useEffect(() => {
    if (activeTab === "waitlist") {
      refreshWaitlist();
    } else if (activeTab === "messages") {
      refreshConversations();
    }
  }, [activeTab, refreshWaitlist, refreshConversations]);

  // Refresh data when page becomes visible (user returns to tab)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (activeTab === "waitlist") {
          refreshWaitlist();
        } else {
          refreshConversations();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeTab, refreshWaitlist, refreshConversations]);

  // Handle tab change
  const handleTabChange = React.useCallback(
    (tab: InquiriesTab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle conversation selection
  const handleSelect = React.useCallback(
    (id: string) => {
      setSearchParams({ tab: "messages", c: id }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle send message (with optional file attachment)
  const handleSendMessage = React.useCallback(
    async (content: string, file?: File) => {
      if (!selectedId) return;
      await sendMessage(selectedId, content, file);
    },
    [selectedId, sendMessage]
  );

  // Count waitlist requests by status
  const waitlistCounts = React.useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    waitlistRequests.forEach((r) => {
      if (r.status in counts) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [waitlistRequests]);

  return (
    <div className="h-[calc(100vh-theme(height.header)-theme(spacing.16))] -mx-6 -mt-8 flex flex-col">
      {/* Tab header */}
      <div className="flex-shrink-0 border-b border-border-subtle bg-portal-elevated px-4">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === "messages"}
            onClick={() => handleTabChange("messages")}
            count={conversations.filter((c) => c.unreadCount > 0).length}
          >
            Messages
          </TabButton>
          <TabButton
            active={activeTab === "waitlist"}
            onClick={() => handleTabChange("waitlist")}
            count={waitlistCounts.pending}
          >
            Waitlist Requests
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "messages" ? (
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar - conversation list */}
          <div className="w-80 flex-shrink-0">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loading={loadingConversations}
            />
          </div>

          {/* Right panel - thread view */}
          <div className="flex-1 min-w-0">
            <ThreadView
              conversation={conversation}
              messages={messages}
              loading={loadingThread}
              onSendMessage={handleSendMessage}
              sending={sending}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <WaitlistRequestsList
            requests={waitlistRequests}
            loading={loadingWaitlist}
          />
        </div>
      )}
    </div>
  );
}

// Tab button component
function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "text-white"
          : "text-text-tertiary hover:text-text-secondary"
      }`}
    >
      <span className="flex items-center gap-2">
        {children}
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
      )}
    </button>
  );
}

// Waitlist requests list component
function WaitlistRequestsList({
  requests,
  loading,
}: {
  requests: WaitlistRequest[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-portal border border-border-subtle bg-portal-card animate-pulse">
            <div className="h-5 bg-border-default rounded w-1/3 mb-2" />
            <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
            <div className="h-3 bg-border-default rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No waitlist requests yet</h3>
        <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
          When you request to join a breeder's waitlist, you'll see the status of your requests here.
        </p>
        <Link
          to="/breeders"
          className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Browse breeders
        </Link>
      </div>
    );
  }

  // Group by status
  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-8 max-w-3xl">
      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Approved ({approved.length})
          </h3>
          <div className="space-y-3">
            {approved.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Declined ({rejected.length})
          </h3>
          <div className="space-y-3">
            {rejected.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Helper to format cents to dollars
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// Helper to get invoice status display config
function getInvoiceStatusConfig(invoice: WaitlistRequest["invoice"]) {
  if (!invoice) return null;

  const isOverdue = invoice.dueAt && new Date(invoice.dueAt) < new Date() && invoice.status !== "PAID";
  const isPartial = invoice.paidCents > 0 && invoice.balanceCents > 0;

  if (invoice.status === "PAID") {
    return {
      label: "Paid",
      className: "bg-green-500/10 text-green-400 border-green-500/30",
      showPayButton: false,
    };
  }

  if (isOverdue) {
    return {
      label: "Overdue",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      showPayButton: true,
    };
  }

  if (isPartial) {
    const pct = Math.round((invoice.paidCents / invoice.totalCents) * 100);
    return {
      label: `Partial (${pct}%)`,
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      showPayButton: true,
    };
  }

  return {
    label: "Awaiting Payment",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    showPayButton: true,
  };
}

// Single waitlist request card
function WaitlistRequestCard({ request }: { request: WaitlistRequest }) {
  const [payLoading, setPayLoading] = React.useState(false);

  const statusConfig = {
    pending: {
      label: "Pending Review",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    approved: {
      label: "Approved",
      className: "bg-green-500/10 text-green-400 border-green-500/30",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    rejected: {
      label: "Declined",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const config = statusConfig[request.status];
  const invoiceConfig = getInvoiceStatusConfig(request.invoice);

  // Format date
  const submittedDate = new Date(request.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Handle Pay Now click - redirect to Stripe checkout
  const handlePayNow = async () => {
    if (!request.invoice) return;

    setPayLoading(true);
    try {
      const base = import.meta.env.DEV
        ? "/api/v1/marketplace"
        : `${window.location.origin}/api/v1/marketplace`;

      const response = await fetch(`${base}/invoices/${request.invoice.id}/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("Payment error:", err);
      // Could add toast notification here
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-portal border border-border-subtle bg-portal-card hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Breeder name */}
          <div className="flex items-center gap-2 mb-1">
            {request.breederSlug ? (
              <Link
                to={`/breeders/${request.breederSlug}`}
                className="text-[15px] font-semibold text-white hover:text-accent transition-colors"
              >
                {request.breederName || "Unknown Breeder"}
              </Link>
            ) : (
              <span className="text-[15px] font-semibold text-white">
                {request.breederName || "Unknown Breeder"}
              </span>
            )}
          </div>

          {/* Program name */}
          {request.programName && (
            <p className="text-sm text-text-secondary mb-2">{request.programName}</p>
          )}

          {/* Submitted date */}
          <p className="text-xs text-text-muted">Submitted {submittedDate}</p>

          {/* Rejection reason */}
          {request.status === "rejected" && request.rejectedReason && (
            <div className="mt-3 p-3 rounded-portal-xs bg-red-500/5 border border-red-500/20">
              <p className="text-xs font-medium text-red-400 mb-1">Reason:</p>
              <p className="text-sm text-text-secondary">{request.rejectedReason}</p>
            </div>
          )}

          {/* Approved date */}
          {request.status === "approved" && request.approvedAt && (
            <p className="text-xs text-green-400 mt-2">
              Approved {new Date(request.approvedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {/* Deposit invoice section */}
          {request.invoice && invoiceConfig && (
            <div className="mt-3 p-3 rounded-portal-xs bg-portal-elevated border border-border-subtle">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-0.5">Deposit Required</p>
                  <p className="text-sm font-semibold text-white">
                    {request.invoice.balanceCents > 0
                      ? formatCents(request.invoice.balanceCents)
                      : formatCents(request.invoice.totalCents)}
                  </p>
                  {request.invoice.dueAt && request.invoice.status !== "PAID" && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Due {new Date(request.invoice.dueAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${invoiceConfig.className}`}>
                    {invoiceConfig.label}
                  </span>
                  {invoiceConfig.showPayButton && (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={payLoading}
                      className="px-3 py-1.5 rounded-portal-xs bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      {payLoading ? "..." : "Pay Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status badge */}
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
          {config.icon}
          {config.label}
        </span>
      </div>
    </div>
  );
}

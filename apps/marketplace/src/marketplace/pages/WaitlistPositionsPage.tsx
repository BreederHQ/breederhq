// apps/marketplace/src/marketplace/pages/WaitlistPositionsPage.tsx
// Shows user's waitlist positions across breeding programs
// Displays status (pending, approved, rejected) and deposit payment options

import * as React from "react";
import { Link } from "react-router-dom";
import { useWaitlistRequests, type WaitlistRequest } from "../../messages/hooks";
import { Breadcrumb } from "../components/Breadcrumb";

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

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface WaitlistCardProps {
  request: WaitlistRequest;
  onPayDeposit?: (invoiceId: number) => void;
}

function WaitlistCard({ request, onPayDeposit }: WaitlistCardProps) {
  const statusConfig = {
    pending: {
      icon: ClockIcon,
      label: "Pending",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/30",
    },
    approved: {
      icon: CheckCircleIcon,
      label: "Approved",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/30",
    },
    rejected: {
      icon: XCircleIcon,
      label: "Rejected",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/30",
    },
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  const hasUnpaidDeposit =
    request.status === "approved" &&
    request.invoice &&
    request.invoice.balanceCents > 0;

  return (
    <div className="rounded-lg border border-border-subtle bg-portal-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Program and Breeder Info */}
          <div className="flex items-center gap-2 mb-1">
            {request.breederSlug ? (
              <Link
                to={`/breeders/${request.breederSlug}`}
                className="font-semibold text-white hover:text-accent transition-colors"
              >
                {request.breederName || "Unknown Breeder"}
              </Link>
            ) : (
              <span className="font-semibold text-white">
                {request.breederName || "Unknown Breeder"}
              </span>
            )}
          </div>
          {request.programName && (
            <p className="text-sm text-text-secondary mb-2">{request.programName}</p>
          )}

          {/* Status Detail */}
          {request.statusDetail && (
            <p className="text-sm text-text-tertiary mb-2">{request.statusDetail}</p>
          )}

          {/* Rejection Reason */}
          {request.status === "rejected" && request.rejectedReason && (
            <p className="text-sm text-red-400/80 mb-2">
              Reason: {request.rejectedReason}
            </p>
          )}

          {/* Submitted Date */}
          <p className="text-xs text-text-tertiary">
            Submitted {formatDate(request.submittedAt)}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor} border ${config.borderColor}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      {/* Deposit Payment Section */}
      {hasUnpaidDeposit && request.invoice && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Deposit Required</p>
              <p className="text-xs text-text-secondary">
                {formatPrice(request.invoice.balanceCents)} due
                {request.invoice.dueAt && ` by ${formatDate(request.invoice.dueAt)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPayDeposit?.(request.invoice!.id)}
              className="px-4 py-2 rounded-md bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
            >
              Pay Deposit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WaitlistPositionsPage() {
  const { requests, loading, error, refresh } = useWaitlistRequests();

  const handlePayDeposit = async (invoiceId: number) => {
    // TODO: Implement checkout flow via POST /invoices/:id/checkout
    console.log("Pay deposit for invoice:", invoiceId);
    alert("Payment flow not yet implemented");
  };

  // Group requests by status
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Waitlist Positions" },
          ]}
        />
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">My Waitlist Positions</h1>
          <p className="text-text-secondary mt-1">
            Track your waitlist requests and deposit status
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-portal-card p-4 animate-pulse"
            >
              <div className="h-5 w-48 bg-border-default rounded mb-2" />
              <div className="h-4 w-32 bg-border-default rounded mb-2" />
              <div className="h-3 w-24 bg-border-default rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Waitlist Positions" },
          ]}
        />
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">My Waitlist Positions</h1>
          <p className="text-text-secondary mt-1">
            Track your waitlist requests and deposit status
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400 mb-4">Failed to load waitlist positions</p>
          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 rounded-md bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Waitlist Positions" },
          ]}
        />
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">My Waitlist Positions</h1>
          <p className="text-text-secondary mt-1">
            Track your waitlist requests and deposit status
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-portal-card p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
            <ListIcon className="w-8 h-8 text-text-tertiary" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No waitlist positions</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            When you join a breeder's waitlist, your position and status will appear here.
          </p>
          <Link
            to="/breeders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            Browse Breeders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Waitlist Positions" },
        ]}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">My Waitlist Positions</h1>
        <p className="text-text-secondary mt-1">
          Track your waitlist requests and deposit status
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border-subtle bg-portal-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{pendingRequests.length}</p>
          <p className="text-xs text-text-secondary mt-1">Pending</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-portal-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{approvedRequests.length}</p>
          <p className="text-xs text-text-secondary mt-1">Approved</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-portal-card p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{rejectedRequests.length}</p>
          <p className="text-xs text-text-secondary mt-1">Rejected</p>
        </div>
      </div>

      {/* Approved (with pending deposits first) */}
      {approvedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Approved</h2>
          {approvedRequests.map((request) => (
            <WaitlistCard
              key={request.id}
              request={request}
              onPayDeposit={handlePayDeposit}
            />
          ))}
        </div>
      )}

      {/* Pending */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Pending Review</h2>
          {pendingRequests.map((request) => (
            <WaitlistCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Rejected */}
      {rejectedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Rejected</h2>
          {rejectedRequests.map((request) => (
            <WaitlistCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WaitlistPositionsPage;

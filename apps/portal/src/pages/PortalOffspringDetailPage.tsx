// apps/portal/src/pages/PortalOffspringDetailPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi, type OffspringDetailDTO, type PlacementStatus } from "@bhq/api";

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

/* ───────────────── Timeline Event ───────────────── */

interface TimelineEventProps {
  label: string;
  date: string | null;
  isLast?: boolean;
}

function TimelineEvent({ label, date, isLast }: TimelineEventProps) {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Not yet";
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full ${
            date ? "bg-[hsl(var(--brand-orange))]" : "bg-neutral-300"
          }`}
        />
        {!isLast && (
          <div className={`w-0.5 flex-1 ${date ? "bg-neutral-200" : "bg-neutral-100"}`} />
        )}
      </div>
      <div className="pb-6">
        <div className="font-medium text-primary">{label}</div>
        <div className="text-sm text-secondary">{formatDate(date)}</div>
      </div>
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[hsl(var(--brand-orange))] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-secondary">Loading offspring details...</p>
    </div>
  );
}

/* ───────────────── Error State ───────────────── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
        !
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Could not load offspring</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto mb-4">
        This offspring may not exist or you may not have access to view it.
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalOffspringDetailPage() {
  const [offspring, setOffspring] = React.useState<OffspringDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Extract offspring ID from URL path
  const offspringId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/offspring\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const fetchOffspring = React.useCallback(async () => {
    if (!offspringId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getOffspringDetail(offspringId);
      setOffspring(data.offspring);
    } catch (err: any) {
      console.error("[PortalOffspringDetailPage] Failed to fetch offspring:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [offspringId]);

  React.useEffect(() => {
    fetchOffspring();
  }, [fetchOffspring]);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal/offspring");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const statusVariants: Record<PlacementStatus, "amber" | "green" | "blue" | "neutral"> = {
    WAITLISTED: "neutral",
    RESERVED: "amber",
    DEPOSIT_PAID: "amber",
    FULLY_PAID: "green",
    READY_FOR_PICKUP: "green",
    PLACED: "blue",
    CANCELLED: "neutral",
  };

  const statusLabels: Record<PlacementStatus, string> = {
    WAITLISTED: "Waitlisted",
    RESERVED: "Reserved",
    DEPOSIT_PAID: "Deposit Paid",
    FULLY_PAID: "Fully Paid",
    READY_FOR_PICKUP: "Ready for Pickup",
    PLACED: "Placed",
    CANCELLED: "Cancelled",
  };

  function formatDate(date: string | null): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }

  if (error || !offspring) {
    return (
      <div className="p-6">
        <ErrorState onRetry={fetchOffspring} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{offspring.name}</h1>
          <div className="mt-2">
            <Badge variant={statusVariants[offspring.placementStatus]}>
              {statusLabels[offspring.placementStatus]}
            </Badge>
          </div>
        </div>
        <Button variant="secondary" onClick={handleBackClick}>
          Back to Offspring
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Section */}
        <div className="bg-surface rounded-lg border border-hairline p-6">
          <h3 className="text-lg font-semibold text-primary mb-6">Timeline</h3>
          <div>
            <TimelineEvent label="Contract Signed" date={offspring.contractSignedAt} />
            <TimelineEvent label="Paid in Full" date={offspring.paidInFullAt} />
            <TimelineEvent label="Pickup" date={offspring.pickupAt} />
            <TimelineEvent label="Placed" date={offspring.placedAt} isLast />
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-surface rounded-lg border border-hairline p-6">
          <h3 className="text-lg font-semibold text-primary mb-6">Summary</h3>
          <div className="space-y-3">
            {offspring.sex && (
              <div className="flex justify-between">
                <span className="text-secondary">Sex</span>
                <span className="font-medium text-primary">{offspring.sex}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary">Species</span>
              <span className="font-medium text-primary">{offspring.species}</span>
            </div>
            {offspring.breed && (
              <div className="flex justify-between">
                <span className="text-secondary">Breed</span>
                <span className="font-medium text-primary">{offspring.breed}</span>
              </div>
            )}
            {offspring.birthDate && (
              <div className="flex justify-between">
                <span className="text-secondary">Birth Date</span>
                <span className="font-medium text-primary">{formatDate(offspring.birthDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parents & Group Section */}
      <div className="mt-6 bg-surface rounded-lg border border-hairline p-6">
        <h3 className="text-lg font-semibold text-primary mb-6">Parents & Group</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offspring.dam && (
            <div>
              <div className="text-sm text-secondary mb-1">Dam</div>
              <div className="font-medium text-primary">{offspring.dam.name}</div>
            </div>
          )}
          {offspring.sire && (
            <div>
              <div className="text-sm text-secondary mb-1">Sire</div>
              <div className="font-medium text-primary">{offspring.sire.name}</div>
            </div>
          )}
          {offspring.groupName && (
            <div>
              <div className="text-sm text-secondary mb-1">Group</div>
              <div className="font-medium text-primary">{offspring.groupName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Documents Hint */}
      <div className="mt-6 bg-neutral-50 rounded-lg border border-hairline p-4">
        <p className="text-sm text-secondary">
          Related documents for this offspring can be found on the{" "}
          <button
            onClick={() => {
              window.history.pushState(null, "", "/portal/documents");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="text-[hsl(var(--brand-orange))] hover:underline font-medium"
          >
            Documents page
          </button>
          .
        </p>
      </div>
    </div>
  );
}

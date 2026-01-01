// apps/portal/src/pages/PortalOffspringPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi, type OffspringPlacementDTO, type PlacementStatus } from "@bhq/api";
import PortalOffspringDetailPage from "./PortalOffspringDetailPage";

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

/* ───────────────── Placement Card ───────────────── */

function PlacementCard({ placement }: { placement: OffspringPlacementDTO }) {
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

  const offspringName = placement.offspring?.name || "Pending assignment";
  const groupLabel = placement.offspringGroupLabel || placement.offspringGroupCode;

  return (
    <div className="rounded-xl border border-hairline bg-surface/50 hover:bg-surface transition-colors overflow-hidden">
      {/* Placeholder for photo */}
      <div className="h-32 bg-surface-strong flex items-center justify-center text-4xl">
        🐕
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-primary">{offspringName}</h3>
          <Badge variant={statusVariants[placement.placementStatus]}>
            {statusLabels[placement.placementStatus]}
          </Badge>
        </div>
        <p className="text-sm text-secondary">Group: {groupLabel}</p>
        {placement.species && (
          <p className="text-xs text-secondary mt-0.5">
            {placement.species} {placement.breed ? `• ${placement.breed}` : ""}
          </p>
        )}
        {placement.birthDate && (
          <p className="text-xs text-secondary mt-0.5">Born: {formatDate(placement.birthDate)}</p>
        )}
        {placement.dam && (
          <p className="text-xs text-secondary mt-0.5">Dam: {placement.dam.name}</p>
        )}
        {placement.sire && (
          <p className="text-xs text-secondary mt-0.5">Sire: {placement.sire.name}</p>
        )}
        {placement.offspring?.sex && (
          <div className="mt-2 pt-2 border-t border-hairline text-xs text-secondary">
            <span>Sex: {placement.offspring.sex}</span>
          </div>
        )}
        <div className="mt-3">
          <Button variant="secondary" size="sm" className="w-full">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyPlacements() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        🐾
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No offspring yet</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you have reserved or placed animals, they will appear here.
      </p>
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
      <p className="text-sm text-secondary">Loading offspring...</p>
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
        Something went wrong. Please try again.
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalOffspringPage() {
  const [placements, setPlacements] = React.useState<OffspringPlacementDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchPlacements = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getOffspringPlacements();
      setPlacements(data.placements);
    } catch (err: any) {
      console.error("[PortalOffspringPage] Failed to fetch placements:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="My Offspring"
        subtitle={
          loading
            ? "Loading..."
            : placements.length > 0
            ? `${placements.length} placement${placements.length !== 1 ? "s" : ""}`
            : ""
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={fetchPlacements} />
        ) : placements.length === 0 ? (
          <EmptyPlacements />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {placements.map((placement) => (
              <PlacementCard key={placement.id} placement={placement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

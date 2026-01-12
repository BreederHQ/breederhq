// apps/portal/src/pages/PortalOffspringDetailPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { getSpeciesAccent } from "../ui/speciesTokens";
import { StatusBadge, type StatusVariant } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";
import { isDemoMode, generateDemoData } from "../demo/portalDemoData";

// Types from portal-data API
type PlacementStatus =
  | "WAITLISTED"
  | "RESERVED"
  | "DEPOSIT_PAID"
  | "FULLY_PAID"
  | "READY_FOR_PICKUP"
  | "PLACED"
  | "CANCELLED";

interface OffspringDetail {
  id: number;
  name: string;
  sex: string | null;
  breed: string | null;
  species: string;
  birthDate: string | null;
  placementStatus: PlacementStatus;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  groupId: number;
  groupName: string | null;
  contractSignedAt: string | null;
  paidInFullAt: string | null;
  pickupAt: string | null;
  placedAt: string | null;
  createdAt: string;
}

// Format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Map placement status to display
function getStatusLabel(status: PlacementStatus): string {
  switch (status) {
    case "WAITLISTED":
      return "Waitlisted";
    case "RESERVED":
      return "Reserved";
    case "DEPOSIT_PAID":
      return "Deposit Paid";
    case "FULLY_PAID":
      return "Paid in Full";
    case "READY_FOR_PICKUP":
      return "Ready for Pickup";
    case "PLACED":
      return "Placed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusVariant(status: PlacementStatus): StatusVariant {
  switch (status) {
    case "PLACED":
      return "success";
    case "FULLY_PAID":
    case "READY_FOR_PICKUP":
      return "success";
    case "RESERVED":
    case "DEPOSIT_PAID":
      return "action";
    case "WAITLISTED":
      return "warning";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

// Extract offspring ID from URL
function getOffspringIdFromUrl(): number | null {
  const path = window.location.pathname;
  const match = path.match(/\/offspring\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default function PortalOffspringDetailPageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [offspring, setOffspring] = React.useState<OffspringDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const offspringId = getOffspringIdFromUrl();

  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);

    async function loadOffspring() {
      if (!offspringId) {
        setError("Invalid offspring ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Check if demo mode is active
      if (isDemoMode()) {
        const demoData = generateDemoData();
        // Use the first placement as demo offspring detail
        const demoPlacement = demoData.placements[0];
        if (demoPlacement) {
          const demoOffspring: OffspringDetail = {
            id: demoPlacement.id,
            name: demoPlacement.offspring.name,
            sex: "Female",
            breed: demoPlacement.offspring.breed,
            species: demoPlacement.offspring.species,
            birthDate: "2025-10-15",
            placementStatus: "RESERVED" as PlacementStatus,
            dam: { id: 101, name: "Bella" },
            sire: { id: 102, name: "Max" },
            groupId: 1,
            groupName: "Fall 2025 Litter",
            contractSignedAt: null,
            paidInFullAt: demoPlacement.paidInFullAt,
            pickupAt: demoPlacement.pickupAt,
            placedAt: null,
            createdAt: "2025-10-15T10:00:00Z",
          };
          setOffspring(demoOffspring);
        }
        setLoading(false);
        return;
      }

      try {
        const data = await portalFetch<{ offspring?: any }>(`/portal/offspring/${offspringId}`);
        setOffspring(data.offspring || data);
      } catch (err: any) {
        console.error("[PortalOffspringDetail] Failed to load:", err);
        if (err?.status === 404) {
          setError("Offspring not found");
        } else {
          setError("Failed to load offspring details");
        }
      } finally {
        setLoading(false);
      }
    }

    loadOffspring();
  }, [offspringId, tenantSlug, isReady]);

  const handleBack = () => {
    window.history.pushState({}, "", "/offspring");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack} />
        <div
          style={{
            height: "200px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
            marginTop: "var(--portal-space-4)",
          }}
        />
      </PageContainer>
    );
  }

  if (error || !offspring) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack} />
        <SectionCard>
          <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
            {error || "Offspring not found"}
          </p>
        </SectionCard>
      </PageContainer>
    );
  }

  const accent = getSpeciesAccent(offspring.species);
  const statusVariant = getStatusVariant(offspring.placementStatus);

  return (
    <PageContainer>
      <BackButton onClick={handleBack} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--portal-space-4)",
          marginBottom: "var(--portal-space-5)",
          marginTop: "var(--portal-space-4)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              margin: 0,
            }}
          >
            {offspring.name}
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            {offspring.species}
            {offspring.breed && ` · ${offspring.breed}`}
            {offspring.sex && ` · ${offspring.sex}`}
          </p>
        </div>
        <StatusBadge
          label={getStatusLabel(offspring.placementStatus)}
          variant={statusVariant}
          speciesAccent={accent}
        />
      </div>

      {/* Details Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--portal-space-4)",
        }}
      >
        {/* Basic Info */}
        <SectionCard>
          <SectionTitle>Basic Information</SectionTitle>
          <DetailRow label="Birth Date" value={formatDate(offspring.birthDate)} />
          <DetailRow label="Litter/Group" value={offspring.groupName || `Group #${offspring.groupId}`} />
          <DetailRow label="Dam" value={offspring.dam?.name || "—"} />
          <DetailRow label="Sire" value={offspring.sire?.name || "—"} />
        </SectionCard>

        {/* Placement Status */}
        <SectionCard>
          <SectionTitle>Placement Status</SectionTitle>
          <DetailRow label="Current Status" value={getStatusLabel(offspring.placementStatus)} />
          <DetailRow label="Contract Signed" value={formatDate(offspring.contractSignedAt)} />
          <DetailRow label="Paid in Full" value={formatDate(offspring.paidInFullAt)} />
          <DetailRow label="Pickup Date" value={formatDate(offspring.pickupAt)} />
          {offspring.placedAt && (
            <DetailRow label="Placed On" value={formatDate(offspring.placedAt)} />
          )}
        </SectionCard>
      </div>

      {/* Timeline */}
      <div style={{ marginTop: "var(--portal-space-5)" }}>
        <SectionCard>
          <SectionTitle>Timeline</SectionTitle>
          <Timeline offspring={offspring} />
        </SectionCard>
      </div>
    </PageContainer>
  );
}

// Back button component
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        padding: 0,
        fontSize: "var(--portal-font-size-sm)",
        color: "var(--portal-text-secondary)",
        cursor: "pointer",
        transition: "color var(--portal-transition)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--portal-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--portal-text-secondary)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to Offspring
    </button>
  );
}

// Section title component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "var(--portal-font-size-sm)",
        fontWeight: "var(--portal-font-weight-semibold)",
        color: "var(--portal-text-primary)",
        margin: "0 0 var(--portal-space-3) 0",
        paddingBottom: "var(--portal-space-2)",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      {children}
    </h3>
  );
}

// Detail row component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--portal-space-2) 0",
      }}
    >
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-primary)",
          fontWeight: "var(--portal-font-weight-medium)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Timeline component
function Timeline({ offspring }: { offspring: OffspringDetail }) {
  const events: Array<{ date: string; label: string; completed: boolean }> = [];

  // Add events in chronological order
  if (offspring.createdAt) {
    events.push({ date: offspring.createdAt, label: "Added to your portal", completed: true });
  }
  if (offspring.contractSignedAt) {
    events.push({ date: offspring.contractSignedAt, label: "Contract signed", completed: true });
  }
  if (offspring.paidInFullAt) {
    events.push({ date: offspring.paidInFullAt, label: "Payment completed", completed: true });
  }
  if (offspring.pickupAt) {
    const isPast = new Date(offspring.pickupAt) < new Date();
    events.push({
      date: offspring.pickupAt,
      label: isPast ? "Picked up" : "Scheduled pickup",
      completed: isPast,
    });
  }
  if (offspring.placedAt) {
    events.push({ date: offspring.placedAt, label: "Placed with you", completed: true });
  }

  if (events.length === 0) {
    return (
      <p style={{ color: "var(--portal-text-tertiary)", margin: 0, fontSize: "var(--portal-font-size-sm)" }}>
        No timeline events yet.
      </p>
    );
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {events.map((event, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: event.completed ? "var(--portal-accent)" : "var(--portal-border)",
              marginTop: "5px",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-primary)",
                fontWeight: "var(--portal-font-weight-medium)",
              }}
            >
              {event.label}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              {formatDate(event.date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

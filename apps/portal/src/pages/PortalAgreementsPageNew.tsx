// apps/portal/src/pages/PortalAgreementsPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { makeApi, type AgreementDTO, type ContractStatus } from "@bhq/api";
import { SubjectHeader } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

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

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge Component
 * ──────────────────────────────────────────────────────────────────────────── */

function AgreementStatusBadge({ status }: { status: ContractStatus }) {
  const config: Record<ContractStatus, { label: string; bg: string; color: string; dot: string }> = {
    draft: {
      label: "Draft",
      bg: "var(--portal-bg-elevated)",
      color: "var(--portal-text-tertiary)",
      dot: "var(--portal-text-tertiary)",
    },
    sent: {
      label: "Pending Signature",
      bg: "var(--portal-warning-soft)",
      color: "var(--portal-warning)",
      dot: "var(--portal-warning)",
    },
    viewed: {
      label: "Viewed",
      bg: "var(--portal-warning-soft)",
      color: "var(--portal-warning)",
      dot: "var(--portal-warning)",
    },
    signed: {
      label: "Signed",
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dot: "var(--portal-success)",
    },
    declined: {
      label: "Declined",
      bg: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      dot: "var(--portal-error)",
    },
    voided: {
      label: "Voided",
      bg: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      dot: "var(--portal-error)",
    },
    expired: {
      label: "Expired",
      bg: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      dot: "var(--portal-error)",
    },
  };

  const c = config[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        background: c.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: c.dot,
          boxShadow: status === "sent" || status === "viewed" ? `0 0 6px ${c.dot}` : "none",
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-xs)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: c.color,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {c.label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Agreement Type Icon
 * ──────────────────────────────────────────────────────────────────────────── */

function AgreementIcon({ status }: { status: ContractStatus }) {
  const isAction = status === "sent" || status === "viewed";
  const isSigned = status === "signed";

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--portal-radius-lg)",
        background: isAction
          ? "var(--portal-warning-soft)"
          : isSigned
          ? "var(--portal-success-soft)"
          : "var(--portal-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
      }}
    >
      {isSigned ? "✅" : "📝"}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Agreement Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface AgreementRowProps {
  agreement: AgreementDTO;
}

function AgreementRow({ agreement }: AgreementRowProps) {
  const handleClick = () => {
    window.history.pushState(null, "", `/agreements/${agreement.id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  function formatDate(date: string | null): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Build subtitle based on status
  let subtitle = "";
  if (agreement.signedAt) {
    subtitle = `Signed ${formatDate(agreement.signedAt)}`;
  } else if (agreement.expirationDate) {
    const expDate = new Date(agreement.expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      subtitle = "Expired";
    } else if (diffDays === 0) {
      subtitle = "Expires today";
    } else if (diffDays === 1) {
      subtitle = "Expires tomorrow";
    } else if (diffDays <= 7) {
      subtitle = `Expires in ${diffDays} days`;
    } else {
      subtitle = `Expires ${formatDate(agreement.expirationDate)}`;
    }
  } else if (agreement.effectiveDate) {
    subtitle = `Effective ${formatDate(agreement.effectiveDate)}`;
  }

  return (
    <CardRow onClick={handleClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <AgreementIcon status={agreement.status} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {agreement.name}
            </div>
            <AgreementStatusBadge status={agreement.status} />
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color:
                  agreement.status === "sent" || agreement.status === "viewed"
                    ? "var(--portal-warning)"
                    : "var(--portal-text-secondary)",
                fontWeight:
                  agreement.status === "sent" || agreement.status === "viewed"
                    ? "var(--portal-font-weight-medium)"
                    : "normal",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Agreement Group Section
 * ──────────────────────────────────────────────────────────────────────────── */

interface AgreementGroupProps {
  title: string;
  agreements: AgreementDTO[];
}

function AgreementGroup({ title, agreements }: AgreementGroupProps) {
  if (agreements.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--portal-space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
          marginBottom: "var(--portal-space-3)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--portal-letter-spacing-wide)",
            color: "var(--portal-text-tertiary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            background: "var(--portal-bg-elevated)",
            padding: "2px 8px",
            borderRadius: "var(--portal-radius-full)",
          }}
        >
          {agreements.length}
        </span>
      </div>
      <PortalCard variant="elevated" padding="none">
        {agreements.map((agreement) => (
          <AgreementRow key={agreement.id} agreement={agreement} />
        ))}
      </PortalCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyAgreements({ animalName }: { animalName: string }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          📝
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No agreements yet
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Agreements related to {animalName}'s placement will appear here when they're ready.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "120px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "100px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State
 * ──────────────────────────────────────────────────────────────────────────── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-error-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "var(--portal-error)",
          }}
        >
          !
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Unable to load agreements
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          Something went wrong. Please try again.
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "var(--portal-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            cursor: "pointer",
            transition: "opacity var(--portal-transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Try Again
        </button>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalAgreementsPageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [agreements, setAgreements] = React.useState<AgreementDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);

  // Animal context
  const animalName = primaryAnimal?.offspring?.name || "your reservation";
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Load primary animal context - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);
    let cancelled = false;

    async function loadAnimalContext() {
      try {
        const data = await portalFetch<{ placements: any[] }>("/portal/placements");
        if (cancelled) return;
        const placements = data.placements || [];
        if (placements.length > 0) {
          setPrimaryAnimal(placements[0]);
        }
      } catch (err) {
        // Silently ignore - animal context is optional for display
      }
    }
    loadAnimalContext();
    return () => { cancelled = true; };
  }, [tenantSlug, isReady]);

  const fetchAgreements = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getAgreements();
      setAgreements(data.agreements || []);
    } catch (err: any) {
      console.error("[PortalAgreementsPageNew] Failed to fetch agreements:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  // Group agreements by status
  const pending = agreements.filter((a) => a.status === "sent" || a.status === "viewed");
  const signed = agreements.filter((a) => a.status === "signed");
  const other = agreements.filter(
    (a) => !["sent", "viewed", "signed"].includes(a.status)
  );

  const pendingCount = pending.length;

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <ErrorState onRetry={fetchAgreements} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Agreements"
          subtitle={`Contracts and agreements for ${animalName}`}
          animalContext={animalName}
          status={pendingCount > 0 ? "action" : "success"}
          statusLabel={pendingCount > 0 ? `${pendingCount} pending` : "All signed"}
          actionCount={pendingCount > 0 ? pendingCount : undefined}
          actionLabel={pendingCount === 1 ? "needs your signature" : "need your signature"}
        />

        {/* Subject Header - Species-aware context */}
        <SubjectHeader
          name={animalName}
          species={species}
          breed={breed}
          statusLabel={pendingCount > 0 ? `${pendingCount} pending` : "All signed"}
          statusVariant={pendingCount > 0 ? "warning" : "success"}
        />

        {/* Agreement Groups */}
        {agreements.length === 0 ? (
          <EmptyAgreements animalName={animalName} />
        ) : (
          <>
            <AgreementGroup title="Pending Signature" agreements={pending} />
            <AgreementGroup title="Signed" agreements={signed} />
            <AgreementGroup title="Other" agreements={other} />
          </>
        )}
      </div>
    </PageContainer>
  );
}

// apps/portal/src/pages/PortalAgreementDetailPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { makeApi } from "@bhq/api";
import type { AgreementDetailDTO, ContractStatus } from "@bhq/api";

// Resolve API base URL (same pattern as taskSources)
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge Component
 * ────────────────────────────────────────────────────────────────────────── */

interface StatusBadgeProps {
  status: ContractStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<ContractStatus, string> = {
    draft: "var(--portal-text-tertiary)",
    sent: "rgba(211, 134, 91, 0.8)",
    viewed: "rgba(211, 134, 91, 0.8)",
    signed: "rgba(139, 195, 74, 0.8)",
    declined: "rgba(239, 83, 80, 0.8)",
    voided: "rgba(239, 83, 80, 0.8)",
    expired: "rgba(239, 83, 80, 0.8)",
  };

  const statusBgs: Record<ContractStatus, string> = {
    draft: "var(--portal-bg-elevated)",
    sent: "rgba(211, 134, 91, 0.15)",
    viewed: "rgba(211, 134, 91, 0.15)",
    signed: "rgba(139, 195, 74, 0.15)",
    declined: "rgba(239, 83, 80, 0.15)",
    voided: "rgba(239, 83, 80, 0.15)",
    expired: "rgba(239, 83, 80, 0.15)",
  };

  const statusLabels: Record<ContractStatus, string> = {
    draft: "Draft",
    sent: "Pending",
    viewed: "Viewed",
    signed: "Signed",
    declined: "Declined",
    voided: "Voided",
    expired: "Expired",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-semibold)",
        color: statusColors[status],
        background: statusBgs[status],
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      {statusLabels[status]}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Timeline Event Component
 * ────────────────────────────────────────────────────────────────────────── */

interface TimelineEventProps {
  label: string;
  date: string | null;
  isLast?: boolean;
}

function TimelineEvent({ label, date, isLast }: TimelineEventProps) {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Not yet";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const hasDate = Boolean(date);

  return (
    <div style={{ display: "flex", gap: "var(--portal-space-3)" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "var(--portal-radius-full)",
            background: hasDate ? "var(--portal-accent)" : "var(--portal-border)",
          }}
        />
        {!isLast && (
          <div
            style={{
              width: "2px",
              flex: 1,
              background: hasDate ? "var(--portal-border-subtle)" : "var(--portal-border-subtle)",
              marginTop: "4px",
              marginBottom: "4px",
              minHeight: "24px",
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : "var(--portal-space-3)" }}>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-primary)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-secondary)",
            marginTop: "2px",
          }}
        >
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Party Row Component
 * ────────────────────────────────────────────────────────────────────────── */

interface PartyRowProps {
  role: string;
  name: string;
  signedAt: string | null;
  isClient?: boolean;
}

function PartyRow({ role, name, signedAt, isClient }: PartyRowProps) {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Not signed";
    return `Signed ${new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--portal-space-3) 0",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-primary)",
          }}
        >
          {name}
          {isClient && (
            <span
              style={{
                marginLeft: "var(--portal-space-2)",
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-secondary)",
              }}
            >
              (You)
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-secondary)",
            marginTop: "2px",
          }}
        >
          {role}
        </div>
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-xs)",
          color: "var(--portal-text-secondary)",
        }}
      >
        {formatDate(signedAt)}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────────────────── */

export default function PortalAgreementDetailPage() {
  const [agreement, setAgreement] = React.useState<AgreementDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Extract agreement ID from URL path
  const agreementId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/agreements\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const fetchAgreement = React.useCallback(async () => {
    if (!agreementId) {
      setError("Agreement not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.portalData.getAgreementDetail(agreementId);
      setAgreement(data.agreement);
    } catch (err: any) {
      console.error("[PortalAgreementDetailPage] Failed to fetch agreement:", err);
      setError("Failed to load agreement");
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  React.useEffect(() => {
    fetchAgreement();
  }, [fetchAgreement]);

  const handleBack = () => {
    window.history.pushState(null, "", "/portal/agreements");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleRetry = () => {
    fetchAgreement();
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--portal-space-3)",
          }}
        >
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
      </PageContainer>
    );
  }

  // Error state
  if (error || !agreement) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "60vh",
            gap: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            Unable to load agreement
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {error || "This agreement may not exist or you may not have access."}
          </div>
          <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
            <button
              onClick={handleRetry}
              style={{
                padding: "var(--portal-space-2) var(--portal-space-4)",
                background: "var(--portal-accent)",
                color: "var(--portal-text-primary)",
                border: "none",
                borderRadius: "var(--portal-radius-md)",
                fontSize: "var(--portal-font-size-sm)",
                fontWeight: "var(--portal-font-weight-medium)",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
            <button
              onClick={handleBack}
              style={{
                padding: "var(--portal-space-2) var(--portal-space-4)",
                background: "transparent",
                color: "var(--portal-text-secondary)",
                border: "1px solid var(--portal-border)",
                borderRadius: "var(--portal-radius-md)",
                fontSize: "var(--portal-font-size-sm)",
                fontWeight: "var(--portal-font-weight-medium)",
                cursor: "pointer",
              }}
            >
              Back to agreements
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Detail view
  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              cursor: "pointer",
              alignSelf: "flex-start",
              transition: "color var(--portal-transition)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--portal-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--portal-text-secondary)";
            }}
          >
            ← Back to agreements
          </button>
          <div>
            <h1
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                margin: 0,
              }}
            >
              {agreement.title}
            </h1>
            <div style={{ marginTop: "var(--portal-space-2)" }}>
              <StatusBadge status={agreement.status} />
            </div>
          </div>
        </div>

        {/* Two-column layout for Timeline and Parties */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--portal-space-4)",
          }}
        >
          {/* Timeline */}
          <div>
            <h2
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-3)",
              }}
            >
              Timeline
            </h2>
            <div>
              <TimelineEvent label="Created" date={agreement.createdAt} />
              <TimelineEvent label="Issued" date={agreement.issuedAt} />
              <TimelineEvent label="Signed" date={agreement.signedAt} />
              <TimelineEvent label="Expires" date={agreement.expiresAt} isLast />
            </div>
          </div>

          {/* Parties */}
          <div>
            <h2
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-3)",
              }}
            >
              Parties
            </h2>
            <div>
              <PartyRow
                role={agreement.clientParty.role}
                name={agreement.clientParty.name}
                signedAt={agreement.clientParty.signedAt}
                isClient
              />
              {agreement.counterparties.map((party, index) => (
                <PartyRow
                  key={index}
                  role={party.role}
                  name={party.name}
                  signedAt={party.signedAt}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Download Notice */}
        <div
          style={{
            padding: "var(--portal-space-3)",
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        >
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: 0,
            }}
          >
            Downloads are not available in the client portal.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

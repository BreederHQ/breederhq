// apps/portal/src/pages/PortalAgreementDetailPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { StatusBadge, type StatusVariant } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext, buildApiPath } from "../derived/tenantContext";
import { isDemoMode, generateDemoData } from "../demo/portalDemoData";

// Types from portal-data API
type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "voided" | "expired";

interface AgreementParty {
  role: string;
  name: string;
  signedAt: string | null;
}

interface AgreementDetail {
  id: number;
  title: string;
  status: ContractStatus;
  issuedAt: string | null;
  signedAt: string | null;
  voidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  clientParty: AgreementParty;
  counterparties: AgreementParty[];
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

// Map status to display label
function getStatusLabel(status: ContractStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Awaiting Signature";
    case "viewed":
      return "Viewed";
    case "signed":
      return "Signed";
    case "declined":
      return "Declined";
    case "voided":
      return "Voided";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

function getStatusVariant(status: ContractStatus): StatusVariant {
  switch (status) {
    case "signed":
      return "success";
    case "sent":
    case "viewed":
      return "action";
    case "draft":
      return "neutral";
    case "declined":
    case "voided":
    case "expired":
      return "warning";
    default:
      return "neutral";
  }
}

// Extract agreement ID from URL
function getAgreementIdFromUrl(): number | null {
  const path = window.location.pathname;
  const match = path.match(/\/agreements\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default function PortalAgreementDetailPageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [agreement, setAgreement] = React.useState<AgreementDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const agreementId = getAgreementIdFromUrl();

  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);

    async function loadAgreement() {
      if (!agreementId) {
        setError("Invalid agreement ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Check if demo mode is active
      if (isDemoMode()) {
        const demoData = generateDemoData();
        // Find the agreement by ID, or use first agreement
        const demoAgreement = demoData.agreements.find((a) => a.id === agreementId) || demoData.agreements[0];
        if (demoAgreement) {
          const agreementDetail: AgreementDetail = {
            id: demoAgreement.id,
            title: demoAgreement.title,
            status: demoAgreement.status as ContractStatus,
            issuedAt: demoAgreement.sentAt,
            signedAt: demoAgreement.signedAt || null,
            voidedAt: null,
            expiresAt: null,
            createdAt: demoAgreement.sentAt,
            clientParty: {
              role: "Client",
              name: "You",
              signedAt: demoAgreement.signedAt || null,
            },
            counterparties: [
              {
                role: "Breeder",
                name: "Breeder Name",
                signedAt: demoAgreement.status === "signed" ? demoAgreement.sentAt : null,
              },
            ],
          };
          setAgreement(agreementDetail);
        }
        setLoading(false);
        return;
      }

      try {
        const data = await portalFetch<{ agreement?: any }>(`/portal/agreements/${agreementId}`);
        setAgreement(data.agreement || data);
      } catch (err: any) {
        console.error("[PortalAgreementDetail] Failed to load:", err);
        if (err?.status === 404) {
          setError("Agreement not found");
        } else {
          setError("Failed to load agreement details");
        }
      } finally {
        setLoading(false);
      }
    }

    loadAgreement();
  }, [agreementId, tenantSlug, isReady]);

  const handleBack = () => {
    window.history.pushState({}, "", "/agreements");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDownload = async () => {
    if (!agreementId) return;

    // Demo mode: Show alert instead of downloading
    if (isDemoMode()) {
      alert("📄 Demo Mode: In production, this would download the agreement PDF.");
      return;
    }

    // Open PDF download in new tab
    window.open(buildApiPath(`/portal/agreements/${agreementId}/pdf`, tenantSlug), "_blank");
  };

  const handleSign = () => {
    // Demo mode: Show alert
    if (isDemoMode()) {
      alert("✍️ Demo Mode: In production, this would open the signing workflow where you can electronically sign the agreement.");
      return;
    }

    // Navigate to signing flow or open signing modal
    // For now, we'll show an alert - this would be enhanced with actual signing UI
    alert("Signing functionality would open here. This will be connected to the signing workflow.");
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

  if (error || !agreement) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack} />
        <SectionCard>
          <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
            {error || "Agreement not found"}
          </p>
        </SectionCard>
      </PageContainer>
    );
  }

  const needsSignature = (agreement.status === "sent" || agreement.status === "viewed") && !agreement.clientParty.signedAt;
  const statusVariant = getStatusVariant(agreement.status);

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
            {agreement.title}
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            Agreement #{agreement.id}
          </p>
        </div>
        <StatusBadge label={getStatusLabel(agreement.status)} variant={statusVariant} />
      </div>

      {/* Action Banner for pending signature */}
      {needsSignature && (
        <div
          style={{
            background: "var(--portal-accent-subtle)",
            border: "1px solid var(--portal-accent)",
            borderRadius: "var(--portal-radius-lg)",
            padding: "var(--portal-space-4)",
            marginBottom: "var(--portal-space-5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--portal-space-4)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "var(--portal-font-size-sm)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                margin: 0,
              }}
            >
              Your signature is required
            </p>
            <p
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              Please review and sign this agreement to proceed.
            </p>
          </div>
          <button
            onClick={handleSign}
            style={{
              background: "var(--portal-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--portal-radius-md)",
              padding: "10px 20px",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Review & Sign
          </button>
        </div>
      )}

      {/* Details Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--portal-space-4)",
        }}
      >
        {/* Agreement Info */}
        <SectionCard>
          <SectionTitle>Agreement Information</SectionTitle>
          <DetailRow label="Status" value={getStatusLabel(agreement.status)} />
          <DetailRow label="Issued" value={formatDate(agreement.issuedAt)} />
          {agreement.expiresAt && (
            <DetailRow label="Expires" value={formatDate(agreement.expiresAt)} />
          )}
          <DetailRow label="Created" value={formatDate(agreement.createdAt)} />
          {agreement.voidedAt && (
            <DetailRow label="Voided" value={formatDate(agreement.voidedAt)} />
          )}
        </SectionCard>

        {/* Your Signature */}
        <SectionCard>
          <SectionTitle>Your Signature</SectionTitle>
          <DetailRow label="Role" value={formatRole(agreement.clientParty.role)} />
          <DetailRow label="Name" value={agreement.clientParty.name} />
          <DetailRow
            label="Signed"
            value={agreement.clientParty.signedAt ? formatDate(agreement.clientParty.signedAt) : "Not yet signed"}
          />
        </SectionCard>
      </div>

      {/* Counterparties */}
      {agreement.counterparties.length > 0 && (
        <div style={{ marginTop: "var(--portal-space-5)" }}>
          <SectionCard>
            <SectionTitle>Other Parties</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
              {agreement.counterparties.map((party, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--portal-space-3)",
                    background: "var(--portal-bg-subtle)",
                    borderRadius: "var(--portal-radius-md)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "var(--portal-font-size-sm)",
                        fontWeight: "var(--portal-font-weight-medium)",
                        color: "var(--portal-text-primary)",
                        margin: 0,
                      }}
                    >
                      {party.name}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--portal-font-size-xs)",
                        color: "var(--portal-text-tertiary)",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {formatRole(party.role)}
                    </p>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-xs)",
                      color: party.signedAt ? "var(--portal-success)" : "var(--portal-text-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {party.signedAt ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                        Signed {formatDate(party.signedAt)}
                      </>
                    ) : (
                      "Awaiting signature"
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          marginTop: "var(--portal-space-5)",
          display: "flex",
          gap: "var(--portal-space-3)",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleDownload}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border)",
            borderRadius: "var(--portal-radius-md)",
            padding: "10px 16px",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-primary)",
            cursor: "pointer",
            transition: "all var(--portal-transition)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8m0 0l-3-3m3 3l3-3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12v2h12v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download PDF
        </button>
        {needsSignature && (
          <button
            onClick={handleSign}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--portal-accent)",
              border: "none",
              borderRadius: "var(--portal-radius-md)",
              padding: "10px 16px",
              fontSize: "var(--portal-font-size-sm)",
              color: "#fff",
              cursor: "pointer",
              transition: "all var(--portal-transition)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12.5 3.5l-9 9L2 14l1.5-1.5 9-9M10.5 5.5l-2-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Review & Sign
          </button>
        )}
      </div>
    </PageContainer>
  );
}

// Format role for display
function formatRole(role: string): string {
  switch (role) {
    case "SELLER":
      return "Seller";
    case "BUYER":
      return "Buyer";
    case "GUARANTOR":
      return "Guarantor";
    case "WITNESS":
      return "Witness";
    default:
      return role;
  }
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
      Back to Agreements
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

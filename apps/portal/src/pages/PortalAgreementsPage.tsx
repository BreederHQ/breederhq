// apps/portal/src/pages/PortalAgreementsPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi, type AgreementDTO, type ContractStatus } from "@bhq/api";
import PortalAgreementDetailPage from "./PortalAgreementDetailPage";

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

/* ───────────────── Agreement Row ───────────────── */

function AgreementRow({ agreement }: { agreement: AgreementDTO }) {
  const statusVariants: Record<ContractStatus, "amber" | "green" | "red" | "neutral"> = {
    draft: "neutral",
    sent: "amber",
    viewed: "amber",
    signed: "green",
    declined: "red",
    voided: "red",
    expired: "red",
  };

  const statusLabels: Record<ContractStatus, string> = {
    draft: "Draft",
    sent: "Pending Signature",
    viewed: "Viewed",
    signed: "Signed",
    declined: "Declined",
    voided: "Voided",
    expired: "Expired",
  };

  function formatDate(date: string | null): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  const handleViewClick = () => {
    window.history.pushState(null, "", `/portal/agreements/${agreement.id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[agreement.status]}>
              {statusLabels[agreement.status]}
            </Badge>
            {agreement.role && (
              <span className="text-xs text-secondary">Role: {agreement.role}</span>
            )}
          </div>
          <div className="font-medium text-primary mt-2">{agreement.name}</div>
          <div className="text-xs text-secondary mt-1">
            {agreement.effectiveDate && `Effective: ${formatDate(agreement.effectiveDate)}`}
            {agreement.expirationDate && ` • Expires: ${formatDate(agreement.expirationDate)}`}
            {agreement.signedAt && ` • Signed: ${formatDate(agreement.signedAt)}`}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleViewClick}>
          View
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyAgreements() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh] max-w-[480px] mx-auto px-4">
      <h3 className="text-xl font-semibold text-primary mb-2">No agreements yet</h3>
      <p className="text-base text-secondary leading-relaxed">
        Agreements shared with you will appear here.
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
      <p className="text-sm text-secondary">Loading agreements...</p>
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
      <h3 className="text-lg font-medium text-primary mb-2">Could not load agreements</h3>
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

export default function PortalAgreementsPage() {
  // Check if we're viewing a specific agreement detail
  const isDetailView = window.location.pathname.match(/\/portal\/agreements\/\d+/);

  // If viewing detail, render the detail page
  if (isDetailView) {
    return <PortalAgreementDetailPage />;
  }

  // Otherwise, render the list
  return <AgreementsList />;
}

/* ───────────────── Agreements List Component ───────────────── */

function AgreementsList() {
  const [agreements, setAgreements] = React.useState<AgreementDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchAgreements = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getAgreements();
      setAgreements(data.agreements);
    } catch (err: any) {
      console.error("[PortalAgreementsPage] Failed to fetch agreements:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const pendingCount = agreements.filter((a) => a.status === "sent").length;

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Agreements"
        subtitle={
          loading
            ? "Loading..."
            : pendingCount > 0
            ? `${pendingCount} agreement${pendingCount !== 1 ? "s" : ""} pending your signature`
            : agreements.length > 0
            ? "All agreements signed"
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
          <ErrorState onRetry={fetchAgreements} />
        ) : agreements.length === 0 ? (
          <EmptyAgreements />
        ) : (
          <div className="space-y-3">
            {agreements.map((agreement) => (
              <AgreementRow key={agreement.id} agreement={agreement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

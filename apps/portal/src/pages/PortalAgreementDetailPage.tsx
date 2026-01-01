// apps/portal/src/pages/PortalAgreementDetailPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi, type AgreementDetailDTO, type ContractStatus } from "@bhq/api";

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

/* ───────────────── Party Row ───────────────── */

interface PartyRowProps {
  role: string;
  name: string;
  signedAt: string | null;
  isClient?: boolean;
}

function PartyRow({ role, name, signedAt, isClient }: PartyRowProps) {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Not signed";
    return `Signed ${new Date(dateStr).toLocaleDateString()}`;
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-hairline last:border-b-0">
      <div>
        <div className="font-medium text-primary">
          {name}
          {isClient && <span className="ml-2 text-xs text-secondary">(You)</span>}
        </div>
        <div className="text-sm text-secondary">{role}</div>
      </div>
      <div className="text-sm text-secondary">{formatDate(signedAt)}</div>
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
      <p className="text-sm text-secondary">Loading agreement...</p>
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
      <h3 className="text-lg font-medium text-primary mb-2">Could not load agreement</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto mb-4">
        This agreement may not exist or you may not have access to view it.
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalAgreementDetailPage() {
  const [agreement, setAgreement] = React.useState<AgreementDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Extract agreement ID from URL path
  const agreementId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/agreements\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const fetchAgreement = React.useCallback(async () => {
    if (!agreementId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getAgreementDetail(agreementId);
      setAgreement(data.agreement);
    } catch (err: any) {
      console.error("[PortalAgreementDetailPage] Failed to fetch agreement:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  React.useEffect(() => {
    fetchAgreement();
  }, [fetchAgreement]);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal/agreements");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="p-6">
        <ErrorState onRetry={fetchAgreement} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{agreement.title}</h1>
          <div className="mt-2">
            <Badge variant={statusVariants[agreement.status]}>
              {statusLabels[agreement.status]}
            </Badge>
          </div>
        </div>
        <Button variant="secondary" onClick={handleBackClick}>
          Back to Agreements
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Section */}
        <div className="bg-surface rounded-lg border border-hairline p-6">
          <h3 className="text-lg font-semibold text-primary mb-6">Timeline</h3>
          <div>
            <TimelineEvent label="Created" date={agreement.createdAt} />
            <TimelineEvent label="Issued" date={agreement.issuedAt} />
            <TimelineEvent label="Signed" date={agreement.signedAt} />
            <TimelineEvent label="Expires" date={agreement.expiresAt} isLast />
          </div>
        </div>

        {/* Parties Section */}
        <div className="bg-surface rounded-lg border border-hairline p-6">
          <h3 className="text-lg font-semibold text-primary mb-6">Parties</h3>
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

      {/* Document Download Note */}
      <div className="mt-6 bg-neutral-50 rounded-lg border border-hairline p-4">
        <p className="text-sm text-secondary">
          Document download is not available yet. When storage is configured, you will be able to
          download a copy of this agreement.
        </p>
      </div>
    </div>
  );
}

// apps/portal/src/pages/PortalAgreementsPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockAgreements, type PortalAgreement } from "../mock";

/* ───────────────── Agreement Row ───────────────── */

function AgreementRow({ agreement }: { agreement: PortalAgreement }) {
  const statusVariants: Record<PortalAgreement["status"], "amber" | "green" | "red"> = {
    pending: "amber",
    signed: "green",
    expired: "red",
  };

  const statusLabels: Record<PortalAgreement["status"], string> = {
    pending: "Pending Signature",
    signed: "Signed",
    expired: "Expired",
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[agreement.status]}>
              {statusLabels[agreement.status]}
            </Badge>
            {agreement.dueDate && (
              <span className="text-xs text-secondary">Due: {agreement.dueDate}</span>
            )}
          </div>
          <div className="font-medium text-primary mt-2">{agreement.title}</div>
        </div>
        {agreement.status === "pending" && (
          <Button variant="primary" size="sm">
            Review and Sign
          </Button>
        )}
        {agreement.status === "signed" && (
          <Button variant="secondary" size="sm">
            Download
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyAgreements() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        📝
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No agreements</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you have agreements to review or sign, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalAgreementsPage() {
  const pendingCount = mockAgreements.filter((a) => a.status === "pending").length;

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Agreements"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} agreement${pendingCount !== 1 ? "s" : ""} pending your signature`
            : "All agreements signed"
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockAgreements.length === 0 ? (
          <EmptyAgreements />
        ) : (
          <div className="space-y-3">
            {mockAgreements.map((agreement) => (
              <AgreementRow key={agreement.id} agreement={agreement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

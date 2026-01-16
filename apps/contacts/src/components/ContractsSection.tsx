// apps/contacts/src/components/ContractsSection.tsx
// Contracts section for Documents tab in contact details

import * as React from "react";
import { FileText, Download, Eye, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { SectionCard } from "@bhq/ui";

interface Contract {
  id: number;
  title: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined" | "voided" | "expired";
  createdAt: string;
  signedAt?: string;
  expiresAt?: string;
  template?: {
    name: string;
    category: string;
  };
}

interface ContractsSectionProps {
  partyId: number;
  api: any;
}

const STATUS_STYLES: Record<string, { badge: string; icon: React.ReactNode; iconColor: string }> = {
  draft: {
    badge: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
    icon: <FileText className="w-4 h-4" />,
    iconColor: "text-zinc-500",
  },
  sent: {
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    icon: <Clock className="w-4 h-4" />,
    iconColor: "text-amber-500",
  },
  viewed: {
    badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    icon: <Eye className="w-4 h-4" />,
    iconColor: "text-blue-500",
  },
  signed: {
    badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    icon: <CheckCircle className="w-4 h-4" />,
    iconColor: "text-emerald-500",
  },
  declined: {
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: "text-red-500",
  },
  voided: {
    badge: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
    icon: <FileText className="w-4 h-4" />,
    iconColor: "text-zinc-500",
  },
  expired: {
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: "text-red-500",
  },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  declined: "Declined",
  voided: "Voided",
  expired: "Expired",
};

export function ContractsSection({ partyId, api }: ContractsSectionProps) {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch contracts for this party
  React.useEffect(() => {
    let cancelled = false;

    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the contracts API to fetch contracts linked to this partyId
        const res = await api.contracts?.contracts?.list?.({ partyId, limit: 100 });
        if (!cancelled) {
          setContracts(res?.items || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[ContractsSection] Failed to load contracts:", err);
          setError(err?.message || "Failed to load contracts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchContracts();

    return () => {
      cancelled = true;
    };
  }, [partyId, api]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleViewContract = (contractId: number) => {
    // Navigate to contracts module with this contract selected
    const url = `/contracts/list?id=${contractId}`;
    window.history.pushState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDownloadPdf = (contractId: number) => {
    // Open PDF download URL in new tab
    const pdfUrl = api.contracts?.contracts?.getPdfUrl?.(contractId);
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <SectionCard title="📄 Contracts">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-orange)]" />
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="📄 Contracts">
        <div className="text-sm text-red-400 py-4">{error}</div>
      </SectionCard>
    );
  }

  if (contracts.length === 0) {
    return (
      <SectionCard title="📄 Contracts">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-zinc-800/50">
            <FileText className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm text-secondary">No contracts yet</p>
          <p className="text-xs text-tertiary mt-1">Contracts linked to this contact will appear here</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={`📄 Contracts (${contracts.length})`}>
      <div className="space-y-2">
        {contracts.map((contract) => {
          const statusConfig = STATUS_STYLES[contract.status] || STATUS_STYLES.draft;

          return (
            <div
              key={contract.id}
              className="group flex items-start gap-3 p-3 rounded-lg border border-hairline hover:border-[var(--brand-orange)]/30 hover:bg-white/[0.02] transition-all"
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg bg-zinc-800/50 ${statusConfig.iconColor} shrink-0`}>
                {statusConfig.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-primary truncate">{contract.title}</h4>
                    {contract.template && (
                      <p className="text-xs text-secondary mt-0.5">{contract.template.name}</p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusConfig.badge}`}>
                    {STATUS_LABELS[contract.status] || contract.status}
                  </span>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-tertiary">
                  <span>Created {formatDate(contract.createdAt)}</span>
                  {contract.signedAt && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">Signed {formatDate(contract.signedAt)}</span>
                    </>
                  )}
                  {contract.expiresAt && contract.status !== "signed" && (
                    <>
                      <span>•</span>
                      <span>Expires {formatDate(contract.expiresAt)}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleViewContract(contract.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-hairline hover:bg-white/5 transition-colors text-secondary hover:text-primary"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Details
                  </button>
                  {contract.status === "signed" && (
                    <button
                      onClick={() => handleDownloadPdf(contract.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-hairline hover:bg-white/5 transition-colors text-secondary hover:text-primary"
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

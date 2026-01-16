import { AlertCircle, X } from "lucide-react";

interface Blockers {
  hasBuyer?: boolean;
  isPlaced?: boolean;
  hasFinancialState?: boolean;
  hasPayments?: boolean;
  hasContract?: boolean;
  isPromoted?: boolean;
  isDeceased?: boolean;
  hasHealthEvents?: boolean;
  hasDocuments?: boolean;
  hasInvoices?: boolean;
}

interface OffspringDeleteBlockedModalProps {
  blockers: Blockers;
  onArchive: () => Promise<void>;
  onClose: () => void;
}

export function OffspringDeleteBlockedModal({
  blockers,
  onArchive,
  onClose,
}: OffspringDeleteBlockedModalProps) {
  const activeBlockers = Object.entries(blockers)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const blockerMessages: Record<string, string> = {
    hasBuyer: "Has assigned buyer",
    isPlaced: "Has been placed/delivered",
    hasFinancialState: "Has financial transactions",
    hasPayments: "Has received payments",
    hasContract: "Has signed contract",
    isPromoted: "Promoted to full animal record",
    isDeceased: "Marked as deceased (historical record)",
    hasHealthEvents: "Has health records",
    hasDocuments: "Has attached documents",
    hasInvoices: "Has associated invoices",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Cannot Delete This Offspring
              </h3>
              <p className="text-sm text-text-secondary">
                This offspring has permanent business records and cannot be deleted.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-tertiary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-300 mb-3">
              Active blockers ({activeBlockers.length}):
            </p>
            <ul className="space-y-2">
              {activeBlockers.map((blocker) => (
                <li key={blocker} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-red-400 mt-0.5">✓</span>
                  <span>{blockerMessages[blocker]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-xs text-text-secondary">
              Regulatory and lineage tracking requirements prevent deletion of offspring with business activity.
              Once an offspring has buyers, contracts, or payments, it becomes part of the permanent breeding record.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onArchive}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-sm font-medium rounded-lg transition-colors"
            >
              Archive Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

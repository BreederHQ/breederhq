import { useState } from "react";
import { Archive, X } from "lucide-react";

interface OffspringArchiveModalProps {
  offspring: {
    id: number;
    name?: string | null;
    collarColorName?: string | null;
  };
  onArchive: (reason?: string) => Promise<void>;
  onCancel: () => void;
}

export function OffspringArchiveModal({
  offspring,
  onArchive,
  onCancel,
}: OffspringArchiveModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = offspring.collarColorName || offspring.name || `Offspring #${offspring.id}`;

  const handleArchive = async () => {
    setLoading(true);
    try {
      await onArchive(reason || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <Archive className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Archive This Offspring?
              </h3>
              <p className="text-sm text-text-secondary">
                Archive <span className="font-medium text-white">{displayName}</span> to hide from active views.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-text-tertiary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-300 mb-3">
              Archiving will:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Hide offspring from active views and lists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Preserve all data, photos, and history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Can be restored anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Recommended over deletion</span>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Reason for archiving (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Accidental creation, duplicate record, etc."
              rows={3}
              className="w-full px-4 py-2 bg-portal-card border border-border-default rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Archiving..." : "Archive Offspring"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

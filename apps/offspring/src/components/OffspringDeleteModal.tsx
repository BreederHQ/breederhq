import { useState } from "react";
import { AlertTriangle, Archive } from "lucide-react";

interface OffspringDeleteModalProps {
  offspring: {
    id: number;
    name?: string | null;
    collarColorName?: string | null;
  };
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export function OffspringDeleteModal({
  offspring,
  onArchive,
  onDelete,
  onCancel,
}: OffspringDeleteModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = offspring.collarColorName || offspring.name || `Offspring #${offspring.id}`;
  const isConfirmationValid = confirmationText === displayName;

  const handleArchive = async () => {
    setLoading(true);
    try {
      await onArchive();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        {/* Step 1: Initial Warning */}
        {step === 1 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Delete This Offspring?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This will permanently remove <span className="font-medium text-white">{displayName}</span> from your records.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-2">
                      Consider archiving instead
                    </p>
                    <p className="text-xs text-text-tertiary mb-3">
                      Archiving preserves all data but hides the offspring from active views. You can restore it anytime.
                    </p>
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? "Archiving..." : "Archive Offspring"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Continue to Delete
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Educational Warning */}
        {step === 2 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Are You Sure?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-red-300 mb-3">
                  Deleting this offspring will:
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Permanently remove all photos and notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Remove from this offspring group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Cannot be undone or restored</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-amber-300">
                  This offspring has no buyers, contracts, or payments yet. Once it does, deletion will no longer be possible.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirmation Phrase */}
        {step === 3 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Final Confirmation Required
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Type the offspring identifier to confirm deletion.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-text-secondary mb-4">
                  To confirm permanent deletion, type the offspring's {offspring.collarColorName ? "collar" : "name"} exactly:
                </p>
                <div className="bg-portal-card border border-border-subtle rounded-lg p-3 mb-4">
                  <p className="text-xs text-text-tertiary mb-1">
                    {offspring.collarColorName ? "Collar" : "Name"}:
                  </p>
                  <p className="text-lg font-mono font-semibold text-white">
                    {displayName}
                  </p>
                </div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-4 py-2 bg-portal-card border border-border-default rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  autoFocus
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-red-400 mt-2">
                    Text does not match. Please type exactly: {displayName}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!isConfirmationValid || loading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

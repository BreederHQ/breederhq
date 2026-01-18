import * as React from "react";
import { Button, Tooltip } from "@bhq/ui";

type CollapsibleOverrideProps = {
  currentDays: number;
  overrideInput: string;
  onOverrideInputChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
  hasOverride: boolean;
  warningConflict?: boolean;
};

export function CollapsibleOverride({
  currentDays,
  overrideInput,
  onOverrideInputChange,
  onSave,
  onClear,
  saving,
  hasOverride,
  warningConflict,
}: CollapsibleOverrideProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="text-left">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {isExpanded ? "Hide" : "Override"} cycle length
        </span>
        <Tooltip
          side="left"
          content={
            <div className="flex items-start gap-2 max-w-xs">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-secondary">Use this to manually set a cycle length if the automatic calculation doesn't match this female's actual pattern.</span>
            </div>
          }
        >
          <svg className="w-4 h-4 text-secondary cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Tooltip>
      </button>

      {/* Content - indented to align with text (matching CollapsibleCycleHistory) */}
      {isExpanded && (
        <div className="mt-2 pl-6">
          {warningConflict && (
            <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-500/50 rounded text-sm text-yellow-200">
              <strong>Warning:</strong> Override differs by more than 20% from historical average.
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={overrideInput}
              onChange={(e) => onOverrideInputChange(e.target.value)}
              placeholder={`Enter days (default: ${currentDays})`}
              className="flex-1 max-w-[180px] px-3 py-2 text-sm border border-hairline rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-brand-orange m-0"
              disabled={saving}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={onSave}
              disabled={saving || !overrideInput}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            {hasOverride && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClear}
                disabled={saving}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

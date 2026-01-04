// apps/animals/src/components/marketplace/MarketplaceStatusBar.tsx
// Sticky status bar at top with status, intent, visibility, and actions

import * as React from "react";
import { Button } from "@bhq/ui";
import type { ListingStatus, ListingIntent, ListingRecord } from "./types";
import { INTENT_LABELS, INTENT_BADGE_CLASSES } from "./types";

export interface MarketplaceStatusBarProps {
  status: ListingStatus | null;
  intent: ListingIntent | null;
  listing: ListingRecord | null;
  canPublish: boolean;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

export function MarketplaceStatusBar({
  status,
  intent,
  listing,
  canPublish,
  saving,
  onSave,
  onPublish,
  onPause,
  onResume,
  onDelete,
}: MarketplaceStatusBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const statusBadge = (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "LIVE"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : status === "PAUSED"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      {status === "LIVE" ? "Live" : status === "PAUSED" ? "Paused" : "Draft"}
    </span>
  );

  const intentBadge = intent && (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${INTENT_BADGE_CLASSES[intent]}`}>
      {INTENT_LABELS[intent]}
    </span>
  );

  const visibilityText = status === "LIVE"
    ? "Visible publicly"
    : status === "PAUSED"
      ? "Hidden from public"
      : "Not published";

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5 bg-surface border-b border-hairline flex items-center justify-between gap-3 flex-wrap">
      {/* Left: Status info */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {statusBadge}
        {intentBadge}
        <span className="text-xs text-tertiary hidden sm:inline">·</span>
        <span className="text-xs text-secondary hidden sm:inline">{visibilityText}</span>
        {status === "LIVE" && listing?.publishedAt && (
          <span className="text-xs text-tertiary hidden md:inline">
            Published {new Date(listing.publishedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>

        {status === "DRAFT" && (
          <Button
            size="sm"
            onClick={onPublish}
            disabled={saving || !canPublish}
            title={!canPublish ? "Select intent and add headline to publish" : ""}
          >
            Publish
          </Button>
        )}

        {status === "LIVE" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={saving}
          >
            Pause
          </Button>
        )}

        {status === "PAUSED" && (
          <Button
            size="sm"
            onClick={onResume}
            disabled={saving}
          >
            Resume
          </Button>
        )}

        {/* Kebab menu for delete */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-secondary"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-surface border border-hairline rounded-md shadow-lg py-1 z-20">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

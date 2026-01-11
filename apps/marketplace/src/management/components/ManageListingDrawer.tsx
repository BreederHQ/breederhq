// apps/marketplace/src/management/components/ManageListingDrawer.tsx
// Full-screen modal drawer for managing marketplace listing
import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { Button } from "@bhq/ui";
import { confirmDialog } from "@bhq/ui/utils";
import { ManageListingPage, type ManageListingHandle } from "../pages/ManageListingPage";

type ManageListingDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function ManageListingDrawer({ open, onClose }: ManageListingDrawerProps) {
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const listingRef = React.useRef<ManageListingHandle>(null);

  // Reset dirty state when drawer opens
  React.useEffect(() => {
    if (open) {
      setDirty(false);
    }
  }, [open]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // ESC key handling
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, dirty]);

  async function handleClose() {
    if (dirty) {
      const confirmed = await confirmDialog({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard Changes",
        cancelText: "Keep Editing",
        variant: "danger",
      });
      if (!confirmed) return;
    }
    onClose();
  }

  function handleBackdropClick() {
    if (dirty) return; // Block backdrop click when dirty
    onClose();
  }

  async function handleSave() {
    if (!listingRef.current) return;
    setSaving(true);
    try {
      await listingRef.current.save();
      // After successful save, dirty state will be reset by the page
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!listingRef.current) return;
    await listingRef.current.discard();
  }

  if (!open) return null;

  const drawer = (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        role="button"
        tabIndex={-1}
        aria-label="Close drawer"
      />

      {/* Centered modal container */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-[min(1000px,100%)] h-[min(90vh,100%)]">
          <div className="flex h-full bg-surface border border-hairline shadow-2xl rounded-xl overflow-hidden flex-col">
            {/* Header */}
            <div
              className={[
                "flex items-center justify-between px-6 py-4 border-b transition-colors shrink-0",
                dirty ? "bg-amber-500/5 border-amber-500/30" : "border-hairline",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-primary">Marketplace Profile</h3>
                {dirty && (
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {dirty && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={handleClose} disabled={saving}>
                  Close
                </Button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">
              <ManageListingPage
                ref={listingRef}
                isDrawer
                onDirtyChange={setDirty}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, getOverlayRoot());
}

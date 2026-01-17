// apps/marketplace/src/breeder/components/StorefrontDrawer.tsx
// Full-screen drawer for managing marketplace storefront settings

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export interface StorefrontDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Full-screen drawer overlay for storefront management.
 * Provides a modal experience for editing marketplace settings.
 */
export function StorefrontDrawer({ open, onClose, children }: StorefrontDrawerProps) {
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - centered modal */}
      <div className="relative w-full max-w-4xl h-[85vh] bg-portal-bg flex flex-col shadow-2xl rounded-xl border-2 border-amber-500/60">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-blue-500/40 bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-blue-900/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-xl font-bold text-white">Storefront Settings</h2>
            </div>
            <p className="text-sm text-blue-200/80">Configure your marketplace profile and public storefront</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-blue-500/20 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

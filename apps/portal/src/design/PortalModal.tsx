// apps/portal/src/design/PortalModal.tsx
// Portal-local modal primitive
// - Escape to close
// - Click outside to close
// - Focus first input on open
// - Restore focus on close
// - Subtle overlay, no harsh effects

import * as React from "react";

interface PortalModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Max width of modal (default: 420px) */
  maxWidth?: string;
}

export function PortalModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "420px",
}: PortalModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  React.useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus first input in modal after a small delay to ensure render
    setTimeout(() => {
      const firstInput = contentRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "input:not([disabled]), textarea:not([disabled])"
      );
      if (firstInput) {
        firstInput.focus();
      }
    }, 50);

    // Restore focus on unmount
    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        padding: "var(--portal-space-4)",
      }}
    >
      <div
        ref={contentRef}
        style={{
          background: "var(--portal-bg-base)",
          border: "1px solid var(--portal-border)",
          borderRadius: "var(--portal-radius-lg)",
          maxWidth,
          width: "100%",
          padding: "var(--portal-space-4)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-lg)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: "var(--portal-space-1)",
              cursor: "pointer",
              color: "var(--portal-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--portal-radius-sm)",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

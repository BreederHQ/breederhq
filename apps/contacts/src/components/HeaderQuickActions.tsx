// apps/contacts/src/components/HeaderQuickActions.tsx
// Quick action icons for the contact drawer header: Email, DM, Phone, WhatsApp

import * as React from "react";
import { createPortal } from "react-dom";
import { Mail, MessageSquare, Phone, CalendarClock } from "lucide-react";
import { getOverlayRoot, acquireOverlayHost } from "@bhq/ui/overlay";

// WhatsApp icon (not in lucide)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Portal-based tooltip that renders outside drawer's stacking context
function Tooltip({ anchorRef, show, children }: {
  anchorRef: React.RefObject<HTMLElement | null>;
  show: boolean;
  children: React.ReactNode;
}) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const overlayRoot = getOverlayRoot();

  React.useEffect(() => {
    if (!show || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    });
  }, [show, anchorRef]);

  if (!show || !overlayRoot) return null;

  return createPortal(
    <div
      className="fixed px-2 py-1 rounded bg-surface-strong border border-hairline text-xs whitespace-nowrap pointer-events-none"
      style={{
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    overlayRoot
  );
}

// Quick follow-up picker dropdown
function FollowUpQuickPicker({
  anchorRef,
  open,
  onClose,
  currentValue,
  onChange,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  currentValue?: string | null;
  onChange: (iso: string | null) => void;
}) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const overlayRoot = getOverlayRoot();

  React.useEffect(() => {
    if (!open) return;
    const release = acquireOverlayHost();
    return release;
  }, [open]);

  React.useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [open, anchorRef]);

  if (!open || !overlayRoot) return null;

  const setFollowUp = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(date.toISOString());
    onClose();
  };

  const setFollowUpMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    onChange(date.toISOString());
    onClose();
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="rounded-md border border-hairline bg-surface shadow-lg p-1"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          minWidth: 140,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <button
            type="button"
            className="text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded"
            onClick={() => setFollowUp(1)}
          >
            Tomorrow
          </button>
          <button
            type="button"
            className="text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded"
            onClick={() => setFollowUp(7)}
          >
            Next week
          </button>
          <button
            type="button"
            className="text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded"
            onClick={() => setFollowUpMonths(1)}
          >
            Next month
          </button>
          {currentValue && (
            <button
              type="button"
              className="text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/5 rounded border-t border-hairline mt-1 pt-1.5"
              onClick={() => {
                onChange(null);
                onClose();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </>,
    overlayRoot
  );
}

interface HeaderQuickActionsProps {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  partyName: string;
  onComposeEmail: () => void;
  onComposeDM: () => void;
  // Follow-up props (for contacts only)
  nextFollowUp?: string | null;
  onFollowUpChange?: (iso: string | null) => void;
}

export function HeaderQuickActions({
  email,
  phone,
  whatsapp,
  partyName,
  onComposeEmail,
  onComposeDM,
  nextFollowUp,
  onFollowUpChange,
}: HeaderQuickActionsProps) {
  const [copied, setCopied] = React.useState<"phone" | "email" | null>(null);
  const [hovered, setHovered] = React.useState<"email" | "dm" | "phone" | "whatsapp" | "followup" | null>(null);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);

  const emailRef = React.useRef<HTMLButtonElement>(null);
  const dmRef = React.useRef<HTMLButtonElement>(null);
  const phoneRef = React.useRef<HTMLAnchorElement>(null);
  const whatsappRef = React.useRef<HTMLAnchorElement>(null);
  const followUpRef = React.useRef<HTMLButtonElement>(null);

  // Format follow-up date for tooltip
  const formatFollowUpLabel = (iso?: string | null): string => {
    if (!iso) return "Set follow-up";
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `Overdue (${d.toLocaleDateString()})`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleCopy = async (text: string, type: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const formatPhoneForTel = (phoneNumber: string) => {
    // Strip all non-digit characters except +
    return phoneNumber.replace(/[^\d+]/g, "");
  };

  const formatPhoneForWhatsApp = (phoneNumber: string) => {
    // WhatsApp needs just digits, no +
    return phoneNumber.replace(/\D/g, "");
  };

  return (
    <div className="flex items-center gap-1">
      {/* Email */}
      {email && (
        <>
          <button
            ref={emailRef}
            type="button"
            onClick={onComposeEmail}
            onMouseEnter={() => setHovered("email")}
            onMouseLeave={() => setHovered(null)}
            className="p-2 rounded-md text-secondary hover:text-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))]/10 transition-colors"
          >
            <Mail className="h-4 w-4" />
          </button>
          <Tooltip anchorRef={emailRef} show={hovered === "email"}>
            {copied === "email" ? "Copied!" : email}
          </Tooltip>
        </>
      )}

      {/* DM/Message */}
      <button
        ref={dmRef}
        type="button"
        onClick={onComposeDM}
        onMouseEnter={() => setHovered("dm")}
        onMouseLeave={() => setHovered(null)}
        className="p-2 rounded-md text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      <Tooltip anchorRef={dmRef} show={hovered === "dm"}>
        Send Message
      </Tooltip>

      {/* Phone */}
      {phone && (
        <>
          <a
            ref={phoneRef}
            href={`tel:${formatPhoneForTel(phone)}`}
            onMouseEnter={() => setHovered("phone")}
            onMouseLeave={() => setHovered(null)}
            className="p-2 rounded-md text-secondary hover:text-green-400 hover:bg-green-500/10 transition-colors flex items-center justify-center"
            onClick={(e) => {
              // On desktop, copy number instead of dialing
              if (!/Mobi|Android/i.test(navigator.userAgent)) {
                e.preventDefault();
                handleCopy(phone, "phone");
              }
            }}
          >
            <Phone className="h-4 w-4" />
          </a>
          <Tooltip anchorRef={phoneRef} show={hovered === "phone"}>
            {copied === "phone" ? "Copied!" : phone}
          </Tooltip>
        </>
      )}

      {/* WhatsApp */}
      {whatsapp && (
        <>
          <a
            ref={whatsappRef}
            href={`https://wa.me/${formatPhoneForWhatsApp(whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered("whatsapp")}
            onMouseLeave={() => setHovered(null)}
            className="p-2 rounded-md text-secondary hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors flex items-center justify-center"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>
          <Tooltip anchorRef={whatsappRef} show={hovered === "whatsapp"}>
            WhatsApp
          </Tooltip>
        </>
      )}

      {/* Follow-up (contacts only) */}
      {onFollowUpChange && (
        <>
          <button
            ref={followUpRef}
            type="button"
            onClick={() => setFollowUpOpen(true)}
            onMouseEnter={() => setHovered("followup")}
            onMouseLeave={() => setHovered(null)}
            className={`p-2 rounded-md transition-colors flex items-center justify-center ${
              nextFollowUp
                ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                : "text-secondary hover:text-purple-400 hover:bg-purple-500/10"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          <Tooltip anchorRef={followUpRef} show={hovered === "followup" && !followUpOpen}>
            {formatFollowUpLabel(nextFollowUp)}
          </Tooltip>
          <FollowUpQuickPicker
            anchorRef={followUpRef}
            open={followUpOpen}
            onClose={() => setFollowUpOpen(false)}
            currentValue={nextFollowUp}
            onChange={onFollowUpChange}
          />
        </>
      )}
    </div>
  );
}

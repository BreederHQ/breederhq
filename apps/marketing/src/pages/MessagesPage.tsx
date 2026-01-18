import * as React from "react";
import { PageHeader, SectionCard } from "@bhq/ui";
import { makeApi } from "@bhq/api";
import type { MessageThread, Message, ContactDTO } from "@bhq/api";

const IS_DEV = import.meta.env.DEV;

/**
 * Resolves API base URL deterministically:
 * 1. VITE_API_BASE_URL env var (if defined and non-empty)
 * 2. window.__BHQ_API_BASE__ (if defined and non-empty)
 * 3. In dev: empty string (same origin, Vite proxy)
 * 4. In prod: location.origin
 *
 * NOTE: Resource files already include /api/v1 in their paths,
 * so the base URL should NOT include /api/v1 to avoid duplication.
 */
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) return normalizeBase(envBase);
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) return normalizeBase(windowBase);
  if (IS_DEV) return ""; // Empty string = same origin, resource paths add /api/v1
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  // Strip trailing slashes and any existing /api/v1 suffix
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const API_BASE = getApiBase();
const api = makeApi(API_BASE);

// Log resolved API base in dev mode
if (IS_DEV) {
  console.debug("[MessagesPage] API base resolved to:", API_BASE);
}

const THREAD_ID_PARAM = "threadId";

/* ────────────────────────────────────────────────────────────────────────────
 * URL Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function getThreadIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(THREAD_ID_PARAM);
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function setThreadIdInUrl(threadId: number | null): void {
  const url = new URL(window.location.href);
  if (threadId != null) {
    url.searchParams.set(THREAD_ID_PARAM, String(threadId));
  } else {
    url.searchParams.delete(THREAD_ID_PARAM);
  }
  // Use replaceState to avoid polluting browser history
  window.history.replaceState({}, "", url.toString());
}

interface ThreadListItemProps {
  thread: MessageThread;
  isActive: boolean;
  onClick: () => void;
}

function ThreadListItem({ thread, isActive, onClick }: ThreadListItemProps) {
  // Find the "other" participant - the one who is NOT the organization
  // Use party type to identify org party, not window.platform.currentOrgId (which is org ID, not party ID)
  const otherParticipant = thread.participants?.find(
    (p) => p.party?.type !== "ORGANIZATION"
  );
  const otherName = otherParticipant?.party?.name || "Unknown contact";
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  const preview = lastMessage?.body
    ? lastMessage.body.length > 60
      ? `${lastMessage.body.slice(0, 60)}...`
      : lastMessage.body
    : "No messages yet";
  const hasUnread = (thread.unreadCount ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all border-2
        ${
          isActive
            ? "bg-surface-strong border-[hsl(var(--brand-orange))]"
            : hasUnread
            ? "bg-[hsl(var(--brand-orange))]/5 border-[hsl(var(--brand-orange))]/60 hover:border-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))]/10"
            : "bg-surface border-hairline hover:border-[hsl(var(--brand-orange))]/30 hover:bg-surface-strong/50"
        }
      `}
    >
      {hasUnread && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[hsl(var(--brand-orange))] uppercase tracking-wide">
            New
          </span>
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))] animate-pulse" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className={`font-semibold text-sm ${hasUnread ? "text-[hsl(var(--brand-orange))]" : "text-primary"}`}>
          {thread.subject || `Conversation with ${otherName}`}
        </div>
        <div className="text-xs text-secondary">{otherName}</div>
        <div className={`text-xs line-clamp-2 mt-1 ${hasUnread ? "text-primary font-medium" : "text-secondary"}`}>
          {preview}
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isUnread?: boolean;
}

function MessageBubble({ message, isOwn, isUnread }: MessageBubbleProps) {
  const timeStr = new Date(message.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="text-xs text-secondary px-2 flex items-center gap-2">
          <span>{isOwn ? "You" : message.senderParty?.name || "Unknown contact"} · {timeStr}</span>
          {isUnread && (
            <span className="text-[10px] font-semibold text-[hsl(var(--brand-orange))] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/10">
              New
            </span>
          )}
        </div>
        <div
          className={`
            px-3 py-2 rounded-lg text-sm whitespace-pre-wrap transition-all
            ${
              isOwn
                ? "bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/30 text-primary"
                : isUnread
                ? "bg-[hsl(var(--brand-orange))]/10 border-2 border-[hsl(var(--brand-orange))]/50 text-primary"
                : "bg-surface-strong border border-hairline text-primary"
            }
          `}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Portal Invite Action Component
 * ────────────────────────────────────────────────────────────────────────── */

interface PortalInviteActionProps {
  threadId: number;
  buyerParticipant: { partyId: number; party: { email?: string } } | null;
  hasMultipleRecipients: boolean;
}

function PortalInviteAction({
  threadId,
  buyerParticipant,
  hasMultipleRecipients,
}: PortalInviteActionProps) {
  const [portalStatus, setPortalStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const buyerPartyId = buyerParticipant?.partyId;
  const buyerEmail = buyerParticipant?.party?.email;
  const hasEmail = Boolean(buyerEmail);

  // Check portal access status on mount
  React.useEffect(() => {
    if (!buyerPartyId) {
      setCheckingStatus(false);
      return;
    }

    async function checkStatus() {
      try {
        const res = await fetch(`/api/v1/portal-access/${buyerPartyId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setPortalStatus(data.portalAccess?.status || "NO_ACCESS");
        }
      } catch (err) {
        console.error("Failed to check portal status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkStatus();
  }, [buyerPartyId]);

  async function handleInvite() {
    if (!buyerPartyId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/portal-access/${buyerPartyId}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contextType: "INQUIRY",
          contextId: threadId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage({ text: "Client portal invite sent.", type: "success" });
        setPortalStatus("INVITED");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        if (data.error === "already_active") {
          setToastMessage({ text: "Client portal already active.", type: "info" });
          setPortalStatus("ACTIVE");
        } else if (data.error === "already_invited") {
          setToastMessage({ text: "Invite already sent.", type: "info" });
          setPortalStatus("INVITED");
        } else {
          setToastMessage({
            text: data.error || "Failed to send invite.",
            type: "error",
          });
        }
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to send portal invite:", err);
      setToastMessage({ text: "Network error. Please try again.", type: "error" });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  // Hide if multiple recipients or no buyer or no email
  if (!buyerParticipant || !hasEmail) {
    return null;
  }

  if (checkingStatus) {
    return (
      <div className="text-xs text-secondary ml-4">Checking status...</div>
    );
  }

  // Hide if already active
  if (portalStatus === "ACTIVE") {
    return null;
  }

  const isInvited = portalStatus === "INVITED";

  return (
    <div className="ml-4 flex flex-col items-end gap-2">
      {toastMessage && (
        <div
          className={`text-xs px-3 py-1 rounded-md ${
            toastMessage.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : toastMessage.type === "info"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {toastMessage.text}
        </div>
      )}
      <button
        onClick={handleInvite}
        disabled={loading || isInvited}
        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
          isInvited
            ? "bg-surface-strong text-secondary cursor-not-allowed"
            : "bg-[hsl(var(--brand-orange))] text-black hover:brightness-110"
        }`}
      >
        {loading
          ? "Sending..."
          : isInvited
          ? "Invite already sent"
          : "Invite to Client Portal"}
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Block User Action Component
 * ────────────────────────────────────────────────────────────────────────── */

type BlockLevel = "LIGHT" | "MEDIUM" | "HEAVY";

const BLOCK_LEVELS: Array<{
  value: BlockLevel;
  label: string;
  description: string;
  restrictions: string[];
}> = [
  {
    value: "LIGHT",
    label: "Light",
    description: "Minimal restrictions",
    restrictions: ["Cannot join your waitlist"],
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Moderate restrictions",
    restrictions: ["Cannot join your waitlist", "Cannot send you messages"],
  },
  {
    value: "HEAVY",
    label: "Heavy",
    description: "Full restrictions",
    restrictions: [
      "Cannot join your waitlist",
      "Cannot send you messages",
      "Cannot view your breeder profile",
    ],
  },
];

interface BlockUserActionProps {
  buyerPartyId: number | null;
  buyerName: string;
  /** The marketplace user's external ID (auth system ID) */
  marketplaceUserId: string | null;
}

function BlockUserAction({ buyerPartyId, buyerName, marketplaceUserId }: BlockUserActionProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [level, setLevel] = React.useState<BlockLevel>("MEDIUM");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Don't show if no marketplace user ID
  if (!marketplaceUserId) {
    return null;
  }

  async function handleBlock() {
    if (!marketplaceUserId) return;

    setLoading(true);
    const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
    // Note: We intentionally skip localStorage to avoid cross-user contamination
    const tenantId = (window as any).__BHQ_TENANT_ID__;

    try {
      const res = await fetch("/api/v1/contacts/block-marketplace-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-Id": String(tenantId) } : {}),
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          userId: marketplaceUserId,
          level,
          reason: reason || undefined,
        }),
      });

      if (res.ok) {
        setToastMessage({ text: "User blocked successfully", type: "success" });
        setShowModal(false);
        setLevel("MEDIUM");
        setReason("");
      } else {
        const data = await res.json();
        setToastMessage({ text: data.error || "Failed to block user", type: "error" });
      }
    } catch (err) {
      console.error("Failed to block user:", err);
      setToastMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }

  return (
    <>
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[100] text-xs px-4 py-2 rounded-md shadow-lg ${
            toastMessage.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Block button */}
      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-3 py-1.5 rounded-md font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
      >
        Block
      </button>

      {/* Block Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="text-lg font-semibold">Block User</h3>
              <p className="text-sm text-secondary mt-1">
                Block <strong>{buyerName}</strong> from interacting with your marketplace profile.
              </p>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4">
              {/* Level Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Block Level
                </label>
                <div className="space-y-2">
                  {BLOCK_LEVELS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLevel(opt.value)}
                      className={[
                        "w-full text-left p-3 rounded-lg border transition-all",
                        level === opt.value
                          ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5"
                          : "border-hairline hover:border-neutral-500",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-primary">{opt.label}</span>
                        <span className="text-xs text-secondary">{opt.description}</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {opt.restrictions.map((r, i) => (
                          <li key={i} className="text-xs text-secondary flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason (optional) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Reason (Optional, for your reference only)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Spam, abusive messages, etc."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
                <p className="text-xs text-secondary mt-1">
                  This is only visible to you, not the blocked user.
                </p>
              </div>

              {/* Info banner */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <p className="text-xs text-blue-400">
                  The user will not be notified that they have been blocked. They will see generic messages like "This breeder is not accepting inquiries."
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={loading}
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Blocking..." : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Add to Waitlist Action Component
 * ────────────────────────────────────────────────────────────────────────── */

interface WaitlistActionProps {
  buyerPartyId: number | null;
  buyerName: string;
  buyerEmail: string | null;
}

function WaitlistAction({ buyerPartyId, buyerName, buyerEmail }: WaitlistActionProps) {
  const [loading, setLoading] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Check if already on waitlist
  React.useEffect(() => {
    if (!buyerPartyId) {
      setCheckingStatus(false);
      return;
    }

    async function checkWaitlistStatus() {
      try {
        // Get tenant ID from platform context
        // Note: We intentionally skip localStorage to avoid cross-user contamination
        const tenantId = (window as any).__BHQ_TENANT_ID__;
        if (!tenantId) {
          setCheckingStatus(false);
          return;
        }

        // Check if this party already has a waitlist entry
        const res = await fetch(`/api/v1/waitlist?clientPartyId=${buyerPartyId}&limit=1`, {
          credentials: "include",
          headers: {
            "X-Tenant-Id": String(tenantId),
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAlreadyOnWaitlist((data.items?.length || 0) > 0);
        }
      } catch (err) {
        console.error("Failed to check waitlist status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkWaitlistStatus();
  }, [buyerPartyId]);

  async function handleAddToWaitlist(status: "INQUIRY" | "DEPOSIT_DUE") {
    if (!buyerPartyId) return;

    setLoading(true);
    setShowOptions(false);

    // Get CSRF token and tenant ID
    // Note: We intentionally skip localStorage to avoid cross-user contamination
    const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
    const tenantId = (window as any).__BHQ_TENANT_ID__;

    if (!tenantId) {
      setToastMessage({ text: "Missing tenant context", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": String(tenantId),
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          clientPartyId: buyerPartyId,
          status,
          notes: `Added from inquiry conversation with ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}`,
        }),
      });

      if (res.ok) {
        setToastMessage({
          text: status === "INQUIRY" ? "Added to pending waitlist" : "Added to approved waitlist",
          type: "success",
        });
        setAlreadyOnWaitlist(true);
      } else {
        const data = await res.json();
        setToastMessage({
          text: data.error || "Failed to add to waitlist",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Failed to add to waitlist:", err);
      setToastMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }

  if (!buyerPartyId || checkingStatus) {
    return null;
  }

  if (alreadyOnWaitlist) {
    return (
      <div className="text-xs text-green-400 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
        On waitlist
      </div>
    );
  }

  return (
    <div className="relative">
      {toastMessage && (
        <div
          className={`absolute right-0 -top-8 whitespace-nowrap text-xs px-3 py-1 rounded-md ${
            toastMessage.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : toastMessage.type === "info"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {showOptions ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddToWaitlist("INQUIRY")}
            disabled={loading}
            className="text-xs px-2 py-1 rounded-md font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            Pending
          </button>
          <button
            onClick={() => handleAddToWaitlist("DEPOSIT_DUE")}
            disabled={loading}
            className="text-xs px-2 py-1 rounded-md font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            Approved
          </button>
          <button
            onClick={() => setShowOptions(false)}
            className="text-xs text-secondary hover:text-primary"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowOptions(true)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-md font-medium bg-surface-strong border border-hairline text-secondary hover:text-primary hover:border-[hsl(var(--brand-orange))]/40 transition-colors disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add to Waitlist"}
        </button>
      )}
    </div>
  );
}

interface ThreadViewProps {
  thread: MessageThread;
  onSendMessage: (body: string) => Promise<void>;
  unreadCount?: number;
  onMarkAsRead?: () => void;
}

function ThreadView({ thread, onSendMessage, unreadCount = 0, onMarkAsRead }: ThreadViewProps) {
  const [messageBody, setMessageBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Find the current organization's PARTY ID from participants (not org ID - they are different!)
  // The org party is the one with type='ORGANIZATION'
  const orgParticipant = thread.participants?.find((p) => p.party?.type === "ORGANIZATION");
  const currentOrgPartyId = orgParticipant?.partyId ?? null;

  // Mark thread as read when viewing it
  React.useEffect(() => {
    onMarkAsRead?.();
  }, [thread.id]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = messageBody.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await onSendMessage(trimmed);
      setMessageBody("");
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setSendError(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // Find the "other" participant - the one who is NOT the organization (breeder)
  // Marketplace users create CONTACT parties, breeders have ORGANIZATION parties
  const otherParticipant = thread.participants?.find(
    (p) => p.party?.type !== "ORGANIZATION"
  ) || thread.participants?.find((p) => p.partyId !== currentOrgPartyId);
  const otherName = otherParticipant?.party?.name || "Unknown contact";
  const otherEmail = otherParticipant?.party?.email || null;
  const otherPartyId = otherParticipant?.partyId || null;
  // Get marketplace user ID (external ID from auth system) - may be on party.externalId
  const otherMarketplaceUserId = (otherParticipant?.party as any)?.externalId || null;

  // Count non-organization participants (contacts/buyers)
  const buyerParticipants = thread.participants?.filter(
    (p) => p.party?.type !== "ORGANIZATION"
  ) || [];
  const hasMultipleRecipients = buyerParticipants.length > 1;
  const singleBuyerParticipant = buyerParticipants.length === 1 ? buyerParticipants[0] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-hairline p-4 bg-surface">
        {/* Contact info and actions row */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Contact details */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-primary">
              {thread.subject || `Conversation with ${otherName}`}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-primary">{otherName}</span>
              {otherEmail && (
                <>
                  <span className="text-secondary">·</span>
                  <a
                    href={`mailto:${otherEmail}`}
                    className="text-xs text-[hsl(var(--brand-orange))] hover:underline"
                  >
                    {otherEmail}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Block User - only for marketplace users (those with externalId) */}
            {!hasMultipleRecipients && otherMarketplaceUserId && (
              <BlockUserAction
                buyerPartyId={otherPartyId}
                buyerName={otherName}
                marketplaceUserId={otherMarketplaceUserId}
              />
            )}

            {/* Add to Waitlist */}
            {!hasMultipleRecipients && otherPartyId && (
              <WaitlistAction
                buyerPartyId={otherPartyId}
                buyerName={otherName}
                buyerEmail={otherEmail}
              />
            )}

            {/* Portal Invite Action */}
            <PortalInviteAction
              threadId={thread.id}
              buyerParticipant={singleBuyerParticipant}
              hasMultipleRecipients={hasMultipleRecipients}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {thread.messages?.length === 0 ? (
          <div className="text-center text-secondary text-sm py-8">No messages yet. Start the conversation!</div>
        ) : (
          // Simply render all messages without NEW badges - viewing a thread means you've read it
          thread.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderPartyId === currentOrgPartyId}
              isUnread={false}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-hairline p-4 bg-surface">
        {sendError && (
          <div className="mb-2 text-xs text-red-400">{sendError}</div>
        )}
        <div className="flex gap-2">
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            disabled={sending}
            className="flex-1 px-3 py-2 rounded-md bg-card border border-hairline text-primary text-sm resize-none focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          <button
            type="submit"
            disabled={!messageBody.trim() || sending}
            className="self-end h-10 px-4 rounded-md bg-[hsl(var(--brand-orange))] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface RecipientOption {
  partyId: number;
  name: string;
  kind: "contact" | "organization";
}

interface NewConversationProps {
  onCreated: (thread: MessageThread) => void;
  onCancel: () => void;
}

function NewConversation({ onCreated, onCancel }: NewConversationProps) {
  const [recipients, setRecipients] = React.useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = React.useState(true);
  const [selectedRecipient, setSelectedRecipient] = React.useState<RecipientOption | null>(null);
  const [messageBody, setMessageBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadRecipients() {
      setLoadingRecipients(true);
      try {
        const contactsRes = await api.contacts.list({ limit: 100 });
        const options: RecipientOption[] = (contactsRes?.items || []).map((c: ContactDTO) => ({
          partyId: Number(c.id),
          name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || `Contact ${c.id}`,
          kind: "contact" as const,
        }));
        setRecipients(options);
      } catch (err: any) {
        console.error("Failed to load recipients:", err);
        setError("Failed to load contacts");
      } finally {
        setLoadingRecipients(false);
      }
    }
    loadRecipients();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecipient || !messageBody.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await api.messages.threads.create({
        recipientPartyId: selectedRecipient.partyId,
        initialMessage: messageBody.trim(),
      });
      if (!res?.thread) throw new Error("Failed to create conversation");
      onCreated(res.thread);
    } catch (err: any) {
      console.error("Failed to create conversation:", err);
      setError(err?.message || "Failed to create conversation");
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-hairline p-4 bg-surface flex items-center justify-between">
        <div className="font-semibold text-primary">New Conversation</div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-secondary hover:text-primary"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex-1 flex flex-col p-4">
        {error && (
          <div className="mb-3 text-xs text-red-400">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-secondary mb-1">To:</label>
          {loadingRecipients ? (
            <div className="text-xs text-secondary">Loading contacts...</div>
          ) : recipients.length === 0 ? (
            <div className="text-xs text-secondary">No contacts available</div>
          ) : (
            <select
              value={selectedRecipient?.partyId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedRecipient(recipients.find((r) => r.partyId === id) || null);
              }}
              className="w-full px-3 py-2 rounded-md bg-card border border-hairline text-primary text-sm focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
            >
              <option value="">Select a contact...</option>
              {recipients.map((r) => (
                <option key={r.partyId} value={r.partyId}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-xs text-secondary mb-1">Message:</label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 min-h-[120px] px-3 py-2 rounded-md bg-card border border-hairline text-primary text-sm resize-none focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!selectedRecipient || !messageBody.trim() || sending}
            className="h-10 px-4 rounded-md bg-[hsl(var(--brand-orange))] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = React.useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = React.useState<number | null>(null);
  const [selectedThread, setSelectedThread] = React.useState<MessageThread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(false);

  // Track pending thread ID from URL (to open thread once data loads)
  const [pendingThreadId, setPendingThreadId] = React.useState<number | null>(() => getThreadIdFromUrl());

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", {
        detail: { key: "marketing", label: "Marketing" },
      })
    );
  }, []);

  async function loadThreads() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.messages.threads.list();
      // Validate response shape
      if (!res || typeof res !== "object") {
        throw new Error("Invalid response from server");
      }
      const threadList = res.threads;
      if (!Array.isArray(threadList)) {
        throw new Error("Invalid response shape: expected threads array");
      }
      // Sort by thread-level timestamps only. Do not depend on messages[] in list payload.
      const sorted = threadList.sort((a, b) => {
        const aKey = (a as any).lastMessageAt || a.updatedAt || a.createdAt;
        const bKey = (b as any).lastMessageAt || b.updatedAt || b.createdAt;
        return new Date(bKey).getTime() - new Date(aKey).getTime();
      });
      setThreads(sorted);
      // Only auto-select first thread if no URL param pending and no selection
      if (sorted.length > 0 && !selectedThreadId && !pendingThreadId) {
        setSelectedThreadId(sorted[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load threads:", err);
      // Only show error for actual failures, not empty states
      const msg = err?.message || "Failed to load threads";
      // Don't treat "Not found" as an error for empty inbox
      if (msg.toLowerCase().includes("not found") && threads.length === 0) {
        // Treat as empty state, not error
        setThreads([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(id: number) {
    setThreadLoading(true);
    try {
      const res = await api.messages.threads.get(id);
      if (!res?.thread) {
        throw new Error("Invalid response: missing thread data");
      }
      setSelectedThread(res.thread);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t))
      );
      // Clear any previous error on successful load
      setError(null);
    } catch (err: any) {
      console.error("Failed to load thread:", err);
      setError(err?.message || "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSendMessage(body: string) {
    if (!selectedThreadId) throw new Error("No thread selected");
    const res = await api.messages.threads.sendMessage(selectedThreadId, { body });
    if (!res?.message) throw new Error("Failed to send message");
    setSelectedThread((prev) =>
      prev ? { ...prev, messages: [...prev.messages, res.message] } : prev
    );
  }

  function handleNewConversationCreated(thread: MessageThread) {
    setComposing(false);
    setThreads((prev) => [thread, ...prev]);
    setSelectedThreadId(thread.id);
    setSelectedThread(thread);
  }

  React.useEffect(() => {
    loadThreads();
  }, []);

  React.useEffect(() => {
    if (selectedThreadId) {
      loadThread(selectedThreadId);
    }
  }, [selectedThreadId]);

  // Handle URL-based thread deep link once data loads
  React.useEffect(() => {
    if (!pendingThreadId || loading) return;

    // Find the thread in loaded data
    const found = threads.find((t) => t.id === pendingThreadId);
    if (found) {
      setSelectedThreadId(found.id);
    } else {
      // Thread not found or inbox empty, clear the invalid URL param
      setThreadIdInUrl(null);
    }
    // Clear pending ID after processing
    setPendingThreadId(null);
  }, [pendingThreadId, loading, threads]);

  // Sync URL when thread selection changes
  React.useEffect(() => {
    // Skip URL update during initial pending ID processing
    if (pendingThreadId) return;

    setThreadIdInUrl(selectedThreadId);
  }, [selectedThreadId, pendingThreadId]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Direct Messages" subtitle="Internal messages for breeders only" />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1">
          <SectionCard
            title="Inbox"
            className="h-full flex flex-col"
            right={
              <button
                type="button"
                onClick={() => {
                  setComposing(true);
                  setSelectedThread(null);
                  setSelectedThreadId(null);
                }}
                className="text-xs px-2 py-1 rounded bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))]/20"
              >
                + New
              </button>
            }
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 text-secondary text-sm">Loading threads...</div>
            ) : threads.length === 0 && !composing ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  className="w-12 h-12 text-secondary/50 mb-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                  <path d="M5 7h14l3 5v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-6l3-5Z" />
                </svg>
                <div className="text-sm text-secondary">No conversations yet</div>
                <div className="text-xs text-secondary mt-1">Click "+ New" to start a conversation</div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === selectedThreadId && !composing}
                    onClick={() => {
                      setComposing(false);
                      setSelectedThreadId(thread.id);
                    }}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title={composing ? "New Conversation" : "Conversation"} className="h-full flex flex-col">
            {composing ? (
              <NewConversation
                onCreated={handleNewConversationCreated}
                onCancel={() => setComposing(false)}
              />
            ) : threadLoading ? (
              <div className="flex items-center justify-center flex-1 text-secondary text-sm">Loading conversation...</div>
            ) : !selectedThread ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <svg
                  className="w-12 h-12 text-secondary/50 mb-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="text-sm text-secondary">Select a conversation to view messages</div>
              </div>
            ) : (
              <ThreadView
                thread={selectedThread}
                onSendMessage={handleSendMessage}
                unreadCount={threads.find((t) => t.id === selectedThreadId)?.unreadCount ?? 0}
                onMarkAsRead={() => {
                  // Update local thread state to clear unread count visually
                  setThreads((prev) =>
                    prev.map((t) => (t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t))
                  );
                }}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

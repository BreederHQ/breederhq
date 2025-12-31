// packages/ui/src/components/PortalAccess/PortalAccessTab.tsx
// Portal Access tab component for managing client portal access per Party

import * as React from "react";
import { SectionCard } from "../SectionCard";
import { Badge } from "../Badge";
import { Button } from "../Button";
import type { PortalAccessDTO, PortalAccessStatus, PortalAccessResource } from "@bhq/api";

export interface PortalAccessTabProps {
  partyId: number;
  partyEmail: string | null;
  api: { portalAccess: PortalAccessResource };
}

const STATUS_VARIANTS: Record<PortalAccessStatus, "neutral" | "amber" | "green" | "red"> = {
  NO_ACCESS: "neutral",
  INVITED: "amber",
  ACTIVE: "green",
  SUSPENDED: "red",
};

const STATUS_LABELS: Record<PortalAccessStatus, string> = {
  NO_ACCESS: "No Access",
  INVITED: "Invited",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PortalAccessTab({ partyId, partyEmail, api }: PortalAccessTabProps) {
  const [access, setAccess] = React.useState<PortalAccessDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<{
    type: "suspend" | "forceReset";
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAccess = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.portalAccess.get(partyId);
      setAccess(res.portalAccess);
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes("not_found")) {
        // No access record exists yet - show NO_ACCESS state
        setAccess({
          partyId,
          status: "NO_ACCESS",
          email: partyEmail,
          invitedAt: null,
          activatedAt: null,
          suspendedAt: null,
          lastLoginAt: null,
          createdBy: null,
          updatedBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setError(err?.message || "Failed to load portal access");
      }
    } finally {
      setLoading(false);
    }
  }, [partyId, partyEmail, api]);

  React.useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEnable = async () => {
    setActionLoading(true);
    try {
      const res = await api.portalAccess.enable(partyId);
      setAccess(res.portalAccess);
      showToast("success", res.inviteSent ? "Access enabled and invite sent" : "Access enabled");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to enable access");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async () => {
    setActionLoading(true);
    try {
      const res = await api.portalAccess.invite(partyId);
      setAccess(res.portalAccess);
      showToast("success", "Invite sent");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to send invite");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setConfirmAction({
      type: "suspend",
      onConfirm: async () => {
        setConfirmAction(null);
        setActionLoading(true);
        try {
          const res = await api.portalAccess.suspend(partyId);
          setAccess(res.portalAccess);
          showToast("success", "Access suspended");
        } catch (err: any) {
          showToast("error", err?.message || "Failed to suspend access");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReenable = async () => {
    setActionLoading(true);
    try {
      const res = await api.portalAccess.reenable(partyId);
      setAccess(res.portalAccess);
      showToast("success", "Access re-enabled");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to re-enable access");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceReset = async () => {
    setConfirmAction({
      type: "forceReset",
      onConfirm: async () => {
        setConfirmAction(null);
        setActionLoading(true);
        try {
          const res = await api.portalAccess.forcePasswordReset(partyId);
          setAccess(res.portalAccess);
          showToast("success", "Password reset email sent");
        } catch (err: any) {
          showToast("error", err?.message || "Failed to send password reset");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-sm text-secondary">Loading portal access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-sm text-red-400">{error}</div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={loadAccess}>
          Retry
        </Button>
      </div>
    );
  }

  if (!access) return null;

  const status = access.status as PortalAccessStatus;
  const hasEmail = !!partyEmail;

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Status Card */}
      <SectionCard title="Portal Access Status">
        <div className="space-y-4">
          {/* Status badge and email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
              {access.email && (
                <span className="text-sm text-secondary">{access.email}</span>
              )}
            </div>
          </div>

          {/* No email warning */}
          {!hasEmail && status === "NO_ACCESS" && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
              This party has no email address. Add an email to enable portal access.
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-secondary mb-1">Last Invite Sent</div>
              <div>{formatDate(access.invitedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Activated At</div>
              <div>{formatDate(access.activatedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Last Login</div>
              <div>{formatDate(access.lastLoginAt)}</div>
            </div>
            {status === "SUSPENDED" && (
              <div>
                <div className="text-xs text-secondary mb-1">Suspended At</div>
                <div>{formatDate(access.suspendedAt)}</div>
              </div>
            )}
          </div>

          {/* Audit info */}
          {(access.createdBy || access.updatedBy) && (
            <div className="border-t border-hairline pt-3 text-xs text-secondary">
              {access.createdBy && (
                <div>Created by: {access.createdBy.email}</div>
              )}
              {access.updatedBy && access.updatedBy.id !== access.createdBy?.id && (
                <div>Last updated by: {access.updatedBy.email}</div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Actions Card */}
      <SectionCard title="Actions">
        <div className="flex flex-wrap gap-2">
          {/* NO_ACCESS: Enable button */}
          {status === "NO_ACCESS" && hasEmail && (
            <Button onClick={handleEnable} disabled={actionLoading}>
              Enable Access
            </Button>
          )}

          {/* INVITED: Resend invite */}
          {status === "INVITED" && (
            <>
              <Button onClick={handleResendInvite} disabled={actionLoading}>
                Resend Invite
              </Button>
              <Button variant="outline" onClick={handleSuspend} disabled={actionLoading}>
                Suspend
              </Button>
            </>
          )}

          {/* ACTIVE: Suspend, Force Reset */}
          {status === "ACTIVE" && (
            <>
              <Button variant="outline" onClick={handleForceReset} disabled={actionLoading}>
                Force Password Reset
              </Button>
              <Button variant="outline" onClick={handleSuspend} disabled={actionLoading}>
                Suspend Access
              </Button>
            </>
          )}

          {/* SUSPENDED: Re-enable */}
          {status === "SUSPENDED" && (
            <Button onClick={handleReenable} disabled={actionLoading}>
              Re-enable Access
            </Button>
          )}
        </div>
      </SectionCard>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative w-[400px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-lg font-semibold mb-1">
              {confirmAction.type === "suspend" ? "Suspend Access" : "Force Password Reset"}
            </div>
            <div className="text-sm text-secondary mb-4">
              {confirmAction.type === "suspend"
                ? "This will immediately revoke portal access and log out any active sessions. The user will not be able to log in until access is re-enabled."
                : "This will invalidate all active sessions and require the user to reset their password. A password reset email will be sent."}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction.type === "suspend" ? "destructive" : "default"}
                onClick={confirmAction.onConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

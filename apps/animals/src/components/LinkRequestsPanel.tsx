// apps/animals/src/components/LinkRequestsPanel.tsx
// Panel for managing incoming and outgoing cross-tenant link requests

import React from "react";
import { makeApi } from "../api";
import type { LinkRequestWithDetails, CrossTenantLink } from "@bhq/api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type TabType = "incoming" | "outgoing" | "active";

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Status Badge
 * ───────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const colorClass = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
    DENIED: "bg-red-500/20 text-red-400 border-red-500/30",
    EXPIRED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    REVOKED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }[status] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colorClass}`}>
      {status.toLowerCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Request Card
 * ───────────────────────────────────────────────────────────────────────────── */

function RequestCard({
  request,
  type,
  onApprove,
  onDeny,
  loading,
}: {
  request: LinkRequestWithDetails;
  type: "incoming" | "outgoing";
  onApprove?: () => void;
  onDeny?: () => void;
  loading?: boolean;
}) {
  const isPending = request.status === "PENDING";
  const isIncoming = type === "incoming";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-start gap-3">
        {/* Animal photo */}
        <div className="flex-shrink-0">
          {request.sourceAnimal.photoUrl ? (
            <img
              src={request.sourceAnimal.photoUrl}
              alt={request.sourceAnimal.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg">
              {request.sourceAnimal.sex === "MALE" ? "♂" : "♀"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={request.status} />
            <span className="text-xs text-secondary">
              {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>

          {isIncoming ? (
            <p className="text-sm">
              <span className="font-medium">{request.requestingTenant.name}</span> wants to link{" "}
              <span className="font-medium">{request.sourceAnimal.name}</span> to one of your animals as{" "}
              <span className="text-accent">{request.relationshipType.toLowerCase()}</span>
            </p>
          ) : (
            <p className="text-sm">
              You requested to link <span className="font-medium">{request.sourceAnimal.name}</span> to an animal from{" "}
              <span className="font-medium">{request.targetTenant?.name || "another breeder"}</span> as{" "}
              <span className="text-accent">{request.relationshipType.toLowerCase()}</span>
            </p>
          )}

          {request.message && (
            <div className="mt-2 p-2 rounded bg-white/5 text-xs text-secondary">
              "{request.message}"
            </div>
          )}

          {request.responseMessage && (
            <div className="mt-2 p-2 rounded bg-white/5 text-xs text-secondary">
              <span className="font-medium">Response: </span>"{request.responseMessage}"
            </div>
          )}

          {request.denialReason && (
            <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
              <span className="font-medium">Reason: </span>{request.denialReason}
            </div>
          )}
        </div>
      </div>

      {/* Actions for pending incoming requests */}
      {isPending && isIncoming && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onDeny}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-md border border-hairline text-sm hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Active Link Card
 * ───────────────────────────────────────────────────────────────────────────── */

function ActiveLinkCard({
  link,
  onRevoke,
  loading,
}: {
  link: CrossTenantLink;
  onRevoke: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-start gap-3">
        {/* Animal photo */}
        <div className="flex-shrink-0">
          {link.linkedAnimal.photoUrl ? (
            <img
              src={link.linkedAnimal.photoUrl}
              alt={link.linkedAnimal.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg">
              {link.linkedAnimal.sex === "MALE" ? "♂" : "♀"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
              {link.parentType.toLowerCase()}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-secondary">
              via {link.linkMethod.toLowerCase().replace(/_/g, " ")}
            </span>
          </div>

          <p className="text-sm font-medium">{link.linkedAnimal.name}</p>
          <p className="text-xs text-secondary">
            {link.linkedAnimal.tenantName} • Linked {new Date(link.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Revoke button */}
        {link.canRevoke && (
          <button
            onClick={onRevoke}
            disabled={loading}
            className="p-2 rounded hover:bg-red-500/10 text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
            title="Revoke link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component: LinkRequestsPanel
 * ───────────────────────────────────────────────────────────────────────────── */

export function LinkRequestsPanel({
  animalId,
  onLinkChange,
}: {
  animalId?: number;
  onLinkChange?: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<TabType>("incoming");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [incomingRequests, setIncomingRequests] = React.useState<LinkRequestWithDetails[]>([]);
  const [outgoingRequests, setOutgoingRequests] = React.useState<LinkRequestWithDetails[]>([]);
  const [activeLinks, setActiveLinks] = React.useState<CrossTenantLink[]>([]);

  // Load data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incoming, outgoing] = await Promise.all([
        api.animalLinking.getIncomingRequests().catch((err: any) => {
          // If backend returns 500 (models not migrated yet), return empty array
          if (err?.status === 500) return [];
          throw err;
        }),
        api.animalLinking.getOutgoingRequests().catch((err: any) => {
          if (err?.status === 500) return [];
          throw err;
        }),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);

      // Load active links for specific animal if provided
      if (animalId) {
        const links = await api.animalLinking.getLinksForAnimal(animalId).catch((err: any) => {
          if (err?.status === 500) return [];
          throw err;
        });
        setActiveLinks(links);
      }
    } catch (err) {
      console.error("Failed to load link requests:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleApprove = async (request: LinkRequestWithDetails) => {
    // For now, we need to select which animal to link
    // This would typically open a modal to select the target animal
    // For simplicity, using a prompt - in production this should be a proper modal
    const targetAnimalIdStr = window.prompt(
      "Enter the ID of your animal to link as " + request.relationshipType.toLowerCase()
    );
    if (!targetAnimalIdStr) return;

    const targetAnimalId = parseInt(targetAnimalIdStr, 10);
    if (isNaN(targetAnimalId)) {
      setError("Invalid animal ID");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.animalLinking.approveRequest(request.id, { targetAnimalId });
      await loadData();
      onLinkChange?.();
    } catch (err: any) {
      console.error("Failed to approve request:", err);
      setError(err?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (request: LinkRequestWithDetails) => {
    const reason = window.prompt("Reason for denial (optional):");

    setActionLoading(true);
    setError(null);
    try {
      await api.animalLinking.denyRequest(request.id, reason ? { reason } : undefined);
      await loadData();
    } catch (err: any) {
      console.error("Failed to deny request:", err);
      setError(err?.message || "Failed to deny request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (link: CrossTenantLink) => {
    if (!window.confirm("Are you sure you want to revoke this link?")) return;

    const reason = window.prompt("Reason for revocation (optional):");

    setActionLoading(true);
    setError(null);
    try {
      await api.animalLinking.revokeLink(link.id, reason || undefined);
      await loadData();
      onLinkChange?.();
    } catch (err: any) {
      console.error("Failed to revoke link:", err);
      setError(err?.message || "Failed to revoke link");
    } finally {
      setActionLoading(false);
    }
  };

  // Counts
  const pendingIncomingCount = incomingRequests.filter(r => r.status === "PENDING").length;

  return (
    <div className="rounded-lg border border-hairline bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <h3 className="text-sm font-semibold">Cross-Tenant Links</h3>
          {pendingIncomingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-medium">
              {pendingIncomingCount}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "incoming"
              ? "text-accent border-b-2 border-accent bg-accent/5"
              : "text-secondary hover:text-primary hover:bg-white/5"
          }`}
        >
          Incoming
          {pendingIncomingCount > 0 && (
            <span className="ml-1 px-1 rounded bg-accent/20 text-accent">
              {pendingIncomingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "outgoing"
              ? "text-accent border-b-2 border-accent bg-accent/5"
              : "text-secondary hover:text-primary hover:bg-white/5"
          }`}
        >
          Outgoing
        </button>
        {animalId && (
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "active"
                ? "text-accent border-b-2 border-accent bg-accent/5"
                : "text-secondary hover:text-primary hover:bg-white/5"
            }`}
          >
            Active Links
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-secondary animate-pulse">Loading...</div>
        ) : (
          <>
            {/* Incoming requests */}
            {activeTab === "incoming" && (
              incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">
                  No incoming link requests
                </div>
              ) : (
                incomingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                    onApprove={() => handleApprove(request)}
                    onDeny={() => handleDeny(request)}
                    loading={actionLoading}
                  />
                ))
              )
            )}

            {/* Outgoing requests */}
            {activeTab === "outgoing" && (
              outgoingRequests.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">
                  No outgoing link requests
                </div>
              ) : (
                outgoingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                    loading={actionLoading}
                  />
                ))
              )
            )}

            {/* Active links */}
            {activeTab === "active" && animalId && (
              activeLinks.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">
                  No active cross-tenant links for this animal
                </div>
              ) : (
                activeLinks.map((link) => (
                  <ActiveLinkCard
                    key={link.id}
                    link={link}
                    onRevoke={() => handleRevoke(link)}
                    loading={actionLoading}
                  />
                ))
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LinkRequestsPanel;

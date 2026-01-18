// apps/contracts/src/ContractsListPage.tsx
// Full contracts list with filtering and actions

import * as React from "react";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  Bell,
} from "lucide-react";
import type { ContractsApi, Contract, ContractTemplate } from "./api";

interface Props {
  api: ContractsApi;
}

export default function ContractsListPage({ api }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [templates, setTemplates] = React.useState<ContractTemplate[]>([]);
  const [total, setTotal] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  // Modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedContract, setSelectedContract] = React.useState<Contract | null>(null);
  const [actionMenuId, setActionMenuId] = React.useState<number | null>(null);

  // Check URL params for auto-open
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setShowCreateModal(true);
    }
    if (params.get("status")) {
      setStatusFilter(params.get("status") || "");
    }
  }, []);

  // Fetch contracts
  const fetchContracts = React.useCallback(async () => {
    setLoading(true);
    try {
      const [contractsRes, templatesRes] = await Promise.all([
        api.contracts.contracts.list({ status: statusFilter || undefined }),
        api.contracts.templates.list(),
      ]);
      setContracts(contractsRes.items);
      setTotal(contractsRes.total);
      setTemplates(templatesRes.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, statusFilter]);

  React.useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Actions
  const handleSend = async (id: number) => {
    try {
      await api.contracts.contracts.send(id);
      fetchContracts();
    } catch (err: any) {
      alert(`Failed to send: ${err.message}`);
    }
    setActionMenuId(null);
  };

  const handleVoid = async (id: number) => {
    if (!confirm("Are you sure you want to void this contract?")) return;
    try {
      await api.contracts.contracts.void(id);
      fetchContracts();
    } catch (err: any) {
      alert(`Failed to void: ${err.message}`);
    }
    setActionMenuId(null);
  };

  const handleRemind = async (id: number) => {
    try {
      await api.contracts.contracts.remind(id);
      alert("Reminder sent!");
    } catch (err: any) {
      alert(`Failed to send reminder: ${err.message}`);
    }
    setActionMenuId(null);
  };

  const handleDownloadPdf = (id: number) => {
    const url = api.contracts.contracts.getPdfUrl(id);
    window.open(url, "_blank");
    setActionMenuId(null);
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "viewed", label: "Viewed" },
    { value: "signed", label: "Signed" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-hairline bg-surface text-primary text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchContracts}
            className="p-2 rounded-lg border border-hairline hover:bg-surface-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium rounded-md text-white transition-all hover:-translate-y-px active:translate-y-0"
          style={{
            backgroundColor: "#f97316",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 28px -12px rgba(249, 115, 22, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
          }}
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
        </div>
      ) : contracts.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(60, 60, 60, 0.5)",
          }}
        >
          <FileText className="w-12 h-12 mx-auto mb-3 text-secondary opacity-40" />
          <p className="text-lg font-medium text-primary">No contracts found</p>
          <p className="text-sm text-secondary mt-1">
            {statusFilter ? "Try changing your filters" : "Create your first contract to get started"}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(60, 60, 60, 0.5)",
          }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline" style={{ background: "rgba(30, 30, 30, 0.8)" }}>
                <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Contract</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-secondary hidden md:table-cell">
                  Parties
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-secondary hidden md:table-cell">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <ContractTableRow
                  key={contract.id}
                  contract={contract}
                  showMenu={actionMenuId === contract.id}
                  onToggleMenu={() => setActionMenuId(actionMenuId === contract.id ? null : contract.id)}
                  onView={() => setSelectedContract(contract)}
                  onSend={() => handleSend(contract.id)}
                  onVoid={() => handleVoid(contract.id)}
                  onRemind={() => handleRemind(contract.id)}
                  onDownload={() => handleDownloadPdf(contract.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Total count */}
      {!loading && contracts.length > 0 && (
        <p className="text-sm text-secondary">
          Showing {contracts.length} of {total} contracts
        </p>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateContractModal
          api={api}
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchContracts();
          }}
        />
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailModal
          api={api}
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onRefresh={fetchContracts}
        />
      )}

      {/* Click outside to close menu */}
      {actionMenuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
      )}
    </div>
  );
}

/* ───────── Table Row ───────── */

function ContractTableRow({
  contract,
  showMenu,
  onToggleMenu,
  onView,
  onSend,
  onVoid,
  onRemind,
  onDownload,
}: {
  contract: Contract;
  showMenu: boolean;
  onToggleMenu: () => void;
  onView: () => void;
  onSend: () => void;
  onVoid: () => void;
  onRemind: () => void;
  onDownload: () => void;
}) {
  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    draft: { icon: <FileText className="w-4 h-4" />, color: "bg-gray-700/50 text-gray-300", label: "Draft" },
    sent: { icon: <Send className="w-4 h-4" />, color: "bg-amber-900/50 text-amber-400", label: "Sent" },
    viewed: { icon: <Eye className="w-4 h-4" />, color: "bg-blue-900/50 text-blue-400", label: "Viewed" },
    signed: { icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-900/50 text-green-400", label: "Signed" },
    declined: { icon: <XCircle className="w-4 h-4" />, color: "bg-red-900/50 text-red-400", label: "Declined" },
    voided: { icon: <Trash2 className="w-4 h-4" />, color: "bg-gray-700/50 text-gray-400", label: "Voided" },
    expired: { icon: <Clock className="w-4 h-4" />, color: "bg-red-900/50 text-red-400", label: "Expired" },
  };

  const status = statusConfig[contract.status] || statusConfig.draft;
  const signedCount = contract.parties?.filter((p) => p.status === "signed").length || 0;
  const signerCount = contract.parties?.filter((p) => p.signer).length || 0;

  return (
    <tr className="border-b border-hairline last:border-0 hover:bg-surface-hover/50 transition-colors">
      <td className="px-4 py-3">
        <button onClick={onView} className="text-left hover:text-[var(--brand-orange)]">
          <p className="font-medium text-primary">{contract.title}</p>
          <p className="text-sm text-secondary">{contract.template?.name || "Custom"}</p>
        </button>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-secondary">
          {signedCount}/{signerCount} signed
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-secondary hidden md:table-cell">
        {new Date(contract.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right relative">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showMenu && (
          <div
            className="absolute right-4 top-full mt-1 rounded-lg shadow-lg z-20 min-w-[160px]"
            style={{
              background: "#242424",
              border: "1px solid rgba(60, 60, 60, 0.5)",
            }}
          >
            <button
              onClick={onView}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-surface-hover transition-colors"
            >
              <Eye className="w-4 h-4" /> View Details
            </button>
            {contract.status === "draft" && (
              <button
                onClick={onSend}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-surface-hover transition-colors"
              >
                <Send className="w-4 h-4" /> Send Contract
              </button>
            )}
            {["sent", "viewed"].includes(contract.status) && (
              <button
                onClick={onRemind}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-surface-hover transition-colors"
              >
                <Bell className="w-4 h-4" /> Send Reminder
              </button>
            )}
            {contract.status === "signed" && (
              <button
                onClick={onDownload}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-surface-hover transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            {!["signed", "voided", "expired"].includes(contract.status) && (
              <button
                onClick={onVoid}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-surface-hover transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Void Contract
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

/* ───────── Create Modal ───────── */

function CreateContractModal({
  api,
  templates,
  onClose,
  onCreated,
}: {
  api: ContractsApi;
  templates: ContractTemplate[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState<ContractTemplate | null>(null);
  const [title, setTitle] = React.useState("");

  // Contact/Party selection
  const [selectedParty, setSelectedParty] = React.useState<any>(null);
  const [partySearchQuery, setPartySearchQuery] = React.useState("");
  const [partySearchResults, setPartySearchResults] = React.useState<any[]>([]);
  const [searchingParties, setSearchingParties] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Manual entry mode (for entering buyer details directly instead of searching)
  const [useManualEntry, setUseManualEntry] = React.useState(false);
  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");

  // Search parties with debounce
  React.useEffect(() => {
    if (!partySearchQuery) {
      setPartySearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingParties(true);
      try {
        const results = await api.contracts.parties.search(partySearchQuery, { limit: 10 });
        console.log("Party search results:", results);
        setPartySearchResults(results);
      } catch (err) {
        console.error("Failed to search parties:", err);
        setPartySearchResults([]);
      } finally {
        setSearchingParties(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [partySearchQuery, api]);

  const handleCreate = async () => {
    if (!selectedTemplate || !title) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate contact selection
    if (!selectedParty) {
      setError("Please select a contact");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.contracts.contracts.create({
        templateId: selectedTemplate.id,
        title,
        parties: [
          {
            role: "SELLER",
            name: "Breeder", // Will be filled from tenant data on backend
            email: "", // Will be filled from tenant
            signer: true,
            // order omitted = parallel signing (any party can sign)
          },
          {
            role: "BUYER",
            partyId: selectedParty.partyId,
            name: selectedParty.displayName,
            email: selectedParty.primaryEmail || "",
            signer: true,
            // order omitted = parallel signing (any party can sign)
          },
        ],
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Template card colors for visual variety
  const templateColors = [
    { border: "#f97316", bg: "rgba(249, 115, 22, 0.1)", icon: "#f97316" },  // orange
    { border: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", icon: "#c084fc" },  // purple
    { border: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: "#34d399" },  // green
    { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: "#fbbf24" },  // amber
    { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: "#60a5fa" },  // blue
    { border: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", icon: "#f472b6" },  // pink
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(to bottom right, #1a1a1a, #141414)",
          border: "1px solid rgba(63, 63, 70, 0.5)",
        }}
      >
        <div className="p-6" style={{ borderBottom: "1px solid rgba(63, 63, 70, 0.5)" }}>
          <h2 className="text-xl font-semibold text-white">
            {step === 1 ? "Choose a Template" : step === 2 ? "Select Contact" : "Contract Details"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            {step === 1
              ? "Select a template to start your contract"
              : step === 2
              ? "Search for an existing contact or enter manually"
              : "Enter the contract details"}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, index) => {
                const colorScheme = templateColors[index % templateColors.length];
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setTitle(template.name);
                      setStep(2);
                    }}
                    className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: isSelected
                        ? `linear-gradient(to bottom right, ${colorScheme.bg}, #1a1a1a)`
                        : "linear-gradient(to bottom right, #242424, #1a1a1a)",
                      borderLeft: `4px solid ${colorScheme.border}`,
                      border: isSelected
                        ? `1px solid ${colorScheme.border}`
                        : "1px solid rgba(63, 63, 70, 0.5)",
                      borderLeftWidth: "4px",
                      borderLeftColor: colorScheme.border,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{
                          backgroundColor: colorScheme.bg,
                          color: colorScheme.icon,
                        }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{template.name}</p>
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: "#a1a1aa" }}>
                          {template.description || "No description"}
                        </p>
                        <span
                          className="inline-block mt-2 text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(63, 63, 70, 0.5)",
                            color: "#a1a1aa",
                          }}
                        >
                          {template.type === "SYSTEM" ? "System" : "Custom"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              {/* Search input */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Search for Contact <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={partySearchQuery}
                  onChange={(e) => setPartySearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-zinc-500 transition-colors"
                  style={{
                    backgroundColor: "#242424",
                    border: !selectedParty && !partySearchQuery.trim()
                      ? "1px solid rgba(245, 158, 11, 0.6)"
                      : "1px solid rgba(63, 63, 70, 0.5)",
                  }}
                  placeholder="Search by name or email..."
                  autoFocus
                />
              </div>

              {/* Search results */}
              {partySearchQuery && (
                <div className="space-y-2">
                  {searchingParties ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: "#f97316" }} />
                    </div>
                  ) : partySearchResults.length === 0 ? (
                    <div className="text-center py-4" style={{ color: "#71717a" }}>
                      <p className="text-sm">No contacts found</p>
                      <p className="text-xs mt-2">Try searching by name or email address</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {partySearchResults.map((party) => (
                        <button
                          key={party.partyId}
                          onClick={() => {
                            setSelectedParty(party);
                            setStep(3);
                          }}
                          className="w-full p-3 rounded-lg text-left transition-all hover:scale-[1.01]"
                          style={{
                            background: selectedParty?.partyId === party.partyId
                              ? "linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), #1a1a1a)"
                              : "#242424",
                            border: selectedParty?.partyId === party.partyId
                              ? "1px solid rgba(168, 85, 247, 0.3)"
                              : "1px solid rgba(63, 63, 70, 0.5)",
                          }}
                        >
                          <p className="font-medium text-white">{party.displayName}</p>
                          <p className="text-sm" style={{ color: "#a1a1aa" }}>{party.primaryEmail || "No email"}</p>
                          {party.organizationName && (
                            <p className="text-xs mt-1" style={{ color: "#71717a" }}>{party.organizationName}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Contract Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-zinc-500 transition-colors"
                  style={{
                    backgroundColor: "#242424",
                    border: !title.trim()
                      ? "1px solid rgba(245, 158, 11, 0.6)"
                      : "1px solid rgba(63, 63, 70, 0.5)",
                  }}
                  placeholder="e.g., Puppy Sale Agreement - Luna"
                />
              </div>

              {/* Selected Contact Summary */}
              <div className="pt-4" style={{ borderTop: "1px solid rgba(63, 63, 70, 0.5)" }}>
                <h3 className="text-sm font-medium text-white mb-3">Buyer Information</h3>
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: "#242424",
                    border: "1px solid rgba(63, 63, 70, 0.5)",
                  }}
                >
                  <p className="font-medium text-white">{selectedParty?.displayName}</p>
                  <p className="text-sm mt-1" style={{ color: "#a1a1aa" }}>{selectedParty?.primaryEmail || "No email"}</p>
                  {selectedParty?.organizationName && (
                    <p className="text-xs mt-1" style={{ color: "#71717a" }}>{selectedParty.organizationName}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex justify-between" style={{ borderTop: "1px solid rgba(63, 63, 70, 0.5)" }}>
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="px-4 py-2 transition-colors hover:opacity-80"
              style={{ color: "#a1a1aa" }}
            >
              ← Back
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{
                border: "1px solid rgba(63, 63, 70, 0.5)",
                color: "#d4d4d8",
              }}
            >
              Cancel
            </button>
            {step === 2 && useManualEntry && (
              <button
                onClick={() => {
                  if (buyerName.trim() && buyerEmail.trim()) {
                    setStep(3);
                  } else {
                    setError("Please fill in name and email");
                  }
                }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#f97316" }}
              >
                Next →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#f97316" }}
              >
                {submitting ? "Creating..." : "Create Contract"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Detail Modal ───────── */

function ContractDetailModal({
  api,
  contract,
  onClose,
  onRefresh,
}: {
  api: ContractsApi;
  contract: Contract;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.contracts.contracts.getEvents(contract.id);
        setEvents(res.items || []);
      } catch {
        // Ignore errors
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [api, contract.id]);

  const handleSend = async () => {
    try {
      await api.contracts.contracts.send(contract.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(`Failed to send: ${err.message}`);
    }
  };

  const handleDownload = () => {
    window.open(api.contracts.contracts.getPdfUrl(contract.id), "_blank");
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-700/50 text-gray-300",
    sent: "bg-amber-900/50 text-amber-400",
    viewed: "bg-blue-900/50 text-blue-400",
    signed: "bg-green-900/50 text-green-400",
    declined: "bg-red-900/50 text-red-400",
    voided: "bg-gray-700/50 text-gray-400",
    expired: "bg-red-900/50 text-red-400",
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(60, 60, 60, 0.5)",
        }}
      >
        <div className="p-6 flex justify-between items-start" style={{ borderBottom: "1px solid rgba(60, 60, 60, 0.5)" }}>
          <div>
            <h2 className="text-xl font-semibold text-primary">{contract.title}</h2>
            <p className="text-sm text-secondary mt-1">
              Created {new Date(contract.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[contract.status]}`}>
            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Parties */}
          <div>
            <h3 className="text-sm font-medium text-primary mb-3">Contract Parties</h3>
            <div className="space-y-2">
              {contract.parties?.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "#242424", border: "1px solid rgba(60, 60, 60, 0.5)" }}
                >
                  <div>
                    <p className="font-medium text-primary">{party.name}</p>
                    <p className="text-sm text-secondary">{party.email}</p>
                    <span className="text-xs text-secondary">{party.role}</span>
                  </div>
                  <div className="text-right">
                    {party.signer && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          party.status === "signed"
                            ? "bg-green-900/50 text-green-400"
                            : party.status === "declined"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-gray-700/50 text-gray-300"
                        }`}
                      >
                        {party.status === "signed"
                          ? "Signed"
                          : party.status === "declined"
                          ? "Declined"
                          : party.status === "viewed"
                          ? "Viewed"
                          : "Pending"}
                      </span>
                    )}
                    {party.signedAt && (
                      <p className="text-xs text-secondary mt-1">
                        {new Date(party.signedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail */}
          <div>
            <h3 className="text-sm font-medium text-primary mb-3">Activity Log</h3>
            {loadingEvents ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-orange)] mx-auto" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-secondary">No events recorded yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className="text-secondary whitespace-nowrap">
                      {new Date(event.at).toLocaleString()}
                    </div>
                    <div className="text-primary">
                      {event.message || event.status}
                      {event.partyName && (
                        <span className="text-secondary"> by {event.partyName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 flex justify-end gap-2" style={{ borderTop: "1px solid rgba(60, 60, 60, 0.5)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(60, 60, 60, 0.5)" }}
          >
            Close
          </button>
          {contract.status === "draft" && (
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Contract
            </button>
          )}
          {contract.status === "signed" && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// apps/contracts/src/ContractsHome.tsx
// Dashboard view for contracts module

import * as React from "react";
import { FileText, Send, CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react";
import type { ContractsApi, Contract } from "./api";

interface Props {
  api: ContractsApi;
}

export default function ContractsHome({ api }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch recent contracts
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.contracts.contracts.list({ limit: 10 });
        if (!cancelled) {
          setContracts(res.items);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const draft = contracts.filter((c) => c.status === "draft").length;
    const pending = contracts.filter((c) => ["sent", "viewed"].includes(c.status)).length;
    const signed = contracts.filter((c) => c.status === "signed").length;
    const expired = contracts.filter((c) => c.status === "expired").length;
    return { draft, pending, signed, expired, total: contracts.length };
  }, [contracts]);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Draft"
          value={stats.draft}
          variant="gray"
        />
        <StatCard
          icon={<Send className="w-5 h-5" />}
          label="Awaiting Signature"
          value={stats.pending}
          variant="amber"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Signed"
          value={stats.signed}
          variant="green"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Expired"
          value={stats.expired}
          variant="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Plus className="w-6 h-6" />}
            title="Create Contract"
            description="Start a new contract from a template"
            onClick={() => navigate("/contracts/list?create=true")}
            variant="create"
          />
          <QuickActionCard
            icon={<FileText className="w-6 h-6" />}
            title="View All Contracts"
            description="See all contracts and their status"
            onClick={() => navigate("/contracts/list")}
            variant="view"
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="Pending Signatures"
            description="Contracts awaiting buyer signature"
            onClick={() => navigate("/contracts/list?status=sent")}
            variant="pending"
          />
        </div>
      </div>

      {/* Recent Contracts */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(to bottom right, #1a1a1a, #141414)",
          border: "1px solid rgba(63, 63, 70, 0.5)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Contracts</h2>
          <button
            onClick={() => navigate("/contracts/list")}
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: "#f97316" }}
          >
            View All →
          </button>
        </div>

        {error ? (
          <div className="text-red-400 text-sm py-4">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(63, 63, 70, 0.5)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "#52525b" }} />
            </div>
            <p className="text-lg font-medium" style={{ color: "#d4d4d8" }}>No contracts yet</p>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>Create your first contract to get started</p>
            <button
              onClick={() => navigate("/contracts/list?create=true")}
              className="mt-5 px-5 py-2.5 rounded-lg transition-colors font-medium hover:opacity-90"
              style={{ backgroundColor: "#f97316", color: "white" }}
            >
              Create Contract
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {contracts.slice(0, 5).map((contract) => (
              <ContractRow
                key={contract.id}
                contract={contract}
                onClick={() => navigate(`/contracts/list?id=${contract.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Sub-components ───────── */

// Stat card style config with inline styles for consistency
const STAT_CARD_STYLES = {
  gray: {
    borderColor: "#71717a",
    iconBg: "rgba(113, 113, 122, 0.15)",
    iconColor: "#a1a1aa",
  },
  amber: {
    borderColor: "#f59e0b",
    iconBg: "rgba(245, 158, 11, 0.15)",
    iconColor: "#fbbf24",
  },
  green: {
    borderColor: "#10b981",
    iconBg: "rgba(16, 185, 129, 0.15)",
    iconColor: "#34d399",
  },
  red: {
    borderColor: "#ef4444",
    iconBg: "rgba(239, 68, 68, 0.15)",
    iconColor: "#f87171",
  },
};

function StatCard({
  icon,
  label,
  value,
  variant = "gray",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: keyof typeof STAT_CARD_STYLES;
}) {
  const styles = STAT_CARD_STYLES[variant];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "linear-gradient(to bottom right, #1a1a1a, #141414)",
        borderLeft: `4px solid ${styles.borderColor}`,
        border: "1px solid rgba(63, 63, 70, 0.5)",
        borderLeftWidth: "4px",
        borderLeftColor: styles.borderColor,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: styles.iconBg,
            color: styles.iconColor,
          }}
        >
          {icon}
        </div>
        <div>
          <span className="text-2xl font-bold text-white">{value}</span>
          <p className="text-sm text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Quick action card styles with inline styles for CSS variable support
const QUICK_ACTION_STYLES = {
  create: {
    gradient: "linear-gradient(to bottom right, rgba(249, 115, 22, 0.15), #1a1a1a, #1f1f1f)",
    borderColor: "#f97316",
    iconBg: "rgba(249, 115, 22, 0.2)",
    iconBgHover: "rgba(249, 115, 22, 0.3)",
    iconColor: "#f97316",
  },
  view: {
    gradient: "linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), #1a1a1a, #1f1f1f)",
    borderColor: "#a855f7",
    iconBg: "rgba(168, 85, 247, 0.2)",
    iconBgHover: "rgba(168, 85, 247, 0.3)",
    iconColor: "#c084fc",
  },
  pending: {
    gradient: "linear-gradient(to bottom right, rgba(245, 158, 11, 0.15), #1a1a1a, #1f1f1f)",
    borderColor: "#f59e0b",
    iconBg: "rgba(245, 158, 11, 0.2)",
    iconBgHover: "rgba(245, 158, 11, 0.3)",
    iconColor: "#fbbf24",
  },
};

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  variant = "create",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: keyof typeof QUICK_ACTION_STYLES;
}) {
  const styles = QUICK_ACTION_STYLES[variant];
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-start gap-4 p-5 rounded-xl text-left transition-all duration-200"
      style={{
        background: styles.gradient,
        borderLeft: `4px solid ${styles.borderColor}`,
        boxShadow: isHovered ? `0 10px 40px -10px ${styles.borderColor}40` : "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        className="p-3 rounded-xl transition-colors"
        style={{
          backgroundColor: isHovered ? styles.iconBgHover : styles.iconBg,
          color: styles.iconColor,
        }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{description}</p>
      </div>
    </button>
  );
}

function ContractRow({ contract, onClick }: { contract: Contract; onClick: () => void }) {
  const statusStyles: Record<string, { badge: string; icon: string }> = {
    draft: { badge: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", icon: "text-zinc-500" },
    sent: { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", icon: "text-amber-500" },
    viewed: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30", icon: "text-blue-500" },
    signed: { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", icon: "text-emerald-500" },
    declined: { badge: "bg-red-500/20 text-red-400 border border-red-500/30", icon: "text-red-500" },
    voided: { badge: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", icon: "text-zinc-500" },
    expired: { badge: "bg-red-500/20 text-red-400 border border-red-500/30", icon: "text-red-500" },
  };

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    signed: "Signed",
    declined: "Declined",
    voided: "Voided",
    expired: "Expired",
  };

  const style = statusStyles[contract.status] || statusStyles.draft;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left group"
    >
      <div className="flex items-center gap-3">
        <FileText className={`w-5 h-5 ${style.icon} group-hover:scale-110 transition-transform`} />
        <div>
          <p className="font-medium text-white">{contract.title}</p>
          <p className="text-sm text-zinc-500">
            {contract.parties?.length || 0} parties · Created{" "}
            {new Date(contract.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
        {statusLabels[contract.status] || contract.status}
      </span>
    </button>
  );
}

// apps/platform/src/components/ContactFollowUps.tsx
// Prominent contact follow-up tasks widget for the dashboard

import * as React from "react";
import { Button } from "@bhq/ui";
import { Bell, Calendar, Gift, FileText, CheckCircle, Clock, User, Building2, ChevronRight } from "lucide-react";
import { api, type ContactFollowUpTask } from "../api";

interface ContactFollowUpsProps {
  maxItems?: number;
  onOpenContact?: (partyId: number, partyKind: "CONTACT" | "ORGANIZATION") => void;
}

const KIND_ICONS: Record<string, React.ReactNode> = {
  follow_up: <Bell className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  milestone: <Gift className="h-4 w-4" />,
  overdue_invoice: <FileText className="h-4 w-4" />,
};

const KIND_COLORS: Record<string, string> = {
  follow_up: "text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10",
  event: "text-blue-400 bg-blue-500/10",
  milestone: "text-purple-400 bg-purple-500/10",
  overdue_invoice: "text-red-400 bg-red-500/10",
};

const SEVERITY_STYLES: Record<string, string> = {
  overdue: "border-red-500/30 bg-red-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  info: "border-hairline bg-surface",
};

export default function ContactFollowUps({ maxItems = 5, onOpenContact }: ContactFollowUpsProps) {
  const [tasks, setTasks] = React.useState<ContactFollowUpTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadTasks = React.useCallback(async () => {
    try {
      const result = await api.dashboard.contactTasks();
      // Sort by severity (overdue first) then by date
      const sorted = [...result].sort((a, b) => {
        const severityOrder = { overdue: 0, warning: 1, info: 2 };
        const aSev = severityOrder[a.severity] ?? 2;
        const bSev = severityOrder[b.severity] ?? 2;
        if (aSev !== bSev) return aSev - bSev;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      setTasks(sorted);
    } catch (e: any) {
      setError(e?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async (task: ContactFollowUpTask) => {
    try {
      await api.dashboard.completeContactTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      // Silently fail - task stays in list
    }
  };

  const formatDueDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff < 7) return `In ${diff} days`;
    if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
    if (diff <= -7) return `${Math.abs(diff)} days overdue`;

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const displayedTasks = tasks.slice(0, maxItems);
  const hasMore = tasks.length > maxItems;
  const overdueCount = tasks.filter((t) => t.severity === "overdue").length;

  if (loading) {
    return (
      <div className="rounded-xl border border-hairline bg-card p-4">
        <div className="text-sm text-secondary">Loading follow-ups...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">All caught up!</div>
            <div className="text-xs text-secondary">No pending contact follow-ups</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-hairline bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
          <span className="font-semibold text-sm">Contact Follow-ups</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">
              {overdueCount} overdue
            </span>
          )}
        </div>
        <span className="text-xs text-secondary">{tasks.length} pending</span>
      </div>

      {/* Tasks list */}
      <div className="divide-y divide-hairline">
        {displayedTasks.map((task) => {
          const icon = KIND_ICONS[task.kind] || <Bell className="h-4 w-4" />;
          const iconColor = KIND_COLORS[task.kind] || KIND_COLORS.follow_up;
          const borderStyle = SEVERITY_STYLES[task.severity] || SEVERITY_STYLES.info;

          return (
            <div
              key={task.id}
              className={`px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${borderStyle} border-l-2`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-secondary flex items-center gap-1">
                    {task.partyKind === "CONTACT" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    {task.partyName}
                  </span>
                  <span className="text-hairline">|</span>
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      task.severity === "overdue"
                        ? "text-red-400"
                        : task.severity === "warning"
                        ? "text-amber-400"
                        : "text-secondary"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleComplete(task)}
                  className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors"
                  title="Mark complete"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                {onOpenContact && (
                  <button
                    type="button"
                    onClick={() => onOpenContact(task.partyId, task.partyKind)}
                    className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                    title="Open contact"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {hasMore && (
        <div className="px-4 py-2 border-t border-hairline text-center">
          <button
            type="button"
            className="text-xs text-[hsl(var(--brand-orange))] hover:underline"
            onClick={() => {
              // Navigate to contacts with follow-up filter
              window.location.href = "/contacts?hasFollowUp=true";
            }}
          >
            View all {tasks.length} follow-ups
          </button>
        </div>
      )}
    </div>
  );
}

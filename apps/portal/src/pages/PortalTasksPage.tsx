// apps/portal/src/pages/PortalTasksPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { usePortalTasks, type TaskCard } from "../tasks/taskSources";

/* ───────────────── Task Card Component ───────────────── */

function TaskCardRow({ task }: { task: TaskCard }) {
  const statusColors: Record<TaskCard["status"], "red" | "amber" | "green"> = {
    overdue: "red",
    pending: "amber",
    upcoming: "green",
  };

  const statusLabels: Record<TaskCard["status"], string> = {
    overdue: "Overdue",
    pending: "Due Soon",
    upcoming: "Upcoming",
  };

  const typeLabels: Record<TaskCard["type"], string> = {
    invoice: "Invoice",
    contract: "Contract",
    appointment: "Appointment",
    document: "Document",
  };

  const handleClick = () => {
    // Cross-module links (e.g., /finance/*) require full page navigation
    // Intra-portal links (e.g., /portal/*) use SPA navigation
    if (task.href.startsWith("/portal")) {
      window.history.pushState(null, "", task.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.location.href = task.href;
    }
  };

  const handleSecondaryClick = () => {
    if (!task.secondaryAction) return;
    const href = task.secondaryAction.href;
    if (href.startsWith("/portal")) {
      window.history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.location.href = href;
    }
  };

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return "No due date";
    const date = new Date(dueAt);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>
            <Badge variant="neutral">{typeLabels[task.type]}</Badge>
          </div>
          <div className="font-medium text-primary mt-2">{task.title}</div>
          <p className="text-sm text-secondary mt-1">{task.subtitle}</p>
          {task.dueAt && (
            <p className="text-xs text-secondary mt-1">
              Due: {formatDueDate(task.dueAt)}
            </p>
          )}
          {task.note && (
            <p className="text-xs text-secondary/70 mt-1 italic">
              {task.note}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={handleClick}>
            {task.ctaLabel}
          </Button>
          {task.secondaryAction && (
            <Button variant="secondary" size="sm" onClick={handleSecondaryClick}>
              {task.secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyTasks() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        ✅
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">All caught up!</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        You have no pending tasks. When you have invoices to pay, contracts to sign,
        or appointments to confirm, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingTasks() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-2xl animate-pulse">
        📋
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Loading tasks...</h3>
      <p className="text-sm text-secondary">Checking for pending items</p>
    </div>
  );
}

/* ───────────────── Source Status ───────────────── */

function SourceStatus({
  sources,
}: {
  sources: { name: string; available: boolean }[];
}) {
  const unavailable = sources.filter((s) => !s.available);
  if (unavailable.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-lg border border-hairline bg-surface/30">
      <div className="text-xs text-secondary">
        {unavailable.map((s) => s.name).join(", ")}: This section will populate when items exist.
      </div>
    </div>
  );
}

/* ───────────────── Grouped Tasks ───────────────── */

function GroupedTasks({ tasks }: { tasks: TaskCard[] }) {
  // Group by type
  const grouped = tasks.reduce(
    (acc, task) => {
      if (!acc[task.type]) acc[task.type] = [];
      acc[task.type].push(task);
      return acc;
    },
    {} as Record<string, TaskCard[]>
  );

  const typeOrder: TaskCard["type"][] = [
    "invoice",
    "contract",
    "appointment",
    "document",
  ];
  const typeLabels: Record<TaskCard["type"], string> = {
    invoice: "Invoices",
    contract: "Contracts",
    appointment: "Appointments",
    document: "Documents",
  };

  return (
    <div className="space-y-8">
      {typeOrder.map((type) => {
        const typeTasks = grouped[type];
        if (!typeTasks || typeTasks.length === 0) return null;

        return (
          <div key={type}>
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
              {typeLabels[type]} ({typeTasks.length})
            </h3>
            <div className="space-y-3">
              {typeTasks.map((task) => (
                <TaskCardRow key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalTasksPage() {
  const { tasks, sources, loading, error } = usePortalTasks();

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const overdueCount = tasks.filter((t) => t.status === "overdue").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  const getSubtitle = () => {
    if (loading) return "Loading...";
    if (tasks.length === 0) return "No pending tasks";
    const parts: string[] = [];
    if (overdueCount > 0)
      parts.push(`${overdueCount} overdue`);
    if (pendingCount > 0)
      parts.push(`${pendingCount} pending`);
    return parts.join(", ") || `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Tasks"
        subtitle={getSubtitle()}
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <LoadingTasks />
        ) : tasks.length === 0 ? (
          <EmptyTasks />
        ) : (
          <GroupedTasks tasks={tasks} />
        )}
      </div>

      <SourceStatus sources={sources} />
    </div>
  );
}

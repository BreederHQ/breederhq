// apps/portal/src/pages/PortalTasksPage.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";
import { usePortalTasks, type TaskCard } from "../tasks/taskSources";

/* ───────────────── Task Row Component ───────────────── */

function TaskRow({ task, isLast }: { task: TaskCard; isLast: boolean }) {
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

  const getTimingText = () => {
    if (!task.dueAt) return null;
    const date = new Date(task.dueAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (task.status === "overdue") {
      return "Overdue";
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays > 1 && diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due ${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
    }
  };

  const timingText = getTimingText();

  return (
    <a
      href={task.href}
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className="group flex items-center gap-5 px-0 cursor-pointer transition-colors hover:bg-white/[0.02]"
      style={{
        textDecoration: "none",
        borderBottom: isLast ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
        paddingTop: "20px",
        paddingBottom: "20px",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <div className="text-base font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
            {task.title}
          </div>
          {timingText && (
            <div
              className="text-xs font-medium"
              style={{
                color: task.status === "overdue" ? "#ef4444" : "hsl(var(--text-secondary))",
                opacity: task.status === "overdue" ? 1 : 0.85,
              }}
            >
              {timingText}
            </div>
          )}
        </div>
        <div className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "3px", opacity: 0.85 }}>
          {task.subtitle}
        </div>
      </div>
      <div
        className="flex-shrink-0 text-sm font-medium"
        style={{ color: "hsl(var(--text-secondary))", marginLeft: "8px" }}
      >
        View
      </div>
    </a>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyTasks() {
  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ width: "48px", height: "1px", backgroundColor: "rgba(255, 255, 255, 0.06)", marginBottom: "20px" }} />
      <h3 className="text-lg font-medium" style={{ color: "hsl(var(--text-primary))" }}>
        No tasks right now.
      </h3>
      <p className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "8px" }}>
        When you have items that need attention, they'll appear here.
      </p>
    </div>
  );
}

/* ───────────────── Grouped Tasks ───────────────── */

function GroupedTasks({ tasks }: { tasks: TaskCard[] }) {
  // Group by urgency
  const grouped = tasks.reduce(
    (acc, task) => {
      if (!acc[task.urgency]) acc[task.urgency] = [];
      acc[task.urgency].push(task);
      return acc;
    },
    {} as Record<string, TaskCard[]>
  );

  const urgencyOrder: Array<TaskCard["urgency"]> = [
    "action_required",
    "upcoming",
    "completed",
  ];

  const urgencyLabels: Record<TaskCard["urgency"], string> = {
    action_required: "Action Required",
    upcoming: "Upcoming",
    completed: "Completed",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {urgencyOrder.map((urgency) => {
        const urgencyTasks = grouped[urgency];
        if (!urgencyTasks || urgencyTasks.length === 0) return null;

        return (
          <section key={urgency}>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-secondary))", marginBottom: "12px" }}>
              {urgencyLabels[urgency]} ({urgencyTasks.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {urgencyTasks.map((task, index) => (
                <TaskRow key={task.id} task={task} isLast={index === urgencyTasks.length - 1} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalTasksPage() {
  const { tasks, loading, error } = usePortalTasks();

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6" style={{ maxWidth: "920px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="text-2xl font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
          Tasks
        </h1>
        <Button variant="secondary" onClick={handleBackClick}>
          Back to Portal
        </Button>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-sm" style={{ color: "hsl(var(--text-secondary))", marginTop: "24px" }}>
          Loading...
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div style={{ marginTop: "24px" }}>
          {tasks.length === 0 ? <EmptyTasks /> : <GroupedTasks tasks={tasks} />}
        </div>
      )}
    </div>
  );
}

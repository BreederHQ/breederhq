// apps/portal/src/pages/PortalTasksPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { usePortalTasks, type TaskCard } from "../tasks/taskSources";

/* ───────────────── Task Row Component ───────────────── */

function TaskRow({ task, isLast }: { task: TaskCard; isLast: boolean }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigation only - no inline edits
    window.location.href = task.href;
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
    }
    return null;
  };

  const timingText = task.note || getTimingText();

  return (
    <a
      href={task.href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--portal-space-1)",
        padding: "var(--portal-space-3) 0",
        borderBottom: isLast ? "none" : "1px solid var(--portal-border-subtle)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background var(--portal-transition)",
        background: isHovered ? "var(--portal-bg-elevated)" : "transparent",
      }}
    >
      <div
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-medium)",
          color: "var(--portal-text-primary)",
        }}
      >
        {task.title}
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
        }}
      >
        {task.subtitle}
      </div>
      {timingText && (
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: task.status === "overdue" ? "#ef4444" : "var(--portal-text-secondary)",
          }}
        >
          {timingText}
        </div>
      )}
    </a>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyTasks() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        gap: "var(--portal-space-2)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        No tasks right now
      </h1>
      <p
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
          margin: 0,
        }}
      >
        If something needs your attention, it will show up here.
      </p>
    </div>
  );
}

/* ───────────────── Grouped Tasks ───────────────── */

function GroupedTasks({ tasks }: { tasks: TaskCard[] }) {
  const [isCompletedExpanded, setIsCompletedExpanded] = React.useState(false);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-6)" }}>
      {urgencyOrder.map((urgency) => {
        const urgencyTasks = grouped[urgency];
        if (!urgencyTasks || urgencyTasks.length === 0) return null;

        const isCollapsed = urgency === "completed" && !isCompletedExpanded;

        return (
          <section key={urgency}>
            {urgency === "completed" ? (
              <button
                onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                style={{
                  all: "unset",
                  display: "block",
                  width: "100%",
                  cursor: "pointer",
                  marginBottom: "var(--portal-space-2)",
                }}
              >
                <h2
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    fontWeight: "var(--portal-font-weight-semibold)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--portal-text-secondary)",
                  }}
                >
                  {urgencyLabels[urgency]} ({urgencyTasks.length}) {isCollapsed ? "▸" : "▾"}
                </h2>
              </button>
            ) : (
              <h2
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  fontWeight: "var(--portal-font-weight-semibold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--portal-text-secondary)",
                  marginBottom: "var(--portal-space-2)",
                }}
              >
                {urgencyLabels[urgency]} ({urgencyTasks.length})
              </h2>
            )}
            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {urgencyTasks.map((task, index) => (
                  <TaskRow key={task.id} task={task} isLast={index === urgencyTasks.length - 1} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "80px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-md)",
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────── Error State ───────────────── */

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        gap: "var(--portal-space-3)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
          margin: 0,
        }}
      >
        {error}
      </p>
      <button
        onClick={onRetry}
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-medium)",
          padding: "var(--portal-space-2) var(--portal-space-3)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--portal-accent)",
          borderRadius: "var(--portal-radius-md)",
          cursor: "pointer",
          transition: "all var(--portal-transition)",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalTasksPage() {
  const { tasks, loading, error } = usePortalTasks();
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
    window.location.reload();
  };

  return (
    <PageContainer>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        Tasks
      </h1>

      {loading && <LoadingSkeleton />}

      {!loading && error && <ErrorState error={error} onRetry={handleRetry} />}

      {!loading && !error && (tasks.length === 0 ? <EmptyTasks /> : <GroupedTasks tasks={tasks} />)}
    </PageContainer>
  );
}

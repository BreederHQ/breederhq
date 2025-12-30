// apps/portal/src/pages/PortalTasksPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockTasks, type PortalTask } from "../mock";

/* ───────────────── Task Row ───────────────── */

function TaskRow({ task }: { task: PortalTask }) {
  const priorityColors: Record<PortalTask["priority"], "red" | "amber" | "green"> = {
    high: "red",
    medium: "amber",
    low: "green",
  };

  const statusLabels: Record<PortalTask["status"], string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={priorityColors[task.priority]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge variant="neutral">{statusLabels[task.status]}</Badge>
          </div>
          <div className="font-medium text-primary mt-2">{task.title}</div>
          <p className="text-sm text-secondary mt-1">Due: {task.dueDate}</p>
        </div>
        <Button variant="secondary" size="sm">
          View
        </Button>
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
      <h3 className="text-lg font-medium text-primary mb-2">No tasks</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you have action items, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalTasksPage() {
  const pendingCount = mockTasks.filter((t) => t.status !== "completed").length;

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Tasks"
        subtitle={pendingCount > 0 ? `${pendingCount} pending task${pendingCount !== 1 ? "s" : ""}` : "All tasks completed"}
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockTasks.length === 0 ? (
          <EmptyTasks />
        ) : (
          <div className="space-y-3">
            {mockTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// apps/portal/src/pages/PortalTasksPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { usePortalTasks, type TaskCard } from "../tasks/taskSources";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspring } from "../dev/mockData";

/* ────────────────────────────────────────────────────────────────────────────
 * Task Type Icon
 * ──────────────────────────────────────────────────────────────────────────── */

function TaskIcon({ type }: { type: TaskCard["type"] }) {
  const iconMap: Record<TaskCard["type"], { emoji: string; bg: string }> = {
    invoice: { emoji: "💳", bg: "var(--portal-accent-soft)" },
    contract: { emoji: "📝", bg: "var(--portal-info-soft)" },
    appointment: { emoji: "📅", bg: "var(--portal-success-soft)" },
    document: { emoji: "📄", bg: "var(--portal-warning-soft)" },
    offspring: { emoji: "🐕", bg: "var(--portal-accent-muted)" },
  };

  const config = iconMap[type] || iconMap.document;

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--portal-radius-lg)",
        background: config.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
      }}
    >
      {config.emoji}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Task Status Badge
 * ──────────────────────────────────────────────────────────────────────────── */

function TaskStatusBadge({ status, urgency }: { status: TaskCard["status"]; urgency: TaskCard["urgency"] }) {
  if (urgency === "completed") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          background: "var(--portal-success-soft)",
          borderRadius: "var(--portal-radius-full)",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--portal-success)",
          }}
        />
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-success)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Complete
        </span>
      </div>
    );
  }

  if (status === "overdue") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          background: "var(--portal-error-soft)",
          borderRadius: "var(--portal-radius-full)",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--portal-error)",
            boxShadow: "0 0 6px var(--portal-error)",
          }}
        />
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-error)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Overdue
        </span>
      </div>
    );
  }

  if (urgency === "action_required") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          background: "var(--portal-accent-muted)",
          borderRadius: "var(--portal-radius-full)",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--portal-accent)",
            boxShadow: "0 0 6px var(--portal-accent)",
          }}
        />
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Action Required
        </span>
      </div>
    );
  }

  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Task Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface TaskRowProps {
  task: TaskCard;
}

function TaskRow({ task }: TaskRowProps) {
  const handleClick = () => {
    window.location.href = task.href;
  };

  return (
    <CardRow onClick={handleClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <TaskIcon type={task.type} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {task.title}
            </div>
            <TaskStatusBadge status={task.status} urgency={task.urgency} />
          </div>

          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginBottom: task.note ? "6px" : 0,
            }}
          >
            {task.subtitle}
          </div>

          {task.note && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: task.status === "overdue" ? "var(--portal-error)" : "var(--portal-accent)",
                fontWeight: "var(--portal-font-weight-medium)",
              }}
            >
              {task.note}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Task Group Section
 * ──────────────────────────────────────────────────────────────────────────── */

interface TaskGroupProps {
  title: string;
  tasks: TaskCard[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

function TaskGroup({ title, tasks, collapsible = false, defaultCollapsed = false }: TaskGroupProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--portal-space-5)" }}>
      {collapsible ? (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            width: "100%",
            cursor: "pointer",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              background: "var(--portal-bg-elevated)",
              padding: "2px 8px",
              borderRadius: "var(--portal-radius-full)",
            }}
          >
            {tasks.length}
          </span>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            {isCollapsed ? "▸" : "▾"}
          </span>
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              background: "var(--portal-bg-elevated)",
              padding: "2px 8px",
              borderRadius: "var(--portal-radius-full)",
            }}
          >
            {tasks.length}
          </span>
        </div>
      )}

      {!isCollapsed && (
        <PortalCard variant="elevated" padding="none">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </PortalCard>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyTasks({ animalName }: { animalName: string }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-success-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          You're all caught up!
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          No pending tasks for {animalName}'s journey. We'll notify you when something needs your attention.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "120px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "100px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State
 * ──────────────────────────────────────────────────────────────────────────── */

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-error-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "var(--portal-error)",
          }}
        >
          !
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Unable to load tasks
        </h3>
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
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "var(--portal-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            cursor: "pointer",
            transition: "opacity var(--portal-transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Try Again
        </button>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalTasksPage() {
  const { tasks, loading, error } = usePortalTasks();
  const mockEnabled = isPortalMockEnabled();

  // Get primary animal name for context
  const offspring = mockEnabled ? mockOffspring() : [];
  const primaryAnimal = offspring[0];
  const animalName = primaryAnimal?.offspring?.name || "your puppy";

  const handleRetry = () => {
    window.location.reload();
  };

  // Group tasks by urgency
  const actionRequired = tasks.filter((t) => t.urgency === "action_required");
  const upcoming = tasks.filter((t) => t.urgency === "upcoming");
  const completed = tasks.filter((t) => t.urgency === "completed");

  const actionCount = actionRequired.length;

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <ErrorState error={error} onRetry={handleRetry} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Tasks"
          subtitle={`What needs your attention for ${animalName}`}
          animalContext={animalName}
          status={actionCount > 0 ? "action" : "success"}
          statusLabel={actionCount > 0 ? `${actionCount} need attention` : "All caught up"}
          actionCount={actionCount > 0 ? actionCount : undefined}
          actionLabel={actionCount === 1 ? "task needs attention" : "tasks need attention"}
        />

        {/* Task Groups */}
        {tasks.length === 0 ? (
          <EmptyTasks animalName={animalName} />
        ) : (
          <>
            <TaskGroup title="Action Required" tasks={actionRequired} />
            <TaskGroup title="Upcoming" tasks={upcoming} />
            <TaskGroup
              title="Completed"
              tasks={completed}
              collapsible
              defaultCollapsed={completed.length > 0 && (actionRequired.length > 0 || upcoming.length > 0)}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}

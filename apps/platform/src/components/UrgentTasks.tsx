// apps/platform/src/components/dashboard/UrgentTasks.tsx
import * as React from "react";
import { Button } from "@bhq/ui";

type Task = {
  id: string | number;
  title: string;
  description?: string;
  due?: string | Date;
  priority?: "low" | "medium" | "high";
  kind?: string;
  severity?: "info" | "warning" | "overdue";
};

export default function UrgentTasks({
  tasks,
  onComplete,
}: {
  tasks: Task[];
  onComplete: (id: string | number) => void;
}) {
  if (!tasks?.length) return <div className="p-4 text-sm opacity-70">No urgent tasks</div>;
  return (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Urgent tasks</div>
      <ul className="space-y-2">
        {tasks.map(t => (
          <li key={t.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3">
            <div>
              <div className="text-sm">{t.title}</div>
              <div className="text-xs opacity-70">{t.kind} due {t.due instanceof Date ? t.due.toLocaleDateString() : t.due}</div>
            </div>
            <div className="flex items-center gap-2">
              <SeverityDot level={t.severity ?? "info"} />
              <Button size="sm" onClick={() => onComplete(t.id)}>Done</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeverityDot({ level }: { level: "info" | "warning" | "overdue" }) {
  const c = level === "overdue" ? "bg-red-500" : level === "warning" ? "bg-amber-500" : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />;
}

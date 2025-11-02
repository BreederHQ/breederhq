// packages/ui/src/utils/medicationReminders.ts
import { MedicationProtocol } from "./medications";

function ageInWeeks(dobIso: string, onDateIso: string): number {
  const d0 = new Date(dobIso).getTime();
  const d1 = new Date(onDateIso).getTime();
  return Math.floor((d1 - d0) / (1000 * 60 * 60 * 24 * 7));
}

export type ReminderTask = {
  id: string;
  date: string;           // due date
  kind: "medication";
  protocolId: string;
  litterId: string | number;
  puppyId: string | number;
  label: string;          // "Give Panacur day 2/3"
  sortKey: number;
};

export function generateMedicationTasks({
  protocols,
  puppies,           // [{ id, name, dob, litterId }]
  todayIso,          // generator can be called for a range; start with today
  horizonDays = 14,  // how far ahead to show
}: {
  protocols: MedicationProtocol[];
  puppies: Array<{ id: string | number; name: string; dob: string; litterId: string | number }>;
  todayIso: string;
  horizonDays?: number;
}): ReminderTask[] {
  const tasks: ReminderTask[] = [];
  const start = new Date(todayIso);
  for (let i = 0; i < horizonDays; i++) {
    const dt = new Date(start.getTime() + i * 86400000);
    const currentIso = dt.toISOString().slice(0, 10);
    for (const pup of puppies) {
      const weeks = ageInWeeks(pup.dob, currentIso);
      for (const p of protocols.filter(pp => pp.active)) {
        const first = p.ageTriggerWeeks;
        const repeat = p.repeatWeeks || 0;
        const triggers: number[] = [];
        if (weeks === first) triggers.push(0);
        if (repeat > 0 && weeks > first && (weeks - first) % repeat === 0) triggers.push(0);

        for (const base of triggers) {
          for (let day = 0; day < p.days; day++) {
            const taskDate = new Date(dt.getTime() + day * 86400000).toISOString().slice(0, 10);
            tasks.push({
              id: `med:${p.id}:${pup.id}:${taskDate}`,
              date: taskDate,
              kind: "medication",
              protocolId: p.id,
              litterId: pup.litterId,
              puppyId: pup.id,
              label: `${p.label} day ${day + 1}/${p.days}`,
              sortKey: dt.getTime() + day * 86400000,
            });
          }
        }
      }
    }
  }
  return tasks;
}

import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@bhq/ui";
import { getOverlayRoot } from "@bhq/ui/overlay";

type Props = {
  planId?: number | string;
  onClose(): void;
  onCreate(input: { planId: number; type: string; date: string; note?: string }): Promise<void>;
};

const TYPES = [
  { v: "HORMONE_TEST", label: "Hormone test" },
  { v: "ATTEMPT", label: "Breeding attempt" },
  { v: "PREG_CHECK", label: "Pregnancy check" },
  { v: "WHELPED", label: "Whelped" },
  { v: "WEANED", label: "Weaned" },
];

export default function EventQuickAdd({ planId, onClose, onCreate }: Props) {
  const [type, setType] = React.useState(TYPES[0].v);
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const root = getOverlayRoot();

  const canSave = !!planId && !!type && !!date;

  const doSave = async () => {
    if (!canSave) return;
    try {
      setWorking(true);
      await onCreate({ planId: Number(planId), type, date, note: note.trim() || undefined });
      onClose();
    } finally {
      setWorking(false);
    }
  };

  if (!root) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={() => !working && onClose()} />
      <div className="relative w-[420px] max-w-[94vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
        <div className="text-base font-semibold mb-2">Quick add event</div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <div className="text-xs text-secondary mb-1">Type</div>
            <select
              className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-secondary mb-1">Date</div>
            <Input type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
          </div>
          <div>
            <div className="text-xs text-secondary mb-1">Note</div>
            <Input value={note} onChange={(e) => setNote(e.currentTarget.value)} placeholder="Optional note" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={working}>Cancel</Button>
            <Button onClick={doSave} disabled={!canSave || working}>{working ? "Saving…" : "Add event"}</Button>
          </div>
        </div>
      </div>
    </div>,
    root
  );
}

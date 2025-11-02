// apps/breeding/src/components/SettingsProtocols.tsx
import * as React from "react";
import { SectionCard, Button, Input } from "..";
import { loadSettings, saveSettings, type BreederSettings } from "../../utils/breederSettings";

export default function SettingsProtocols() {
  const [s, setS] = React.useState<BreederSettings>(() => loadSettings());
  const [dirty, setDirty] = React.useState(false);

  function update<K extends keyof BreederSettings>(k: K, v: BreederSettings[K]) {
    setS(prev => ({ ...prev, [k]: v })); setDirty(true);
  }

  function addProtocol() {
    const id = crypto.randomUUID();
    update("protocols", [
      ...s.protocols,
      { id, label: "New Protocol", medicationName: "", doseRateMgPerKg: 50, concentrationMgPerMl: 100, days: 3, ageTriggerWeeks: 4, repeatWeeks: null, active: true }
    ]);
  }
  function updateProtocol(i: number, patch: Partial<BreederSettings["protocols"][number]>) {
    const next = [...s.protocols]; next[i] = { ...next[i], ...patch }; update("protocols", next);
  }
  function removeProtocol(i: number) {
    const next = [...s.protocols]; next.splice(i, 1); update("protocols", next);
  }
  function save() { saveSettings(s); setDirty(false); }

  return (
    <SectionCard title="Medication Protocols">
      <div className="text-sm opacity-70 mb-3">Define dose rules and schedules</div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm">Units</label>
        <select
          className="border rounded px-2 py-1"
          value={s.unitSystem}
          onChange={e => update("unitSystem", e.target.value as any)}
        >
          <option value="imperial">Imperial (lb)</option>
          <option value="metric">Metric (kg)</option>
        </select>
        <Button onClick={addProtocol}>Add Protocol</Button>
        <div className="ml-auto">{dirty ? <span className="text-orange-600 text-sm">Unsaved</span> : null}</div>
        <Button onClick={save} variant="primary">Save</Button>
      </div>

      <div className="space-y-3">
        {s.protocols.map((p, i) => (
          <div key={p.id} className="grid grid-cols-12 gap-2 p-2 rounded border">
            <Input className="col-span-3" placeholder="Label" value={p.label} onChange={e => updateProtocol(i, { label: e.target.value })} />
            <Input className="col-span-3" placeholder="Medication" value={p.medicationName} onChange={e => updateProtocol(i, { medicationName: e.target.value })} />
            <Input className="col-span-2" type="number" step="0.1" placeholder="Dose mg/kg" value={p.doseRateMgPerKg} onChange={e => updateProtocol(i, { doseRateMgPerKg: Number(e.target.value) })} />
            <Input className="col-span-2" type="number" step="0.1" placeholder="Conc mg/mL" value={p.concentrationMgPerMl} onChange={e => updateProtocol(i, { concentrationMgPerMl: Number(e.target.value) })} />
            <Input className="col-span-1" type="number" placeholder="Days" value={p.days} onChange={e => updateProtocol(i, { days: Number(e.target.value) })} />
            <Input className="col-span-1" type="number" placeholder="Age wk" value={p.ageTriggerWeeks} onChange={e => updateProtocol(i, { ageTriggerWeeks: Number(e.target.value) })} />

            <Input className="col-span-2" type="number" placeholder="Repeat wk (opt)" value={p.repeatWeeks ?? ""} onChange={e => updateProtocol(i, { repeatWeeks: e.target.value ? Number(e.target.value) : null })} />
            <select className="col-span-1 border rounded px-2" value={p.active ? "1" : "0"} onChange={e => updateProtocol(i, { active: e.target.value === "1" })}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <Button className="col-span-1" variant="outline" onClick={() => removeProtocol(i)}>Delete</Button>
            <Input className="col-span-12" placeholder="Notes" value={p.notes || ""} onChange={e => updateProtocol(i, { notes: e.target.value })} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

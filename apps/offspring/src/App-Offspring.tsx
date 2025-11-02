import React, { useEffect, useMemo, useState } from "react";

/* ============================================================
   Minimal UI primitives (keep it local so this file is drop-in)
   ============================================================ */
const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "primary"; size?: "sm" | "md" | "icon" }> =
({ className = "", children, variant = "default", size = "md", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md border text-sm transition-colors",
      variant === "default" && "bg-black text-white border-black hover:bg-black/90",
      variant === "primary" && "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
      variant === "outline" && "bg-transparent text-black dark:text-white border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800",
      variant === "ghost" && "bg-transparent text-black dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800",
      size === "sm" && "px-2 py-1",
      size === "md" && "px-3 py-2",
      size === "icon" && "p-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> =
({ className = "", ...props }) => (
  <input
    className={cn(
      "px-2 py-1 rounded-md border text-sm w-full",
      "bg-white dark:bg-neutral-900",
      "text-gray-900 dark:text-gray-100",
      "border-gray-300 dark:border-neutral-700",
      "placeholder-gray-400 dark:placeholder-gray-500",
      "focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    {...props}
  />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> =
({ className = "", ...props }) => (
  <textarea
    className={cn(
      "px-2 py-1 rounded-md border text-sm w-full",
      "bg-white dark:bg-neutral-900",
      "text-gray-900 dark:text-gray-100",
      "border-gray-300 dark:border-neutral-700",
      "focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    {...props}
  />
);

const Card: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; className?: string }> =
({ title, subtitle, children, className = "" }) => (
  <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-4 shadow-sm", className)}>
    {(title || subtitle) && (
      <div className="mb-3">
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

/* ============================================================
   Domain types and helpers (local, API-ready later)
   ============================================================ */
type UnitSystem = "imperial" | "metric";
const lbToKg = (lb: number) => lb * 0.45359237;

type MedicationProtocol = {
  id: string;
  label: string;
  medicationName: string;
  doseRateMgPerKg: number;    // e.g., 50 mg/kg
  concentrationMgPerMl: number; // e.g., 100 mg/mL
  days: number;               // consecutive days
  ageTriggerWeeks: number;    // first dose week
  repeatWeeks?: number | null;
  notes?: string;
  active?: boolean;
};

type MedAdminRecord = {
  puppyId: string;
  protocolId: string;
  date: string;      // ISO
  weight: number;    // in current unit system
  unitSystem: UnitSystem;
  doseMl: number;
  notes?: string;
};

type WeightEntry = { date: string; value: number }; // in current unit
type Puppy = {
  id: string;
  name: string;
  sex: "Male" | "Female";
  dob: string;           // ISO
  ribbon?: string;
  colorMarkings?: string;
  notes?: string;
  weights: WeightEntry[];
};
type Litter = {
  id: string;
  name: string;
  damId?: string | number | null;
  sireId?: string | number | null;
  dob: string; // litter DOB
  notes?: string;
  puppies: Puppy[];
};

type ReminderTask = {
  id: string;
  date: string;          // ISO
  kind: "medication";
  protocolId: string;
  litterId: string;
  puppyId: string;
  label: string;         // "Panacur day 2/3"
};

/* ============================================================
   Local storage settings and state
   ============================================================ */
type BreederSettings = {
  unitSystem: UnitSystem;
  protocols: MedicationProtocol[];
  logoUrl?: string | null;
};

const SETTINGS_KEY = "bhq_offspring_settings_v1";
const LITTERS_KEY  = "bhq_offspring_litters_v1";
const MEDLOG_KEY   = "bhq_offspring_medlog_v1";

function loadSettings(): BreederSettings {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || ""); } catch {}
  // sensible defaults: Panacur 50 mg/kg conc. 100 mg/mL 3 days at 4 weeks
  return {
    unitSystem: "imperial",
    protocols: [{
      id: "proto-panacur-4wk",
      label: "Panacur 4-week",
      medicationName: "Fenbendazole (Panacur)",
      doseRateMgPerKg: 50,
      concentrationMgPerMl: 100,
      days: 3,
      ageTriggerWeeks: 4,
      repeatWeeks: null,
      notes: "Standard puppy deworm at 4 weeks",
      active: true
    }],
    logoUrl: null,
  };
}
function saveSettings(s: BreederSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadLitters(): Litter[] {
  try { return JSON.parse(localStorage.getItem(LITTERS_KEY) || ""); } catch {}
  return [];
}
function saveLitters(list: Litter[]) {
  localStorage.setItem(LITTERS_KEY, JSON.stringify(list));
}

function loadMedLog(): MedAdminRecord[] {
  try { return JSON.parse(localStorage.getItem(MEDLOG_KEY) || ""); } catch {}
  return [];
}
function saveMedLog(list: MedAdminRecord[]) {
  localStorage.setItem(MEDLOG_KEY, JSON.stringify(list));
}

/* ============================================================
   Core logic: dosing, age, reminders, weight color
   ============================================================ */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function ageInWeeks(dobIso: string, onDateIso: string): number {
  const d0 = new Date(dobIso).getTime();
  const d1 = new Date(onDateIso).getTime();
  return Math.floor((d1 - d0) / (1000 * 60 * 60 * 24 * 7));
}

function doseMlFromWeight(params: {
  weight: number;                // lb if imperial, kg if metric
  unitSystem: UnitSystem;        // "imperial" or "metric"
  doseRateMgPerKg: number;       // e.g., 50 mg/kg
  concentrationMgPerMl: number;  // e.g., 100 mg/mL
}): number {
  const kg = params.unitSystem === "imperial" ? lbToKg(params.weight) : params.weight;
  const doseMg = kg * params.doseRateMgPerKg;
  return doseMg / Math.max(1e-9, params.concentrationMgPerMl);
}

function weightTrendColor(current?: WeightEntry, previous?: WeightEntry) {
  if (!current || !previous) return "inherit";
  if (current.value < previous.value) return "#dc2626"; // red-600
  if (current.value === previous.value) return "#d97706"; // amber-600
  return "#16a34a"; // green-600
}

function generateMedicationTasks(args: {
  protocols: MedicationProtocol[];
  litters: Litter[];
  startIso?: string;
  daysAhead?: number;
}): ReminderTask[] {
  const { protocols, litters } = args;
  const start = args.startIso || todayIso();
  const days = args.daysAhead ?? 14;

  const out: ReminderTask[] = [];
  const startTs = new Date(start).getTime();

  for (let i = 0; i < days; i++) {
    const dateIso = new Date(startTs + i * 86400000).toISOString().slice(0, 10);
    for (const L of litters) {
      for (const P of L.puppies) {
        const w = ageInWeeks(P.dob, dateIso);
        for (const proto of protocols.filter(p => p.active)) {
          const first = proto.ageTriggerWeeks;
          const repeat = proto.repeatWeeks || 0;
          const isTriggerWeek = w === first || (repeat > 0 && w > first && (w - first) % repeat === 0);
          if (!isTriggerWeek) continue;

          // create a task for each day of the run
          for (let day = 0; day < proto.days; day++) {
            const dIso = new Date(new Date(dateIso).getTime() + day * 86400000).toISOString().slice(0, 10);
            out.push({
              id: `med:${proto.id}:${P.id}:${dIso}`,
              date: dIso,
              kind: "medication",
              protocolId: proto.id,
              litterId: L.id,
              puppyId: P.id,
              label: `${proto.label} day ${day + 1}/${proto.days}`,
            });
          }
        }
      }
    }
  }
  return out;
}

/* ============================================================
   Settings editor (units + protocols)
   ============================================================ */
function SettingsProtocols({
  value, onChange,
}: {
  value: BreederSettings;
  onChange: (v: BreederSettings) => void;
}) {
  function up<K extends keyof BreederSettings>(k: K, v: BreederSettings[K]) {
    onChange({ ...value, [k]: v });
  }
  function addProtocol() {
    const id = crypto.randomUUID();
    up("protocols", [
      ...value.protocols,
      { id, label: "New Protocol", medicationName: "", doseRateMgPerKg: 50, concentrationMgPerMl: 100, days: 3, ageTriggerWeeks: 4, repeatWeeks: null, active: true }
    ]);
  }
  function patchProtocol(i: number, patch: Partial<MedicationProtocol>) {
    const next = [...value.protocols]; next[i] = { ...next[i], ...patch };
    up("protocols", next);
  }
  function removeProtocol(i: number) {
    const next = [...value.protocols]; next.splice(i, 1);
    up("protocols", next);
  }

  return (
    <Card title="Settings" subtitle="Units and medication protocols">
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm">Units</label>
        <select
          className="border rounded px-2 py-1"
          value={value.unitSystem}
          onChange={e => up("unitSystem", e.target.value as UnitSystem)}
        >
          <option value="imperial">Imperial (lb)</option>
          <option value="metric">Metric (kg)</option>
        </select>
        <div className="ml-auto" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Medication Protocols</h4>
        <Button variant="outline" onClick={addProtocol}>Add Protocol</Button>
      </div>

      <div className="space-y-3">
        {value.protocols.map((p, i) => (
          <div key={p.id} className="grid grid-cols-12 gap-2 p-2 rounded border">
            <Input className="col-span-3" placeholder="Label" value={p.label} onChange={e => patchProtocol(i, { label: e.target.value })} />
            <Input className="col-span-3" placeholder="Medication" value={p.medicationName} onChange={e => patchProtocol(i, { medicationName: e.target.value })} />
            <Input className="col-span-2" type="number" step="0.1" placeholder="Dose mg/kg" value={p.doseRateMgPerKg} onChange={e => patchProtocol(i, { doseRateMgPerKg: Number(e.target.value) })} />
            <Input className="col-span-2" type="number" step="0.1" placeholder="Conc mg/mL" value={p.concentrationMgPerMl} onChange={e => patchProtocol(i, { concentrationMgPerMl: Number(e.target.value) })} />
            <Input className="col-span-1" type="number" placeholder="Days" value={p.days} onChange={e => patchProtocol(i, { days: Number(e.target.value) })} />
            <Input className="col-span-1" type="number" placeholder="Age wk" value={p.ageTriggerWeeks} onChange={e => patchProtocol(i, { ageTriggerWeeks: Number(e.target.value) })} />

            <Input className="col-span-2" type="number" placeholder="Repeat wk (opt)" value={p.repeatWeeks ?? ""} onChange={e => patchProtocol(i, { repeatWeeks: e.target.value ? Number(e.target.value) : null })} />
            <select className="col-span-1 border rounded px-2" value={p.active ? "1" : "0"} onChange={e => patchProtocol(i, { active: e.target.value === "1" })}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <Button className="col-span-1" variant="outline" onClick={() => removeProtocol(i)}>Delete</Button>
            <Input className="col-span-12" placeholder="Notes" value={p.notes || ""} onChange={e => patchProtocol(i, { notes: e.target.value })} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   Puppy row: weights + quick doser + notes
   ============================================================ */
function PuppyRow({
  puppy, unitSystem, protocols, onSaveWeight, onDose, onPatch,
}: {
  puppy: Puppy;
  unitSystem: UnitSystem;
  protocols: MedicationProtocol[];
  onSaveWeight: (puppyId: string, value: number) => void;
  onDose: (puppyId: string, protocolId: string, doseMl: number, weight: number) => void;
  onPatch: (puppyId: string, patch: Partial<Puppy>) => void;
}) {
  const [w, setW] = useState<number>(() => puppy.weights.at(-1)?.value ?? 0);
  const [protoId, setProtoId] = useState<string>(protocols[0]?.id ?? "");
  const proto = protocols.find(p => p.id === protoId);

  const prev = puppy.weights.length > 1 ? puppy.weights[puppy.weights.length - 2] : undefined;
  const curr = puppy.weights.at(-1);
  const color = weightTrendColor(curr, prev);

  const doseMl = useMemo(() => {
    if (!proto) return 0;
    return doseMlFromWeight({
      weight: w,
      unitSystem,
      doseRateMgPerKg: proto.doseRateMgPerKg,
      concentrationMgPerMl: proto.concentrationMgPerMl
    });
  }, [w, unitSystem, proto]);

  return (
    <tr className="border-b">
      <td className="px-2 py-2">{puppy.name}</td>
      <td className="px-2 py-2 text-center">{puppy.sex}</td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          <Input style={{ maxWidth: 100 }} type="number" step="0.01" value={w} onChange={e => setW(Number(e.target.value || 0))} />
          <Button variant="outline" onClick={() => onSaveWeight(puppy.id, w)}>Save</Button>
          <span className="text-xs text-gray-500">{unitSystem === "imperial" ? "lb" : "kg"}</span>
        </div>
        {curr && (
          <div className="text-xs mt-1">
            <span>Last: </span>
            <span style={{ color }}>{curr.value.toFixed(2)} {unitSystem === "imperial" ? "lb" : "kg"}</span>
          </div>
        )}
      </td>
      <td className="px-2 py-2">
        <div className="grid grid-cols-12 gap-2 items-center">
          <select className="col-span-6 border rounded px-2 py-1" value={protoId} onChange={e => setProtoId(e.target.value)}>
            {protocols.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <Input className="col-span-4" readOnly value={Number.isFinite(doseMl) ? doseMl.toFixed(2) : ""} />
          <div className="col-span-2 text-right">
            <Button onClick={() => proto && onDose(puppy.id, proto.id, doseMl, w)}>Enter</Button>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <Textarea rows={2} placeholder="Notes" value={puppy.notes || ""} onChange={e => onPatch(puppy.id, { notes: e.target.value })} />
      </td>
    </tr>
  );
}

/* ============================================================
   Daily Tasks panel (medication tasks)
   ============================================================ */
function DailyTasks({
  settings, litters, medLog, onQuickOpenPuppy,
}: {
  settings: BreederSettings;
  litters: Litter[];
  medLog: MedAdminRecord[];
  onQuickOpenPuppy: (litterId: string, puppyId: string) => void;
}) {
  const tasks = useMemo(() => generateMedicationTasks({
    protocols: settings.protocols,
    litters,
    startIso: todayIso(),
    daysAhead: 7
  }), [settings.protocols, litters]);

  const grouped = useMemo(() => {
    const byDate = new Map<string, ReminderTask[]>();
    for (const t of tasks) {
      const arr = byDate.get(t.date) ?? [];
      arr.push(t);
      byDate.set(t.date, arr);
    }
    return Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);

  return (
    <Card title="Daily Tasks" subtitle="Auto-generated medication reminders (7 days)">
      {grouped.length === 0 && <div className="text-sm text-gray-500">No tasks in the next 7 days.</div>}
      <div className="space-y-3">
        {grouped.map(([date, list]) => (
          <div key={date}>
            <div className="text-sm font-medium mb-1">{date}</div>
            <ul className="space-y-1">
              {list.map(t => {
                const L = litters.find(x => x.id === t.litterId);
                const P = L?.puppies.find(p => p.id === t.puppyId);
                const proto = settings.protocols.find(p => p.id === t.protocolId);
                return (
                  <li key={t.id} className="text-sm flex items-center justify-between">
                    <span>
                      {t.label} — {L?.name ?? "Litter"} / {P?.name ?? "Puppy"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{proto?.medicationName}</span>
                      <Button variant="outline" size="sm" onClick={() => onQuickOpenPuppy(t.litterId, t.puppyId)}>Open</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   Offspring App (litters + puppies + settings + tasks)
   ============================================================ */
function OffspringApp() {
  // favicon like other modules
  useEffect(() => {
    const href = "/favicon.png";
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = href;
  }, []);

  const [settings, setSettings] = useState<BreederSettings>(() => loadSettings());
  const [litters, setLitters] = useState<Litter[]>(() => loadLitters());
  const [medLog, setMedLog]       = useState<MedAdminRecord[]>(() => loadMedLog());

  const [tab, setTab] = useState<"tasks" | "litters" | "settings">("tasks");
  const [activeLitterId, setActiveLitterId] = useState<string | null>(litters[0]?.id ?? null);
  const activeLitter = litters.find(L => L.id === activeLitterId) || null;

  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveLitters(litters); }, [litters]);
  useEffect(() => { saveMedLog(medLog); }, [medLog]);

  function addLitter() {
    const id = crypto.randomUUID();
    const name = prompt("Litter name (theme or code)?") || `Litter ${new Date().toISOString().slice(0,10)}`;
    const dob  = prompt("Litter DOB (YYYY-MM-DD)?") || todayIso();
    const L: Litter = { id, name, dob, puppies: [] };
    setLitters([L, ...litters]);
    setActiveLitterId(id);
    setTab("litters");
  }
  function addPuppy() {
    if (!activeLitter) return;
    const pid = crypto.randomUUID();
    const name = prompt("Puppy name?") || `Puppy ${activeLitter.puppies.length + 1}`;
    const sex = (prompt("Sex (M/F)?") || "F").toUpperCase().startsWith("M") ? "Male" : "Female";
    const dob = activeLitter.dob;
    const p: Puppy = { id: pid, name, sex, dob, weights: [] };
    const next = litters.map(L => L.id === activeLitter.id ? { ...L, puppies: [...L.puppies, p] } : L);
    setLitters(next);
  }

  function saveWeight(puppyId: string, value: number) {
    if (!activeLitter) return;
    const dIso = todayIso();
    const next = litters.map(L => {
      if (L.id !== activeLitter.id) return L;
      return {
        ...L,
        puppies: L.puppies.map(P => {
          if (P.id !== puppyId) return P;
          const existing = P.weights.some(w => w.date === dIso);
          const weights = existing
            ? P.weights.map(w => w.date === dIso ? { ...w, value } : w)
            : [...P.weights, { date: dIso, value }].sort((a, b) => a.date.localeCompare(b.date));
          return { ...P, weights };
        })
      };
    });
    setLitters(next);
  }

  function dose(puppyId: string, protocolId: string, doseMl: number, weight: number) {
    if (!activeLitter) return;
    const rec: MedAdminRecord = {
      puppyId, protocolId, date: todayIso(), weight, unitSystem: settings.unitSystem, doseMl
    };
    setMedLog([rec, ...medLog]);
    alert("Medication entry saved.");
  }

  function patchPuppy(puppyId: string, patch: Partial<Puppy>) {
    if (!activeLitter) return;
    const next = litters.map(L => {
      if (L.id !== activeLitter.id) return L;
      return {
        ...L,
        puppies: L.puppies.map(P => P.id === puppyId ? { ...P, ...patch } : P)
      };
    });
    setLitters(next);
  }

  function quickOpenPuppy(litterId: string, puppyId: string) {
    setTab("litters");
    setActiveLitterId(litterId);
    // focus can be added later; for now we just switch context
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black p-6 space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Button variant={tab === "tasks" ? "primary" : "outline"} onClick={() => setTab("tasks")}>Daily Tasks</Button>
        <Button variant={tab === "litters" ? "primary" : "outline"} onClick={() => setTab("litters")}>Litters & Puppies</Button>
        <Button variant={tab === "settings" ? "primary" : "outline"} onClick={() => setTab("settings")}>Settings</Button>
        <div className="ml-auto flex items-center gap-2">
          {tab === "litters" && <Button onClick={addLitter}>Add Litter</Button>}
        </div>
      </div>

      {tab === "tasks" && (
        <DailyTasks
          settings={settings}
          litters={litters}
          medLog={medLog}
          onQuickOpenPuppy={quickOpenPuppy}
        />
      )}

      {tab === "litters" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Card title="Litters" subtitle="Select to manage puppies">
              <ul className="space-y-1">
                {litters.map(L => (
                  <li key={L.id}>
                    <Button
                      variant={activeLitterId === L.id ? "primary" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setActiveLitterId(L.id)}
                    >
                      {L.name} <span className="ml-2 text-xs opacity-70">({L.puppies.length})</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="col-span-9 space-y-4">
            {activeLitter ? (
              <>
                <Card title={`Litter: ${activeLitter.name}`} subtitle={`DOB: ${activeLitter.dob}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Button variant="outline" onClick={addPuppy}>Add Puppy</Button>
                    <div className="ml-auto text-sm text-gray-500">Unit: {settings.unitSystem === "imperial" ? "lb" : "kg"}</div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed md:table-auto border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left">
                          <th className="px-2 py-2">Puppy</th>
                          <th className="px-2 py-2">Sex</th>
                          <th className="px-2 py-2">Weight</th>
                          <th className="px-2 py-2">Dose from Weight</th>
                          <th className="px-2 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLitter.puppies.map(P => (
                          <PuppyRow
                            key={P.id}
                            puppy={P}
                            unitSystem={settings.unitSystem}
                            protocols={settings.protocols.filter(p => p.active)}
                            onSaveWeight={saveWeight}
                            onDose={dose}
                            onPatch={patchPuppy}
                          />
                        ))}
                        {activeLitter.puppies.length === 0 && (
                          <tr><td className="px-2 py-6 text-sm text-gray-500" colSpan={5}>No puppies yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card title="Medication Log" subtitle="Recent entries">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed md:table-auto border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left">
                          <th className="px-2 py-2">Date</th>
                          <th className="px-2 py-2">Puppy</th>
                          <th className="px-2 py-2">Protocol</th>
                          <th className="px-2 py-2">Dose (mL)</th>
                          <th className="px-2 py-2">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medLog.slice(0, 20).map((r, i) => {
                          const P = activeLitter.puppies.find(p => p.id === r.puppyId);
                          const proto = settings.protocols.find(p => p.id === r.protocolId);
                          return (
                            <tr key={i} className="border-b">
                              <td className="px-2 py-2">{r.date}</td>
                              <td className="px-2 py-2">{P?.name ?? r.puppyId}</td>
                              <td className="px-2 py-2">{proto?.label ?? r.protocolId}</td>
                              <td className="px-2 py-2">{r.doseMl.toFixed(2)}</td>
                              <td className="px-2 py-2">{r.weight} {r.unitSystem === "imperial" ? "lb" : "kg"}</td>
                            </tr>
                          );
                        })}
                        {medLog.length === 0 && <tr><td className="px-2 py-6 text-sm text-gray-500" colSpan={5}>No entries</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card title="No litter selected">
                <p className="text-sm text-gray-500">Create a litter, then add puppies to begin tracking weights, doses, and tasks.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <SettingsProtocols
          value={settings}
          onChange={setSettings}
        />
      )}
    </div>
  );
}

/* ============================================================
   Export default for mock host
   ============================================================ */
export default function OffspringMock() {
  return <OffspringApp />;
}

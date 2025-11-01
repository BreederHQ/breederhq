import * as React from "react";
import { createPortal } from "react-dom";
import { useCyclePlanner, type Species as PlanSpecies, type ExpectedDates } from "@bhq/ui/hooks";
// Swap these imports to your actual UI primitives:
import { Button, Input, Select, Badge, Tabs, TabList, Tab, TabPanel, SectionCard } from "@bhq/ui";
import BreedingCalendar from "./BreedingCalendar"; // your existing calendar

type Sex = "Male" | "Female";
type Species = "Dog" | "Cat" | "Horse";

export type Animal = {
  id: number;
  name: string;
  sex: Sex;
  species: Species;
  breed?: string;
  owner?: string;
  repro?: { kind: "heat_start" | "ovulation" | "insemination" | "whelp"; date: string }[];
  last_heat?: string | null;
};

export type PlanStatus = "Planning" | "Active" | "Completed" | "Archived";

export type Plan = {
  id: number;
  status: PlanStatus;
  species: Species;
  damId?: number | null;
  sireId?: number | null;

  // unchanged key for cycle lock
  lockedCycleStart?: string | null;

  // computed
  expected?: ExpectedDates | null;

  // Actuals (renamed per spec)
  breeding_actual?: string | null;
  whelped_actual?: string | null;
  weaned_actual?: string | null;

  /** placementStartDateActual replaces homing_started_actual */
  placementStartDateActual?: string | null;

  /** placementCompletedDateActual replaces completed_actual / actualHomingExtendedEnds */
  placementCompletedDateActual?: string | null;

  // Deposits (snapshot)
  deposits_count?: number;
  deposits_committed?: number;
  deposits_paid?: number;
};

function canComplete(p: Plan): boolean {
  return Boolean(
    p.breeding_actual &&
      p.whelped_actual &&
      p.weaned_actual &&
      p.placementStartDateActual &&
      p.placementCompletedDateActual
  );
}

export function PlanDrawer(props: {
  plan: Plan;
  animals: Animal[];
  onClose: () => void;
  onSave: (p: Plan) => void;
}) {
  const [plan, setPlan] = React.useState<Plan>(props.plan);
  const dams = React.useMemo(() => props.animals.filter(a => a.species === plan.species && a.sex === "Female"), [props.animals, plan.species]);
  const sires = React.useMemo(() => props.animals.filter(a => a.species === plan.species && a.sex === "Male"), [props.animals, plan.species]);
  const dam = React.useMemo(() => props.animals.find(a => a.id === plan.damId) || null, [props.animals, plan.damId]);
  const sire = React.useMemo(() => props.animals.find(a => a.id === plan.sireId) || null, [props.animals, plan.sireId]);

  const { projectedCycles, computeFromLocked } = useCyclePlanner({
    species: plan.species as PlanSpecies,
    reproAsc: dam?.repro ?? [],
    lastActualHeatStart: dam?.last_heat ?? null,
    futureCount: 12,
  });

  const [pendingCycle, setPendingCycle] = React.useState<string | null>(plan.lockedCycleStart ?? null);
  const overlayRoot = document.body; // replace with your overlay root if you have one

  function lockCycle() {
    if (!pendingCycle) return;
    const expected = computeFromLocked(pendingCycle);
    setPlan(p => ({ ...p, lockedCycleStart: pendingCycle, expected }));
  }
  function unlockCycle() {
    setPlan(p => ({ ...p, lockedCycleStart: null, expected: null }));
    setPendingCycle(null);
  }
  function save() { props.onSave(plan); }

  const completeDisabled = !canComplete(plan);

  // Helper to read expected placement dates with legacy fallback
  const placementStartExpected =
    plan.expected?.placement_start_expected ??
    plan.expected?.gohome_expected ?? // legacy alias
    "";

  const placementCompletedExpected =
    plan.expected?.placement_completed_expected ??
    plan.expected?.gohome_extended_end_expected ?? // legacy alias
    "";

  const content = (
    <div className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-[880px] max-w-[90vw] bg-background border-l p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Breeding Plan</h2>
            <Badge>{plan.status}</Badge>
            <Badge variant="secondary">{plan.species}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={props.onClose}>Close</Button>
            <Button disabled={completeDisabled} onClick={() => setPlan(p => ({ ...p, status: "Completed" }))}>
              Mark Completed
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="dates">Dates</Tab>
            <Tab value="finance">Finance</Tab>
            <Tab value="offspring">Offspring</Tab>
            <Tab value="audit">Audit</Tab>
          </TabList>

          <TabPanel value="overview" className="mt-4 space-y-4">
            <SectionCard title="Parents">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Dam</label>
                  <Select
                    value={plan.damId ?? ""}
                    placeholder="Select Dam"
                    disabled={!dams.length}
                    items={dams.map(d => ({ value: d.id, label: `${d.name} — ${d.breed ?? ""}` }))}
                    onValueChange={(v: any) => {
                      const nextDam = Number(v);
                      if (plan.lockedCycleStart) unlockCycle();
                      setPlan(p => ({ ...p, damId: nextDam }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Sire</label>
                  <Select
                    value={plan.sireId ?? ""}
                    placeholder="Select Sire"
                    disabled={!sires.length}
                    items={sires.map(s => ({ value: s.id, label: `${s.name} — ${s.breed ?? ""}` }))}
                    onValueChange={(v: any) => setPlan(p => ({ ...p, sireId: Number(v) }))}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Breeding Cycle Selection">
              <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <label className="block text-sm mb-1">Projected cycles</label>
                  <Select
                    value={pendingCycle ?? ""}
                    placeholder={dam ? "Select a projected cycle start" : "Select a Dam to view cycles"}
                    disabled={!dam}
                    items={(dam ? projectedCycles : []).map(d => ({ value: d, label: d }))}
                    onValueChange={(v: any) => setPendingCycle(String(v))}
                  />
                </div>
                {!plan.lockedCycleStart ? (
                  <Button disabled={!pendingCycle} onClick={lockCycle}>Lock Cycle</Button>
                ) : (
                  <Button variant="outline" onClick={unlockCycle}>Unlock</Button>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Mini Timeline">
              {plan.expected ? (
                <BreedingCalendar
                  expected={plan.expected}
                  actual={{
                    breeding: plan.breeding_actual ?? null,
                    whelped: plan.whelped_actual ?? null,
                    weaned: plan.weaned_actual ?? null,
                    // map new placement actuals into calendar’s existing prop names
                    homingStarted: plan.placementStartDateActual ?? null,
                    completed: plan.placementCompletedDateActual ?? null,
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">Lock a cycle to generate the forecast and timeline.</div>
              )}
            </SectionCard>
          </TabPanel>

          <TabPanel value="dates" className="mt-4 space-y-4">
            <SectionCard title="Expected Dates (system)">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Breeding (Expected)" value={plan.expected?.breed_expected ?? ""} readOnly />
                <Input label="Birth (Expected)" value={plan.expected?.birth_expected ?? ""} readOnly />
                <Input label="Placement (Expected)" value={placementStartExpected} readOnly />
                <Input label="Placement (Extended) (Expected)" value={placementCompletedExpected} readOnly />
              </div>
            </SectionCard>

            <SectionCard title="Actual Dates (user)">
              <div className="grid grid-cols-3 gap-4">
                {([
                  ["Breeding", "breeding_actual"],
                  ["Whelped", "whelped_actual"],
                  ["Weaned", "weaned_actual"],
                ] as const).map(([label, key]) => (
                  <Input
                    key={key}
                    type="date"
                    label={label}
                    value={(plan as any)[key] ?? ""}
                    disabled={!plan.lockedCycleStart || !plan.damId || !plan.sireId}
                    onChange={e => setPlan(p => ({ ...p, [key]: e.currentTarget.value } as any))}
                  />
                ))}

                <Input
                  type="date"
                  label="Placement Started"
                  value={plan.placementStartDateActual ?? ""}
                  disabled={!plan.lockedCycleStart || !plan.damId || !plan.sireId}
                  onChange={e => setPlan(p => ({ ...p, placementStartDateActual: e.currentTarget.value }))}
                />
                <Input
                  type="date"
                  label="Placement Completed"
                  value={plan.placementCompletedDateActual ?? ""}
                  disabled={!plan.lockedCycleStart || !plan.damId || !plan.sireId}
                  onChange={e => setPlan(p => ({ ...p, placementCompletedDateActual: e.currentTarget.value }))}
                />
              </div>
            </SectionCard>

            <SectionCard title="Full Timeline">
              {plan.expected ? (
                <BreedingCalendar
                  expected={plan.expected}
                  actual={{
                    breeding: plan.breeding_actual ?? null,
                    whelped: plan.whelped_actual ?? null,
                    weaned: plan.weaned_actual ?? null,
                    homingStarted: plan.placementStartDateActual ?? null,
                    completed: plan.placementCompletedDateActual ?? null,
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">Lock a cycle to generate the forecast and timeline.</div>
              )}
            </SectionCard>
          </TabPanel>

          <TabPanel value="finance" className="mt-4">
            <SectionCard title="Deposits">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Total Deposits" value={String(plan.deposits_count ?? 0)} readOnly />
                <Input label="Committed $" value={String(plan.deposits_committed ?? 0)} readOnly />
                <Input label="Paid $" value={String(plan.deposits_paid ?? 0)} readOnly />
              </div>
            </SectionCard>
          </TabPanel>

          <TabPanel value="offspring" className="mt-4">
            <SectionCard title="Offspring">Link litter and show puppies here.</SectionCard>
          </TabPanel>

          <TabPanel value="audit" className="mt-4">
            <SectionCard title="Audit">Audit log goes here.</SectionCard>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );

  return overlayRoot ? createPortal(content, overlayRoot) : content;
}

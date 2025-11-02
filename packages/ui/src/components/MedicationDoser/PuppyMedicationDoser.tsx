// apps/breeding/src/components/PuppyMedicationDoser.tsx
import * as React from "react";
import { Button, Input, SectionCard } from "../../index";
import { doseMlFromWeight } from "../../utils";
import { loadSettings } from "../../utils/breederSettings";


type Puppy = { id: number | string; name: string; latestWeight: number; /* in current unit */ };

export default function PuppyMedicationDoser({ puppy }: { puppy: Puppy }) {
    const s = loadSettings();
    const [protocolId, setProtocolId] = React.useState(s.protocols[0]?.id ?? "");
    const p = s.protocols.find(x => x.id === protocolId);
    const [weight, setWeight] = React.useState<number>(puppy.latestWeight || 0);
    const [doseMl, setDoseMl] = React.useState<number>(0);

    React.useEffect(() => {
        if (!p) return;
        setDoseMl(doseMlFromWeight({
            weight,
            unitSystem: s.unitSystem,
            doseRateMgPerKg: p.doseRateMgPerKg,
            concentrationMgPerMl: p.concentrationMgPerMl
        }));
    }, [weight, p, s.unitSystem]);

    function save() {
        // Append to admin log in your store or API
        // { puppyId: puppy.id, protocolId, date: todayIso, weight, unitSystem: s.unitSystem, doseMl }
        // Keep this minimal here to avoid assumptions. Hook it into your existing persistence.
        alert(`Saved ${doseMl.toFixed(2)} mL for ${puppy.name}`);
    }

    return (
        <SectionCard title="Medication Doser" subtitle="Auto dose from weight">
            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                    <label className="text-sm">Protocol</label>
                    <select className="w-full border rounded px-2 py-1" value={protocolId} onChange={e => setProtocolId(e.target.value)}>
                        {s.protocols.map(pr => <option key={pr.id} value={pr.id}>{pr.label}</option>)}
                    </select>
                </div>
                <div className="col-span-3">
                    <label className="text-sm">Weight ({s.unitSystem === "imperial" ? "lb" : "kg"})</label>
                    <Input type="number" step="0.01" value={weight} onChange={e => setWeight(Number(e.target.value || 0))} />
                </div>
                <div className="col-span-3">
                    <label className="text-sm">Dose (mL)</label>
                    <Input readOnly value={Number.isFinite(doseMl) ? doseMl.toFixed(2) : ""} />
                </div>
                <div className="col-span-2 text-right">
                    <Button onClick={save}>Enter</Button>
                </div>
            </div>
        </SectionCard>
    );
}

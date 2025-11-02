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
        <SectionCard title="Puppy Medication Doser">
            {/* Former subtitle moved into content to match SectionCardProps */}
            <div className="text-sm opacity-70 mb-3">
                Compute liquid dose by weight
            </div>
            {/* content */}
        </SectionCard>
    );
}

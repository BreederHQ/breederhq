import React from "react";
import { Card, Button } from "@bhq/ui";

type CyclePolicy = {
  minDamAgeMonths?: number | null;
  minHeatsBetween?: number | null;
  maxLittersLifetime?: number | null;
  retireRule?: "either" | "age_only" | "litters_only" | null;
};

type Placement = {
  earliestDaysFromBirth?: number | null;
  standardDaysFromBirth?: number | null;
  healthGuaranteeMonths?: number | null;
  depositRequired?: boolean | null;
};

export type ProgramProfileSnapshotProps = {
  profile: {
    kennelName?: string | null;
    website?: string | null;
    species?: string[];                // e.g., ["DOG"]
    travelPolicy?: string;             // e.g., "case_by_case"
    cyclePolicy?: CyclePolicy;
    placement?: Placement;
  };

  // Optional quick-action handlers (omit to hide buttons)
  onEditProfile?: () => void;
  onEditPhases?: () => void;
  onEditExactDates?: () => void;
};

function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-xs text-tertiary">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}

export default function ProgramProfileSnapshot({
  profile,
  onEditProfile,
  onEditPhases,
  onEditExactDates,
}: ProgramProfileSnapshotProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Program Profile snapshot</div>
          <p className="text-xs text-tertiary">
            This summary affects cycle math, dates, and buyer expectations.
          </p>
        </div>

        {(onEditProfile || onEditPhases || onEditExactDates) && (
          <div className="flex items-center gap-2">
            {onEditProfile && (
              <Button size="sm" variant="outline" onClick={onEditProfile}>
                Edit profile
              </Button>
            )}
            {onEditPhases && (
              <Button size="sm" variant="outline" onClick={onEditPhases}>
                Edit phases
              </Button>
            )}
            {onEditExactDates && (
              <Button size="sm" variant="outline" onClick={onEditExactDates}>
                Edit exact dates
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="rounded-md border border-hairline p-3">
          <KeyValue k="Kennel" v={profile.kennelName || "—"} />
          <KeyValue k="Website" v={profile.website || "—"} />
          <KeyValue k="Species" v={(profile.species || []).join(", ") || "—"} />
          <KeyValue k="Travel policy" v={profile.travelPolicy || "—"} />
        </div>

        <div className="rounded-md border border-hairline p-3">
          <div className="text-xs text-tertiary mb-1">Cycle policy</div>
          <KeyValue k="Min dam age (mo)" v={profile.cyclePolicy?.minDamAgeMonths ?? "—"} />
          <KeyValue k="Min heats between" v={profile.cyclePolicy?.minHeatsBetween ?? "—"} />
          <KeyValue k="Max litters lifetime" v={profile.cyclePolicy?.maxLittersLifetime ?? "—"} />
          <KeyValue k="Retire rule" v={profile.cyclePolicy?.retireRule || "either"} />
        </div>

        <div className="rounded-md border border-hairline p-3">
          <div className="text-xs text-tertiary mb-1">Placement</div>
          <KeyValue k="Earliest days from birth" v={profile.placement?.earliestDaysFromBirth ?? "—"} />
          <KeyValue k="Standard days from birth" v={profile.placement?.standardDaysFromBirth ?? "—"} />
          <KeyValue k="Guarantee months" v={profile.placement?.healthGuaranteeMonths ?? "—"} />
          <KeyValue k="Deposit required" v={profile.placement?.depositRequired ? "Yes" : "No"} />
        </div>
      </div>
    </Card>
  );
}

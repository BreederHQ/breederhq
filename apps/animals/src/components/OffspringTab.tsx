// apps/animals/src/components/OffspringTab.tsx
// Offspring tab for animal detail view - shows offspring from the Offspring table grouped by litter

import React, { useEffect, useState, useMemo } from "react";
import { makeApi, type ProducingRecord, type OffspringResult, type OffspringRecord } from "../api";
import { SectionCard } from "@bhq/ui";
import { ChevronDown, ChevronRight } from "lucide-react";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  sex?: string | null;
};

type OffspringGroup = {
  groupId: number | null;
  groupName: string;
  birthDate: string | null;
  offspring: OffspringRecord[];
};

/* ─────────────────────────────────────────────────────────────────────────────
 * SectionTitle Helper
 * ───────────────────────────────────────────────────────────────────────────── */

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Producing Record Section (stats)
 * ───────────────────────────────────────────────────────────────────────────── */

function ProducingRecordStats({ animal, record }: { animal: AnimalRow; record: ProducingRecord }) {
  const roleLabel = (animal.sex || "").toLowerCase().startsWith("m") ? "Sire" : "Dam";

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {record.totalOffspring}
          </div>
          <div className="text-xs text-secondary">Total Offspring</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
            {record.titledOffspring}
          </div>
          <div className="text-xs text-secondary">Titled Offspring</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {record.championOffspring}
          </div>
          <div className="text-xs text-secondary">Champions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {record.grandChampionOffspring}
          </div>
          <div className="text-xs text-secondary">Grand Champions</div>
        </div>
      </div>

      {/* Titled offspring list */}
      {record.titledOffspringList.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-secondary mb-2">
            Titled Offspring ({record.titledOffspringList.length})
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {record.titledOffspringList.map((offspring) => (
              <div
                key={offspring.id}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-medium">
                  {offspring.name || `Animal #${offspring.id}`}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {offspring.titles.map((title, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-xs font-bold text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Producing percentage */}
      {record.totalOffspring > 0 && (
        <div className="text-center pt-2 border-t border-hairline">
          <span className="text-sm text-secondary">
            {roleLabel} of{" "}
            <span className="font-bold text-[hsl(var(--brand-orange))]">
              {((record.titledOffspring / record.totalOffspring) * 100).toFixed(0)}%
            </span>{" "}
            titled offspring
            {record.championOffspring > 0 && (
              <>
                {" "}
                ({((record.championOffspring / record.totalOffspring) * 100).toFixed(0)}% champions)
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Offspring List Item
 * ───────────────────────────────────────────────────────────────────────────── */

function OffspringListItem({ offspring, parentSex }: { offspring: OffspringRecord; parentSex: string }) {
  const sexColor = offspring.sex === "MALE" ? "text-blue-400" : offspring.sex === "FEMALE" ? "text-pink-400" : "text-secondary";
  const sexIcon = offspring.sex === "MALE" ? "♂" : offspring.sex === "FEMALE" ? "♀" : "?";

  // Life state badge
  const lifeStateBadge = offspring.lifeState !== "ALIVE" ? (
    <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
      {offspring.lifeState}
    </span>
  ) : null;

  // Placement state badge
  const placementBadge = offspring.placementState === "PLACED" ? (
    <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
      Placed
    </span>
  ) : offspring.placementState === "RESERVED" ? (
    <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
      Reserved
    </span>
  ) : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
      {/* Collar color indicator */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{
          backgroundColor: offspring.collarColor?.startsWith("#")
            ? offspring.collarColor
            : "var(--color-surface)",
        }}
      >
        {sexIcon}
      </div>

      {/* Name & details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {offspring.name || "Unnamed"}
          </span>
          <span className={`text-xs ${sexColor}`}>{sexIcon}</span>
          {lifeStateBadge}
          {placementBadge}
        </div>
        <div className="text-xs text-secondary truncate">
          {offspring.breed || "Unknown breed"}
          {offspring.birthDate && (
            <> • Born {new Date(offspring.birthDate).toLocaleDateString()}</>
          )}
        </div>
      </div>

      {/* Other parent */}
      {offspring.otherParent && (
        <div className="text-xs text-secondary text-right">
          <div className="opacity-70">
            {parentSex === "FEMALE" ? "Sire" : "Dam"}:
          </div>
          <div className="truncate max-w-[100px]">{offspring.otherParent.name}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Collapsible Litter Group
 * ───────────────────────────────────────────────────────────────────────────── */

function LitterGroup({
  group,
  parentSex,
  defaultExpanded = true,
}: {
  group: OffspringGroup;
  parentSex: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const birthDateStr = group.birthDate
    ? new Date(group.birthDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="border border-hairline rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-secondary">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{group.groupName}</div>
          <div className="text-xs text-secondary">
            {group.offspring.length} offspring
            {birthDateStr && <> • Born {birthDateStr}</>}
          </div>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-hairline p-2 space-y-1">
          {group.offspring.map((offspring) => (
            <OffspringListItem
              key={offspring.id}
              offspring={offspring}
              parentSex={parentSex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function OffspringTab({ animal, mode }: { animal: AnimalRow; mode: "view" | "edit" }) {
  const [record, setRecord] = useState<ProducingRecord | null>(null);
  const [offspringData, setOffspringData] = useState<OffspringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Load producing record and offspring in parallel
        const [recordData, offspringResult] = await Promise.all([
          api.animals.getProducingRecord(animal.id).catch((err: any) => {
            // 404 is expected if no offspring
            if (err?.status === 404) {
              return {
                totalOffspring: 0,
                titledOffspring: 0,
                championOffspring: 0,
                grandChampionOffspring: 0,
                titleCountsByCategory: {},
                titledOffspringList: [],
              } as ProducingRecord;
            }
            throw err;
          }),
          api.animals.lineage.getOffspring(animal.id).catch((err: any) => {
            // 404 is expected if no offspring
            if (err?.status === 404) {
              return {
                animal: { id: animal.id, name: animal.name, sex: animal.sex || "" },
                offspring: [],
              } as OffspringResult;
            }
            throw err;
          }),
        ]);

        if (!cancelled) {
          setRecord(recordData);
          setOffspringData(offspringResult);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load offspring data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [animal.id, animal.name, animal.sex]);

  // Group offspring by litter
  const groupedOffspring = useMemo(() => {
    if (!offspringData?.offspring) return [];

    const groups = new Map<number | null, OffspringGroup>();

    for (const o of offspringData.offspring) {
      const groupId = o.group?.id ?? null;
      const existing = groups.get(groupId);

      if (existing) {
        existing.offspring.push(o);
      } else {
        groups.set(groupId, {
          groupId,
          groupName: o.group?.name || "Ungrouped",
          birthDate: o.group?.birthDate ?? null,
          offspring: [o],
        });
      }
    }

    // Sort groups by birth date (most recent first), ungrouped last
    return Array.from(groups.values()).sort((a, b) => {
      if (a.groupId === null) return 1;
      if (b.groupId === null) return -1;
      if (!a.birthDate && !b.birthDate) return 0;
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime();
    });
  }, [offspringData?.offspring]);

  if (loading) {
    return (
      <div className="p-4 text-center text-secondary text-sm">
        Loading offspring data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const hasOffspring = (offspringData?.offspring?.length ?? 0) > 0;
  const hasProducingRecord = (record?.totalOffspring ?? 0) > 0;

  if (!hasOffspring && !hasProducingRecord) {
    return (
      <div className="space-y-3 p-4">
        <SectionCard title={<SectionTitle icon="👶">Offspring</SectionTitle>}>
          <div className="text-sm text-secondary text-center py-4">
            No offspring recorded for {animal.name}
          </div>
        </SectionCard>
      </div>
    );
  }

  const parentSex = (animal.sex || "").toUpperCase();
  const totalOffspringCount = offspringData?.offspring?.length ?? 0;

  return (
    <div className="space-y-3 p-4">
      {/* Producing Record Stats */}
      {record && record.totalOffspring > 0 && (
        <SectionCard title={<SectionTitle icon="🏆">Producing Record</SectionTitle>}>
          <ProducingRecordStats animal={animal} record={record} />
        </SectionCard>
      )}

      {/* Offspring by Litter */}
      {groupedOffspring.length > 0 && (
        <SectionCard
          title={
            <SectionTitle icon="👶">
              Offspring ({totalOffspringCount} total • {groupedOffspring.length} litter{groupedOffspring.length !== 1 ? "s" : ""})
            </SectionTitle>
          }
        >
          <div className="space-y-2">
            {groupedOffspring.map((group, idx) => (
              <LitterGroup
                key={group.groupId ?? "ungrouped"}
                group={group}
                parentSex={parentSex}
                defaultExpanded={idx === 0} // Only first litter expanded by default
              />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default OffspringTab;

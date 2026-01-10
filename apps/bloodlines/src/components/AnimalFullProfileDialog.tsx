// apps/bloodlines/src/components/AnimalFullProfileDialog.tsx
// Full profile dialog for viewing animal details within the Bloodlines module
// Shows all publicly available data for cross-tenant animals without navigating away

import * as React from "react";
import { Dialog, Button } from "@bhq/ui";

/* ───────────────── Types ───────────────── */

interface AnimalBasic {
  id: number;
  name: string | null;
  registeredName: string | null;
  species: string;
  sex: string | null;
  breed: string | null;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  titlePrefix: string | null;
  titleSuffix: string | null;
  sireId: number | null;
  damId: number | null;
}

interface PedigreeNode extends AnimalBasic {
  sire?: PedigreeNode | null;
  dam?: PedigreeNode | null;
}

type TitleCategory =
  | "CONFORMATION"
  | "OBEDIENCE"
  | "AGILITY"
  | "FIELD"
  | "HERDING"
  | "TRACKING"
  | "RALLY"
  | "PRODUCING"
  | "BREED_SPECIFIC"
  | "PERFORMANCE"
  | "OTHER";

type TitleStatus = "IN_PROGRESS" | "EARNED" | "VERIFIED";

interface TitleDefinition {
  id: number;
  abbreviation: string;
  fullName: string;
  category: TitleCategory;
  organization: string | null;
  prefixTitle: boolean;
  suffixTitle: boolean;
}

interface AnimalTitle {
  id: number;
  animalId: number;
  titleDefinitionId: number;
  titleDefinition: TitleDefinition;
  dateEarned: string | null;
  status: TitleStatus;
  pointsEarned: number | null;
  majorWins: number | null;
}

type CompetitionType =
  | "CONFORMATION_SHOW"
  | "OBEDIENCE_TRIAL"
  | "AGILITY_TRIAL"
  | "FIELD_TRIAL"
  | "HERDING_TRIAL"
  | "TRACKING_TEST"
  | "RALLY_TRIAL"
  | "RACE"
  | "PERFORMANCE_TEST"
  | "BREED_SPECIALTY"
  | "OTHER";

interface CompetitionEntry {
  id: number;
  animalId: number;
  eventName: string;
  eventDate: string;
  location: string | null;
  competitionType: CompetitionType;
  placement: number | null;
  placementLabel: string | null;
  pointsEarned: number | null;
  isMajorWin: boolean;
  qualifyingScore: boolean;
}

interface CompetitionStats {
  totalEntries: number;
  totalPoints: number;
  majorWins: number;
  qualifyingScores: number;
  wins: number;
  placements: number;
  yearsActive: number[];
  byType: Record<string, { entries: number; points: number; wins: number }>;
}

interface ProducingRecord {
  totalOffspring: number;
  titledOffspring: number;
  championOffspring: number;
  grandChampionOffspring: number;
  titleCountsByCategory: Record<string, number>;
  titledOffspringList: Array<{
    id: number;
    name: string | null;
    titles: string[];
  }>;
}

interface COIResult {
  coefficient: number;
  generationsAnalyzed: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  commonAncestors: Array<{
    id: number;
    name: string;
    pathCount: number;
    contribution: number;
  }>;
}

interface AnimalProfileData {
  animal: PedigreeNode;
  titles: AnimalTitle[];
  competitions: CompetitionEntry[];
  competitionStats: CompetitionStats | null;
  producingRecord: ProducingRecord | null;
  coi: COIResult | null;
  pedigree: PedigreeNode | null;
}

/* ───────────────── API Helpers ───────────────── */

function getApiHeaders(): Record<string, string> {
  const tenantId = (window as any).__BHQ_TENANT_ID__;
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  return {
    "Content-Type": "application/json",
    ...(tenantId ? { "x-tenant-id": String(tenantId) } : {}),
    ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
  };
}

async function fetchAnimalProfile(animalId: number): Promise<AnimalProfileData | null> {
  const headers = getApiHeaders();
  const fetchOpts = { credentials: "include" as const, headers };

  // Fetch all data in parallel - some may fail for cross-tenant animals
  const [titlesRes, competitionsRes, statsRes, producingRes, pedigreeRes] = await Promise.allSettled([
    fetch(`/api/v1/animals/${animalId}/titles`, fetchOpts),
    fetch(`/api/v1/animals/${animalId}/competitions?limit=10`, fetchOpts),
    fetch(`/api/v1/animals/${animalId}/competitions/stats`, fetchOpts),
    fetch(`/api/v1/animals/${animalId}/producing-record`, fetchOpts),
    fetch(`/api/v1/animals/${animalId}/pedigree?generations=2`, fetchOpts),
  ]);

  // Parse responses, handling failures gracefully
  let titles: AnimalTitle[] = [];
  let competitions: CompetitionEntry[] = [];
  let competitionStats: CompetitionStats | null = null;
  let producingRecord: ProducingRecord | null = null;
  let coi: COIResult | null = null;
  let pedigree: PedigreeNode | null = null;

  if (titlesRes.status === "fulfilled" && titlesRes.value.ok) {
    titles = await titlesRes.value.json().catch(() => []);
  }

  if (competitionsRes.status === "fulfilled" && competitionsRes.value.ok) {
    competitions = await competitionsRes.value.json().catch(() => []);
  }

  if (statsRes.status === "fulfilled" && statsRes.value.ok) {
    competitionStats = await statsRes.value.json().catch(() => null);
  }

  if (producingRes.status === "fulfilled" && producingRes.value.ok) {
    producingRecord = await producingRes.value.json().catch(() => null);
  }

  if (pedigreeRes.status === "fulfilled" && pedigreeRes.value.ok) {
    const data = await pedigreeRes.value.json().catch(() => null);
    if (data) {
      pedigree = data.pedigree || null;
      coi = data.coi || null;
    }
  }

  return {
    animal: null as any, // Will be set by caller
    titles,
    competitions,
    competitionStats,
    producingRecord,
    coi,
    pedigree,
  };
}

/* ───────────────── Helper Components ───────────────── */

const TITLE_CATEGORY_COLORS: Record<TitleCategory, string> = {
  CONFORMATION: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  OBEDIENCE: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  AGILITY: "bg-green-500/20 text-green-300 border-green-500/30",
  FIELD: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  HERDING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  TRACKING: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  RALLY: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  PRODUCING: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  BREED_SPECIFIC: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  PERFORMANCE: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  OTHER: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  CONFORMATION_SHOW: "Conformation",
  OBEDIENCE_TRIAL: "Obedience",
  AGILITY_TRIAL: "Agility",
  FIELD_TRIAL: "Field",
  HERDING_TRIAL: "Herding",
  TRACKING_TEST: "Tracking",
  RALLY_TRIAL: "Rally",
  RACE: "Race",
  PERFORMANCE_TEST: "Performance",
  BREED_SPECIALTY: "Specialty",
  OTHER: "Other",
};

function TitleBadge({ title }: { title: AnimalTitle }) {
  const category = title.titleDefinition.category;
  const colorClass = TITLE_CATEGORY_COLORS[category] || TITLE_CATEGORY_COLORS.OTHER;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${colorClass}`}
      title={title.titleDefinition.fullName}
    >
      <span className="font-bold">{title.titleDefinition.abbreviation}</span>
      {title.status === "VERIFIED" && (
        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase text-zinc-500 font-medium">{label}</div>
      {subtext && <div className="text-[10px] text-zinc-600">{subtext}</div>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-2">
      {children}
    </h4>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-4 text-sm text-zinc-500">{message}</div>
  );
}

/* ───────────────── Tabs ───────────────── */

type TabId = "overview" | "titles" | "competitions" | "lineage" | "producing";

interface TabProps {
  id: TabId;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function Tab({ label, count, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? "border-amber-500 text-amber-500 bg-zinc-800/50"
          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 text-xs bg-zinc-700 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );
}

/* ───────────────── Tab Content Components ───────────────── */

function OverviewTab({ data, animal }: { data: AnimalProfileData; animal: PedigreeNode }) {
  const isMale = animal.sex === "MALE";
  const isFemale = animal.sex === "FEMALE";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const birthDate = formatDate(animal.dateOfBirth);
  const deathDate = formatDate(animal.dateOfDeath);

  // Calculate age
  let ageText: string | null = null;
  if (animal.dateOfBirth) {
    const birth = new Date(animal.dateOfBirth);
    const end = animal.dateOfDeath ? new Date(animal.dateOfDeath) : new Date();
    const years = Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    ageText = animal.dateOfDeath ? `Lived ${years} years` : `${years} years old`;
  }

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-zinc-500 font-medium">Sex</div>
          <div className={`text-sm font-medium ${isMale ? "text-sky-400" : isFemale ? "text-pink-400" : "text-zinc-400"}`}>
            {isMale ? "♂ Male" : isFemale ? "♀ Female" : "Unknown"}
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-zinc-500 font-medium">Breed</div>
          <div className="text-sm text-white truncate">{animal.breed || "Unknown"}</div>
        </div>
        {birthDate && (
          <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase text-zinc-500 font-medium">Born</div>
            <div className="text-sm text-white">{birthDate}</div>
            {ageText && !animal.dateOfDeath && (
              <div className="text-[10px] text-zinc-500">{ageText}</div>
            )}
          </div>
        )}
        {deathDate && (
          <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase text-zinc-500 font-medium">Died</div>
            <div className="text-sm text-white">{deathDate}</div>
            {ageText && (
              <div className="text-[10px] text-zinc-500">{ageText}</div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {(data.titles.length > 0 || data.competitionStats) && (
        <>
          <SectionHeader>Achievements</SectionHeader>
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Titles" value={data.titles.length} />
            <StatCard label="Shows" value={data.competitionStats?.totalEntries || 0} />
            <StatCard label="Points" value={data.competitionStats?.totalPoints || 0} />
            <StatCard label="Majors" value={data.competitionStats?.majorWins || 0} />
          </div>
        </>
      )}

      {/* Top Titles */}
      {data.titles.length > 0 && (
        <>
          <SectionHeader>Top Titles</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {data.titles.slice(0, 8).map((title) => (
              <TitleBadge key={title.id} title={title} />
            ))}
            {data.titles.length > 8 && (
              <span className="text-xs text-zinc-500 self-center">+{data.titles.length - 8} more</span>
            )}
          </div>
        </>
      )}

      {/* COI */}
      {data.coi && (
        <>
          <SectionHeader>Coefficient of Inbreeding</SectionHeader>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-white">{data.coi.coefficient.toFixed(2)}%</span>
                <span className="text-xs text-zinc-500 ml-2">({data.coi.generationsAnalyzed} generations)</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                data.coi.riskLevel === "LOW" ? "bg-green-500/20 text-green-400" :
                data.coi.riskLevel === "MODERATE" ? "bg-yellow-500/20 text-yellow-400" :
                data.coi.riskLevel === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {data.coi.riskLevel}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Parents quick view */}
      {(animal.sire || animal.dam || animal.sireId || animal.damId) && (
        <>
          <SectionHeader>Parents</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg border p-2 ${animal.sire ? "border-sky-500/30 bg-sky-500/5" : "border-zinc-700 bg-zinc-800/30"}`}>
              <div className="text-[10px] uppercase text-sky-400 font-medium">Sire</div>
              <div className="text-sm text-white truncate">
                {animal.sire?.registeredName || animal.sire?.name || (animal.sireId ? "Data not loaded" : "Unknown")}
              </div>
            </div>
            <div className={`rounded-lg border p-2 ${animal.dam ? "border-pink-400/30 bg-pink-400/5" : "border-zinc-700 bg-zinc-800/30"}`}>
              <div className="text-[10px] uppercase text-pink-400 font-medium">Dam</div>
              <div className="text-sm text-white truncate">
                {animal.dam?.registeredName || animal.dam?.name || (animal.damId ? "Data not loaded" : "Unknown")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TitlesTab({ titles }: { titles: AnimalTitle[] }) {
  if (titles.length === 0) {
    return <EmptyState message="No titles recorded for this animal" />;
  }

  // Group by category
  const byCategory = titles.reduce((acc, t) => {
    const cat = t.titleDefinition.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<TitleCategory, AnimalTitle[]>);

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, categoryTitles]) => (
        <div key={category}>
          <div className="text-[10px] uppercase text-zinc-500 font-medium mb-2">{category.replace(/_/g, " ")}</div>
          <div className="space-y-1">
            {categoryTitles.map((title) => (
              <div
                key={title.id}
                className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <TitleBadge title={title} />
                  <span className="text-sm text-zinc-300">{title.titleDefinition.fullName}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  {title.dateEarned ? new Date(title.dateEarned).getFullYear() : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompetitionsTab({ competitions, stats }: { competitions: CompetitionEntry[]; stats: CompetitionStats | null }) {
  if (competitions.length === 0 && !stats) {
    return <EmptyState message="No competition records for this animal" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total Entries" value={stats.totalEntries} />
          <StatCard label="Total Points" value={stats.totalPoints} />
          <StatCard label="Major Wins" value={stats.majorWins} />
        </div>
      )}

      {/* By Type breakdown */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <>
          <SectionHeader>By Competition Type</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="bg-zinc-800/30 rounded px-3 py-2">
                <div className="text-xs text-zinc-400">{COMPETITION_TYPE_LABELS[type as CompetitionType] || type}</div>
                <div className="text-sm text-white">
                  {data.entries} entries • {data.points} pts • {data.wins} wins
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent competitions */}
      {competitions.length > 0 && (
        <>
          <SectionHeader>Recent Results</SectionHeader>
          <div className="space-y-1">
            {competitions.slice(0, 10).map((comp) => (
              <div key={comp.id} className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{comp.eventName}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(comp.eventDate).toLocaleDateString()} • {COMPETITION_TYPE_LABELS[comp.competitionType] || comp.competitionType}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {comp.placementLabel && (
                    <span className="text-sm font-medium text-white">{comp.placementLabel}</span>
                  )}
                  {comp.isMajorWin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">MAJOR</span>
                  )}
                  {comp.qualifyingScore && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">Q</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LineageTab({ pedigree, coi }: { pedigree: PedigreeNode | null; coi: COIResult | null }) {
  if (!pedigree) {
    return <EmptyState message="Pedigree data not available" />;
  }

  const ParentCard = ({ parent, role, isSire }: { parent: PedigreeNode | null | undefined; role: string; isSire: boolean }) => {
    const borderColor = isSire ? "border-sky-500/30" : "border-pink-400/30";
    const bgColor = isSire ? "bg-sky-500/5" : "bg-pink-400/5";
    const labelColor = isSire ? "text-sky-400" : "text-pink-400";

    if (!parent) {
      return (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-2 opacity-50">
          <div className={`text-[10px] uppercase ${labelColor} font-medium`}>{role}</div>
          <div className="text-sm text-zinc-500">Unknown</div>
        </div>
      );
    }

    return (
      <div className={`rounded-lg border ${borderColor} ${bgColor} p-2`}>
        <div className={`text-[10px] uppercase ${labelColor} font-medium`}>{role}</div>
        <div className="text-sm text-white truncate">{parent.registeredName || parent.name}</div>
        {parent.titlePrefix && (
          <div className="text-[10px] text-amber-400 truncate">{parent.titlePrefix}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 2-generation pedigree */}
      <div className="grid grid-cols-2 gap-2">
        <ParentCard parent={pedigree.sire} role="Sire" isSire={true} />
        <ParentCard parent={pedigree.dam} role="Dam" isSire={false} />
      </div>

      {/* Grandparents */}
      {(pedigree.sire?.sire || pedigree.sire?.dam || pedigree.dam?.sire || pedigree.dam?.dam) && (
        <>
          <SectionHeader>Grandparents</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <ParentCard parent={pedigree.sire?.sire} role="Paternal Grandsire" isSire={true} />
              <ParentCard parent={pedigree.sire?.dam} role="Paternal Granddam" isSire={false} />
            </div>
            <div className="space-y-2">
              <ParentCard parent={pedigree.dam?.sire} role="Maternal Grandsire" isSire={true} />
              <ParentCard parent={pedigree.dam?.dam} role="Maternal Granddam" isSire={false} />
            </div>
          </div>
        </>
      )}

      {/* COI Details */}
      {coi && coi.commonAncestors.length > 0 && (
        <>
          <SectionHeader>Common Ancestors</SectionHeader>
          <div className="space-y-1">
            {coi.commonAncestors.slice(0, 5).map((ancestor) => (
              <div key={ancestor.id} className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-2">
                <span className="text-sm text-white">{ancestor.name}</span>
                <span className="text-xs text-zinc-500">
                  {ancestor.pathCount} path{ancestor.pathCount > 1 ? "s" : ""} • {(ancestor.contribution * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProducingTab({ record }: { record: ProducingRecord | null }) {
  if (!record || record.totalOffspring === 0) {
    return <EmptyState message="No producing record available" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Offspring" value={record.totalOffspring} />
        <StatCard label="Titled Offspring" value={record.titledOffspring} />
        <StatCard label="Champions" value={record.championOffspring} />
        <StatCard label="Grand Champions" value={record.grandChampionOffspring} />
      </div>

      {/* Titles by category */}
      {Object.keys(record.titleCountsByCategory).length > 0 && (
        <>
          <SectionHeader>Offspring Titles by Category</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(record.titleCountsByCategory).map(([category, count]) => (
              <div key={category} className="bg-zinc-800/30 rounded px-3 py-2">
                <div className="text-xs text-zinc-400">{category.replace(/_/g, " ")}</div>
                <div className="text-lg font-bold text-white">{count}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Titled offspring list */}
      {record.titledOffspringList.length > 0 && (
        <>
          <SectionHeader>Notable Offspring</SectionHeader>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {record.titledOffspringList.slice(0, 10).map((offspring) => (
              <div key={offspring.id} className="bg-zinc-800/30 rounded px-3 py-2">
                <div className="text-sm text-white">{offspring.name || `#${offspring.id}`}</div>
                <div className="text-xs text-amber-400 truncate">{offspring.titles.join(", ")}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────── Main Dialog Component ───────────────── */

export interface AnimalFullProfileDialogProps {
  open: boolean;
  onClose: () => void;
  animal: PedigreeNode;
  isLocalAnimal: boolean;
  onNavigateToAnimal?: (animalId: number) => void;
  onViewPedigree?: (animal: PedigreeNode) => void;
}

export function AnimalFullProfileDialog({
  open,
  onClose,
  animal,
  isLocalAnimal,
  onNavigateToAnimal,
  onViewPedigree,
}: AnimalFullProfileDialogProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [loading, setLoading] = React.useState(false);
  const [profileData, setProfileData] = React.useState<AnimalProfileData | null>(null);

  // Fetch profile data when dialog opens
  React.useEffect(() => {
    if (open && animal) {
      setLoading(true);
      setActiveTab("overview");
      fetchAnimalProfile(animal.id)
        .then((data) => {
          if (data) {
            data.animal = animal;
            setProfileData(data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch animal profile:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfileData(null);
    }
  }, [open, animal?.id]);

  const isMale = animal?.sex === "MALE";
  const isFemale = animal?.sex === "FEMALE";
  const ringColor = isMale ? "from-sky-400 to-sky-600" : isFemale ? "from-pink-400 to-pink-600" : "from-amber-400 to-amber-600";

  const displayName = animal?.registeredName || animal?.name || "Unknown Animal";

  // Determine which tabs have content
  const titlesCount = profileData?.titles.length || 0;
  const competitionsCount = profileData?.competitions.length || 0;
  const hasLineage = !!(profileData?.pedigree?.sire || profileData?.pedigree?.dam);
  const hasProducing = !!(profileData?.producingRecord && profileData.producingRecord.totalOffspring > 0);

  return (
    <Dialog open={open} onClose={onClose} size="lg" title="">
      <div className="min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-zinc-700">
          <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-br ${ringColor} flex-shrink-0`}>
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {displayName[0]?.toUpperCase() || "?"}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {animal?.titlePrefix && (
              <div className="text-xs font-bold text-amber-400">{animal.titlePrefix}</div>
            )}
            <h2 className="text-lg font-semibold text-white truncate">{displayName}</h2>
            {animal?.titleSuffix && (
              <div className="text-xs text-amber-400">{animal.titleSuffix}</div>
            )}
            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
              <span className={isMale ? "text-sky-400" : isFemale ? "text-pink-400" : "text-zinc-500"}>
                {isMale ? "♂ Male" : isFemale ? "♀ Female" : "Unknown"}
              </span>
              {animal?.breed && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{animal.breed}</span>
                </>
              )}
              {animal?.species && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{animal.species}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cross-tenant indicator */}
        {!isLocalAnimal && (
          <div className="mt-2 text-center text-xs text-zinc-500 bg-zinc-800/30 rounded py-1.5 px-3">
            Shared from another breeder's records
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-zinc-700">
          <Tab id="overview" label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <Tab id="titles" label="Titles" count={titlesCount} active={activeTab === "titles"} onClick={() => setActiveTab("titles")} />
          <Tab id="competitions" label="Competitions" count={competitionsCount} active={activeTab === "competitions"} onClick={() => setActiveTab("competitions")} />
          {hasLineage && (
            <Tab id="lineage" label="Lineage" active={activeTab === "lineage"} onClick={() => setActiveTab("lineage")} />
          )}
          {hasProducing && (
            <Tab id="producing" label="Producing" active={activeTab === "producing"} onClick={() => setActiveTab("producing")} />
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
                <div className="text-zinc-400 text-sm">Loading profile...</div>
              </div>
            </div>
          ) : profileData && animal ? (
            <>
              {activeTab === "overview" && <OverviewTab data={profileData} animal={animal} />}
              {activeTab === "titles" && <TitlesTab titles={profileData.titles} />}
              {activeTab === "competitions" && <CompetitionsTab competitions={profileData.competitions} stats={profileData.competitionStats} />}
              {activeTab === "lineage" && <LineageTab pedigree={profileData.pedigree} coi={profileData.coi} />}
              {activeTab === "producing" && <ProducingTab record={profileData.producingRecord} />}
            </>
          ) : (
            <EmptyState message="Unable to load profile data" />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-700 mt-auto">
          <div>
            {onViewPedigree && (animal?.sire || animal?.dam || animal?.sireId || animal?.damId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewPedigree(animal);
                }}
              >
                Explore Pedigree
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isLocalAnimal && onNavigateToAnimal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToAnimal(animal.id)}
              >
                Go to Animals Module
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default AnimalFullProfileDialog;

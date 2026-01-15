// apps/marketplace/src/breeder/pages/ManageBreedingProgramsPage.tsx
// Dedicated Breeding Programs Management Page
//
// FLAT DASHBOARD VIEW - Shows all breeding programs, plans, and offspring
// in a rich, data-dense view without collapsible sections.

import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@bhq/ui";
import {
  PawPrint,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronUp,
  Upload,
  Clock,
  FileText,
  Calendar,
  Baby,
  Users,
  ArrowLeft,
  DollarSign,
  Settings,
  Heart,
  Activity,
  TrendingUp,
} from "lucide-react";

// API imports
import {
  getMarketplaceProfile,
  saveMarketplaceProfileDraft,
  getBreederBreedingPlans,
  getBreederOffspringGroups,
  getBreedingPrograms,
  syncBreedingProgramsFromProfile,
  type MarketplaceProfileDraft,
  type BreederBreedingPlanItem,
  type BreederOffspringGroupItem,
} from "../../api/client";

// Component imports
import InlineRulesWidget from "../components/InlineRulesWidget";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type BreedsSpecies = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
type BreedsSpeciesUI = "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";

type SelectedBreed = {
  id: string | number;
  breedId?: number | null;
  customBreedId?: number | null;
  name: string;
  species: BreedsSpeciesUI;
  source: "canonical" | "custom";
};

type ListedProgramItem = NonNullable<MarketplaceProfileDraft["listedPrograms"]>[number];

const PROGRAM_SPECIES_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "HORSE", label: "Horse" },
  { value: "GOAT", label: "Goat" },
  { value: "SHEEP", label: "Sheep" },
  { value: "RABBIT", label: "Rabbit" },
];

interface ProgramSummaryStats {
  totalPlans: number;
  activePlans: number;
  statusBreakdown: Record<string, number>;
  upcomingLitters: number;
  nextExpectedBirth: string | null;
  availableCount: number;
}

// Status color mappings
const STATUS_COLORS: Record<string, { border: string; borderColor: string; bg: string; text: string; badge: string }> = {
  PLANNING: {
    border: "border-l-slate-500",
    borderColor: "border-slate-500/40",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    badge: "bg-slate-500/15 text-slate-400 border-slate-500/30"
  },
  COMMITTED: {
    border: "border-l-indigo-500",
    borderColor: "border-indigo-500/40",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
  },
  IN_HEAT: {
    border: "border-l-pink-500",
    borderColor: "border-pink-500/40",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    badge: "bg-pink-500/15 text-pink-400 border-pink-500/30"
  },
  BRED: {
    border: "border-l-fuchsia-500",
    borderColor: "border-fuchsia-500/40",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-400",
    badge: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30"
  },
  CONFIRMED: {
    border: "border-l-purple-500",
    borderColor: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30"
  },
  WHELPING: {
    border: "border-l-blue-500",
    borderColor: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30"
  },
  NURSING: {
    border: "border-l-cyan-500",
    borderColor: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
  },
  WEANING: {
    border: "border-l-teal-500",
    borderColor: "border-teal-500/40",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    badge: "bg-teal-500/15 text-teal-400 border-teal-500/30"
  },
  PLACING: {
    border: "border-l-amber-500",
    borderColor: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30"
  },
  COMPLETED: {
    border: "border-l-emerald-500",
    borderColor: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
  },
  CANCELLED: {
    border: "border-l-red-500",
    borderColor: "border-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-400",
    badge: "bg-red-500/15 text-red-400 border-red-500/30"
  },
  ARCHIVED: {
    border: "border-l-zinc-500",
    borderColor: "border-zinc-500/40",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  },
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  COMMITTED: "Committed",
  IN_HEAT: "In Heat",
  BRED: "Bred",
  CONFIRMED: "Confirmed",
  WHELPING: "Whelping",
  NURSING: "Nursing",
  WEANING: "Weaning",
  PLACING: "Placing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createEmptyProgram(): ListedProgramItem {
  return {
    name: "",
    species: "DOG",
    breedText: "",
    breedId: null,
    description: "",
    programStory: "",
    acceptInquiries: true,
    openWaitlist: false,
    acceptReservations: false,
    comingSoon: false,
    pricingTiers: null,
    whatsIncluded: "",
    showWhatsIncluded: true,
    typicalWaitTime: "",
    showWaitTime: true,
    coverImageUrl: null,
    showCoverImage: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITY TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function VisibilityToggle({
  isPublic,
  onChange,
  disabled,
}: {
  isPublic: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isPublic)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPublic
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
        }
      `}
    >
      {isPublic ? (
        <>
          <Eye className="w-3 h-3" />
          Public
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3" />
          Unlisted
        </>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLAT PROGRAM DASHBOARD - No collapsing, everything visible
// ═══════════════════════════════════════════════════════════════════════════

function ProgramDashboardCard({
  program,
  index,
  stats,
  loadingStats,
  matchingPlans,
  matchingGroups,
  programSlug,
  onEdit,
  onRemove,
  onOffspringGroupClick,
}: {
  program: ListedProgramItem;
  index: number;
  stats: ProgramSummaryStats;
  loadingStats: boolean;
  matchingPlans: BreederBreedingPlanItem[];
  matchingGroups: BreederOffspringGroupItem[];
  programSlug: string | null;
  onEdit: () => void;
  onRemove: () => void;
  onOffspringGroupClick: (group: BreederOffspringGroupItem) => void;
}) {
  const isMissingRequired = !program.name?.trim() || !program.breedText?.trim();

  // Group offspring by breeding plan ID
  const getOffspringForPlan = (planId: number) => {
    return matchingGroups.filter(g => g.breedingPlanId === planId);
  };

  // Get status colors helper
  const getStatusStyle = (status: string) => {
    return STATUS_COLORS[status] || STATUS_COLORS.PLANNING;
  };

  return (
    <div className="mb-8">
      {/* ═══ PROGRAM HEADER SECTION ═══ */}
      <div className={`bg-gradient-to-br from-portal-card to-portal-surface border-l-4 ${
        isMissingRequired ? 'border-l-red-500' : 'border-l-accent'
      } rounded-lg overflow-hidden`}>
        {/* Header Title Row */}
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <PawPrint className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold text-white">
                  {program.name || `Program ${index + 1}`}
                </h2>
                {isMissingRequired && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Incomplete
                  </span>
                )}
                {program.comingSoon && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    Coming Soon
                  </span>
                )}
              </div>
              <div className="text-sm text-text-secondary">
                {program.species ? PROGRAM_SPECIES_OPTIONS.find(s => s.value === program.species)?.label || program.species : "No species"}
                {program.breedText && ` · ${program.breedText}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-text-secondary hover:text-white hover:bg-portal-surface rounded transition-colors"
                title="Edit program details"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={onRemove}
                className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Remove program"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RICH ROLLUP STATISTICS */}
        <div className="px-6 py-5 bg-portal-surface/30">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Plans */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalPlans}</div>
                <div className="text-xs text-text-tertiary">Total Plans</div>
              </div>
            </div>

            {/* Active Plans */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                <Heart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{stats.activePlans}</div>
                <div className="text-xs text-text-tertiary">Active</div>
              </div>
            </div>

            {/* Upcoming Litters */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.upcomingLitters}</div>
                <div className="text-xs text-text-tertiary">Upcoming</div>
              </div>
            </div>

            {/* Next Birth */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-500/10 rounded-lg">
                <Baby className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-400">
                  {stats.nextExpectedBirth ? formatDate(stats.nextExpectedBirth) : "—"}
                </div>
                <div className="text-xs text-text-tertiary">Next Birth</div>
              </div>
            </div>

            {/* Available Offspring */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{stats.availableCount}</div>
                <div className="text-xs text-text-tertiary">Available</div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          {Object.keys(stats.statusBreakdown).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                Status Breakdown
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                  const style = getStatusStyle(status);
                  return (
                    <div
                      key={status}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${style.badge}`}
                    >
                      <span>{STATUS_LABELS[status] || status}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules management moved to program editor */}

      {/* ═══ BREEDING PLANS FLAT LIST ═══ */}
      {matchingPlans.length > 0 && (
        <div className="mt-6 relative">
          {/* Section Label */}
          <div className="pl-6 mb-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5" />
              Breeding Plans ({matchingPlans.length})
            </div>
          </div>

          {/* Visual connection line */}
          <div className="absolute left-0 top-8 bottom-0 w-0.5 bg-accent/30" />

          <div className="space-y-3">
            {matchingPlans.map((plan) => {
              const planOffspring = getOffspringForPlan(plan.id);
              const statusStyle = getStatusStyle(plan.status);

              return (
                <div key={plan.id} className="relative pl-6">
                  {/* Connection dot */}
                  <div className="absolute left-0 top-6 w-2 h-2 bg-accent rounded-full -translate-x-[3px]" />

                  {/* BREEDING PLAN ROW */}
                  <div className={`border border-l-4 ${statusStyle.borderColor} ${statusStyle.border} rounded-lg overflow-hidden bg-portal-card`}>
                  <div className="p-4">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-white">
                            {plan.name || "Untitled Plan"}
                          </h3>
                          <span className={`text-xs px-2.5 py-1 rounded border font-medium ${statusStyle.badge}`}>
                            {STATUS_LABELS[plan.status] || plan.status}
                          </span>
                        </div>

                        {/* Parent Animals with Photos */}
                        <div className="flex items-center gap-4">
                          {plan.dam && (
                            <div className="flex items-center gap-2">
                              {plan.dam.photoUrl ? (
                                <img
                                  src={plan.dam.photoUrl}
                                  alt={plan.dam.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-pink-400"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center">
                                  <span className="text-pink-400 text-xl">♀</span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm text-white font-medium">{plan.dam.name}</div>
                                <div className="text-xs text-pink-400">Dam</div>
                              </div>
                            </div>
                          )}

                          {plan.dam && plan.sire && (
                            <span className="text-text-tertiary">×</span>
                          )}

                          {plan.sire && (
                            <div className="flex items-center gap-2">
                              {plan.sire.photoUrl ? (
                                <img
                                  src={plan.sire.photoUrl}
                                  alt={plan.sire.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center">
                                  <span className="text-blue-400 text-xl">♂</span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm text-white font-medium">{plan.sire.name}</div>
                                <div className="text-xs text-blue-400">Sire</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Dates */}
                        {(plan.expectedBirthDate || plan.birthDateActual) && (
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {plan.birthDateActual && (
                              <span className="flex items-center gap-1 text-text-tertiary">
                                <Calendar className="w-3 h-3" />
                                Born {formatDate(plan.birthDateActual)}
                              </span>
                            )}
                            {!plan.birthDateActual && plan.expectedBirthDate && (
                              <span className="flex items-center gap-1 text-amber-400 font-medium">
                                <Calendar className="w-3 h-3" />
                                Expected {formatDate(plan.expectedBirthDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-surface rounded transition-colors"
                          title="Manage plan visibility"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-surface rounded transition-colors"
                          title="Plan settings"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Rules moved to settings modal */}

                    {/* OFFSPRING GROUP (Single per plan) */}
                    {planOffspring.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        {(() => {
                          const group = planOffspring[0]; // Only one group per plan
                          const [showIndividualOffspring, setShowIndividualOffspring] = React.useState(false);
                          const hasOffspring = group.offspring && group.offspring.length > 0;

                          return (
                            <div
                              className="bg-portal-surface border border-border-subtle rounded-lg p-4 hover:border-amber-500/50 transition-colors cursor-pointer"
                              onClick={() => onOffspringGroupClick(group)}
                            >
                              {/* Group Header */}
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Baby className="w-5 h-5 text-amber-400" />
                                    <h4 className="text-sm font-semibold text-white">
                                      {group.listingTitle || "Offspring Group"}
                                    </h4>
                                    {hasOffspring && (
                                      <button
                                        onClick={() => setShowIndividualOffspring(!showIndividualOffspring)}
                                        className="ml-2 text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                                      >
                                        {showIndividualOffspring ? (
                                          <>
                                            <ChevronUp className="w-3 h-3" />
                                            Hide Individual Offspring
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3 h-3" />
                                            Show Individual Offspring ({group.offspring.length})
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs">
                                    {group.actualBirthOn && (
                                      <span className="flex items-center gap-1 text-text-tertiary">
                                        <Calendar className="w-3 h-3" />
                                        Born {formatDate(group.actualBirthOn)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="p-1.5 text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                                    title="Set group pricing"
                                  >
                                    <DollarSign size={14} />
                                  </button>
                                  <button
                                    className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-card rounded transition-colors"
                                    title="Group visibility"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-card rounded transition-colors"
                                    title="Group settings"
                                  >
                                    <Settings size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Offspring & Buyer Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                {/* Total Offspring */}
                                <div className="bg-portal-bg/50 rounded-lg p-3 border border-border-subtle">
                                  <div className="text-xs text-text-tertiary mb-1">Total</div>
                                  <div className="text-xl font-bold text-white">{group.totalCount || 0}</div>
                                </div>

                                {/* Available */}
                                <div className={`rounded-lg p-3 border ${
                                  group.availableCount > 0
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-portal-bg/50 border-border-subtle'
                                }`}>
                                  <div className={`text-xs mb-1 ${
                                    group.availableCount > 0 ? 'text-emerald-400' : 'text-text-tertiary'
                                  }`}>
                                    Available
                                  </div>
                                  <div className={`text-xl font-bold ${
                                    group.availableCount > 0 ? 'text-emerald-400' : 'text-text-tertiary'
                                  }`}>
                                    {group.availableCount > 0 ? group.availableCount : '—'}
                                  </div>
                                </div>

                                {/* Waitlist - TODO: Need API support */}
                                <div className="bg-portal-bg/50 rounded-lg p-3 border border-border-subtle">
                                  <div className="text-xs text-text-tertiary mb-1">Waitlist</div>
                                  <div className="text-xl font-bold text-blue-400">—</div>
                                </div>

                                {/* Deposits - TODO: Need API support */}
                                <div className="bg-portal-bg/50 rounded-lg p-3 border border-border-subtle">
                                  <div className="text-xs text-text-tertiary mb-1">Deposits</div>
                                  <div className="text-xl font-bold text-amber-400">—</div>
                                </div>

                                {/* Paid in Full - TODO: Need API support */}
                                <div className="bg-portal-bg/50 rounded-lg p-3 border border-border-subtle">
                                  <div className="text-xs text-text-tertiary mb-1">Paid</div>
                                  <div className="text-xl font-bold text-green-400">—</div>
                                </div>
                              </div>

                              {/* Rules moved to group settings */}

                              {/* Individual Offspring List (Expandable) */}
                              {hasOffspring && showIndividualOffspring && (
                                <div className="pt-4 border-t border-border-subtle">
                                  <div className="space-y-2">
                                    {group.offspring.map((offspring, idx) => {
                                      const isAvailable = offspring.keeperIntent === 'AVAILABLE' && offspring.marketplaceListed;
                                      const statusColor = isAvailable ? 'text-emerald-400' : 'text-text-tertiary';

                                      return (
                                        <div
                                          key={offspring.id}
                                          className="bg-portal-bg/30 border border-border-subtle rounded-lg p-3 hover:border-border-default transition-colors"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                              {/* Offspring Photo */}
                                              {offspring.photos && offspring.photos.length > 0 ? (
                                                <img
                                                  src={offspring.photos[0]}
                                                  alt={offspring.name || `Offspring ${idx + 1}`}
                                                  className="w-16 h-16 rounded-lg object-cover border border-border-subtle"
                                                />
                                              ) : (
                                                <div className="w-16 h-16 rounded-lg bg-portal-surface border border-border-subtle flex items-center justify-center">
                                                  <Baby className="w-6 h-6 text-text-tertiary" />
                                                </div>
                                              )}

                                              {/* Offspring Info */}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <h5 className="text-sm font-medium text-white">
                                                    {offspring.name || `Offspring #${idx + 1}`}
                                                  </h5>
                                                  {offspring.collarColorName && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                                      <div
                                                        className="w-3 h-3 rounded-full border border-border-subtle"
                                                        style={{ backgroundColor: offspring.collarColorHex || '#888' }}
                                                      />
                                                      {offspring.collarColorName}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                  {offspring.sex && (
                                                    <span className={offspring.sex === 'FEMALE' ? 'text-pink-400' : 'text-blue-400'}>
                                                      {offspring.sex === 'FEMALE' ? '♀ Female' : '♂ Male'}
                                                    </span>
                                                  )}
                                                  <span className={statusColor}>
                                                    {isAvailable ? '✓ Listed' : 'Unlisted'}
                                                  </span>
                                                  {offspring.marketplacePriceCents && (
                                                    <span className="text-text-secondary">
                                                      ${(offspring.marketplacePriceCents / 100).toFixed(0)}
                                                    </span>
                                                  )}
                                                </div>
                                                {offspring.coatDescription && (
                                                  <p className="text-xs text-text-tertiary mt-1 truncate">
                                                    {offspring.coatDescription}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            {/* Individual Offspring Actions */}
                                            <div className="flex items-center gap-1">
                                              <button
                                                className="p-1.5 text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                                                title="Set individual price"
                                              >
                                                <DollarSign size={12} />
                                              </button>
                                              <button
                                                className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-surface rounded transition-colors"
                                                title="Toggle individual visibility"
                                              >
                                                {offspring.marketplaceListed ? (
                                                  <Eye size={12} className="text-emerald-400" />
                                                ) : (
                                                  <EyeOff size={12} />
                                                )}
                                              </button>
                                              <button
                                                className="p-1.5 text-text-secondary hover:text-white hover:bg-portal-surface rounded transition-colors"
                                                title="Edit offspring"
                                              >
                                                <Pencil size={12} />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Rules available via offspring detail page */}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* No offspring yet message */}
                              {!hasOffspring && (
                                <div className="text-center py-6 text-sm text-text-tertiary">
                                  No individual offspring recorded yet. Add offspring to track availability and pricing.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {matchingPlans.length === 0 && (
        <div className="ml-6 mt-4 p-6 bg-portal-surface/30 border border-border-subtle rounded-lg text-center">
          <Activity className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary mb-1">No breeding plans yet</p>
          <p className="text-xs text-text-tertiary">
            Plans matching {program.breedText || "this breed"} will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM EDITOR DRAWER (Modern Slide-out Modal)
// ═══════════════════════════════════════════════════════════════════════════

function ProgramEditorDrawer({
  program,
  index,
  onChange,
  onClose,
  onRemove,
  breederBreeds,
  programSlug,
}: {
  program: ListedProgramItem;
  index: number;
  onChange: (updates: Partial<ListedProgramItem>) => void;
  onClose: () => void;
  onRemove: () => void;
  breederBreeds: SelectedBreed[];
  programSlug: string | null;
}) {
  const isMissingRequired = !program.name?.trim() || !program.breedText?.trim();
  const [activeTab, setActiveTab] = React.useState<'details' | 'listing'>('details');

  // Filter breeds by selected species
  const currentSpecies = (program.species || "DOG").toUpperCase();
  const availableBreeds = breederBreeds.filter(
    (b) => b.species.toUpperCase() === currentSpecies
  );

  // Handle breed selection from dropdown
  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const breedName = e.target.value;
    if (!breedName) {
      onChange({ breedText: "", breedId: null });
      return;
    }
    const selectedBreed = availableBreeds.find((b) => b.name === breedName);
    if (selectedBreed) {
      onChange({
        breedText: selectedBreed.name,
        breedId: selectedBreed.breedId ?? null,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-portal-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-portal-surface border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <PawPrint className="w-5 h-5 text-accent" />
              <div>
                <h2 className="text-lg font-bold text-white">
                  {program.name || 'New Program'}
                </h2>
                <p className="text-sm text-text-muted">
                  {program.species && program.breedText ? `${program.species} · ${program.breedText}` : 'Configure your breeding program'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRemove}
                className="p-2 hover:bg-red-500/10 text-text-muted hover:text-red-400 rounded-lg transition-colors"
                title="Delete program"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 text-text-muted hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-accent text-white'
                  : 'border-transparent text-text-muted hover:text-white'
              }`}
            >
              Program Details
            </button>
            <button
              onClick={() => setActiveTab('listing')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'listing'
                  ? 'border-accent text-white'
                  : 'border-transparent text-text-muted hover:text-white'
              }`}
            >
              Listing & Rules
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
        {/* Program Identity */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-white border-b border-border-subtle pb-2">
            Program Identity
          </h5>

          {/* Program Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Program Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={program.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Golden Retriever Breeding Program"
              maxLength={100}
              className={`w-full px-3 py-2.5 text-sm bg-portal-surface border rounded-lg focus:border-accent focus:outline-none ${
                !program.name?.trim() ? "border-amber-500/70" : "border-border-subtle"
              }`}
            />
            {!program.name?.trim() && (
              <p className="text-xs text-amber-400 mt-1">Program name is required</p>
            )}
          </div>

          {/* Species & Breed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Species <span className="text-red-400">*</span>
              </label>
              <select
                value={program.species || "DOG"}
                onChange={(e) => onChange({ species: e.target.value, breedText: "", breedId: null })}
                className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              >
                {PROGRAM_SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed <span className="text-red-400">*</span>
              </label>
              {availableBreeds.length > 0 ? (
                <select
                  value={program.breedText || ""}
                  onChange={handleBreedChange}
                  className={`w-full px-3 py-2.5 text-sm bg-portal-surface border rounded-lg focus:border-accent focus:outline-none ${
                    !program.breedText?.trim() ? "border-amber-500/70" : "border-border-subtle"
                  }`}
                >
                  <option value="">Select a breed...</option>
                  {availableBreeds.map((breed) => (
                    <option key={breed.id} value={breed.name}>{breed.name}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2.5 text-sm bg-portal-surface border border-amber-500/50 rounded-lg text-amber-400">
                  No {PROGRAM_SPECIES_OPTIONS.find(s => s.value === program.species)?.label || "Dog"} breeds in your list.
                  <br />
                  <span className="text-xs text-text-tertiary">Add breeds in the "Your Breeds" tab first.</span>
                </div>
              )}
              {!program.breedText?.trim() && availableBreeds.length > 0 && (
                <p className="text-xs text-amber-400 mt-1">Breed is required</p>
              )}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Short Description
            </label>
            <textarea
              value={program.description || ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief description shown in cards and search results"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
            />
            <div className="text-xs text-text-tertiary text-right mt-1">
              {(program.description || "").length}/500
            </div>
          </div>

          {/* Program Story */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Program Story
            </label>
            <p className="text-xs text-text-tertiary mb-2">
              Tell buyers about your breeding philosophy and what makes this program special
            </p>
            <textarea
              value={program.programStory || ""}
              onChange={(e) => onChange({ programStory: e.target.value })}
              placeholder="Share your story... How did you start? What are your goals?"
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
            />
            <div className="text-xs text-text-tertiary text-right mt-1">
              {(program.programStory || "").length}/5000
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h5 className="text-sm font-semibold text-white">Cover Image</h5>
            <VisibilityToggle
              isPublic={program.showCoverImage ?? true}
              onChange={(v) => onChange({ showCoverImage: v })}
            />
          </div>

          <div className="bg-portal-surface/50 border border-border-subtle rounded-lg p-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Recommended</div>
                <div className="text-white font-medium">1200 x 630px</div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Aspect Ratio</div>
                <div className="text-white font-medium">1.9:1 (landscape)</div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Max Size</div>
                <div className="text-white font-medium">5MB</div>
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2">
              JPG, PNG, or WebP. Landscape images work best. Image will be cropped to fit card dimensions.
            </p>
          </div>

          {program.coverImageUrl ? (
            <div className="relative">
              <img
                src={program.coverImageUrl}
                alt="Cover"
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onChange({ coverImageUrl: null })}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border-subtle rounded-lg p-6 text-center">
              <Upload className="w-6 h-6 mx-auto text-text-tertiary mb-2" />
              <p className="text-xs text-text-tertiary mb-2">Enter image URL:</p>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onChange({ coverImageUrl: e.target.value || null })}
                className="w-full max-w-sm mx-auto px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Program Settings */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-white border-b border-border-subtle pb-2">
            Program Settings
          </h5>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-portal-surface rounded-lg">
            <input
              type="checkbox"
              checked={program.comingSoon ?? false}
              onChange={(e) => onChange({ comingSoon: e.target.checked })}
              className="w-4 h-4 rounded border-border-subtle bg-portal-card"
            />
            <div className="flex-1">
              <div className="text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Coming Soon
              </div>
              <div className="text-xs text-text-secondary mt-0.5">Show a badge for programs without current availability</div>
            </div>
          </label>

          <div className="border-t border-border-subtle pt-4">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
              Buyer Interaction Options
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.acceptInquiries ?? true}
                  onChange={(e) => onChange({ acceptInquiries: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Accept Inquiries</div>
                  <div className="text-xs text-text-secondary mt-0.5">Show "Contact Breeder" button</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.openWaitlist ?? false}
                  onChange={(e) => onChange({ openWaitlist: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Open Waitlist</div>
                  <div className="text-xs text-text-secondary mt-0.5">Show "Join Waitlist" button</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.acceptReservations ?? false}
                  onChange={(e) => onChange({ acceptReservations: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Accept Reservations</div>
                  <div className="text-xs text-text-secondary mt-0.5">Paid deposits (Stripe)</div>
                </div>
              </label>
            </div>
          </div>
        </div>

          {/* Tab: Details */}
          {activeTab === 'details' && (
            <>
              {/* All existing form fields stay here - they're already rendered above */}
            </>
          )}

          {/* Tab: Listing & Rules */}
          {activeTab === 'listing' && programSlug && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">Listing Rules</h3>
                <p className="text-sm text-text-muted mb-4">
                  Automate how offspring from this program are listed and managed in your marketplace.
                </p>
                <InlineRulesWidget
                  level="PROGRAM"
                  levelId={programSlug}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ManageBreedingProgramsPage() {
  const tenantId = getTenantId();

  // Profile state
  const [profile, setProfile] = React.useState<MarketplaceProfileDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Programs state
  const programs = profile?.listedPrograms || [];
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  // Stats data
  const [breedingPlans, setBreedingPlans] = React.useState<BreederBreedingPlanItem[]>([]);
  const [offspringGroups, setOffspringGroups] = React.useState<BreederOffspringGroupItem[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(false);

  // Actual breeding programs with slugs (for rules management)
  const [breedingPrograms, setBreedingPrograms] = React.useState<any[]>([]);

  // Offspring modal state
  const [selectedOffspringGroup, setSelectedOffspringGroup] = React.useState<BreederOffspringGroupItem | null>(null);

  // Load profile on mount
  React.useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    getMarketplaceProfile(tenantId)
      .then((data) => {
        setProfile(data.draft || data.published || null);
      })
      .catch((err) => {
        console.error("Failed to load marketplace profile:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenantId]);

  // Fetch breeding plans, offspring groups, and actual breeding programs
  React.useEffect(() => {
    if (!tenantId) return;

    setLoadingStats(true);

    // First sync programs from profile to database (idempotent)
    syncBreedingProgramsFromProfile(tenantId)
      .catch((err) => {
        console.warn("Failed to sync breeding programs:", err);
      })
      .then(() => {
        // Then fetch all data
        return Promise.all([
          getBreederBreedingPlans(tenantId, { limit: 100 }).catch(() => ({ items: [] })),
          getBreederOffspringGroups(tenantId, { limit: 100 }).catch(() => ({ items: [] })),
          getBreedingPrograms(tenantId, { limit: 100 }).catch(() => ({ items: [] })),
        ]);
      })
      .then(([plansRes, groupsRes, programsRes]) => {
        setBreedingPlans(plansRes.items || []);
        setOffspringGroups(groupsRes.items || []);
        setBreedingPrograms(programsRes.items || []);
      })
      .finally(() => setLoadingStats(false));
  }, [tenantId]);

  // Find matching breeding program with slug
  const findProgramSlug = React.useCallback(
    (program: ListedProgramItem): string | null => {
      if (!program.species) {
        console.log('[findProgramSlug] No species for program:', program.name);
        return null;
      }

      const species = program.species.toUpperCase();
      const breedText = program.breedText?.toLowerCase();

      console.log('[findProgramSlug] Looking for program:', {
        name: program.name,
        species,
        breedText,
        availablePrograms: breedingPrograms.length,
        programs: breedingPrograms.map(bp => ({ slug: bp.slug, species: bp.species, breedText: bp.breedText }))
      });

      const match = breedingPrograms.find((bp) => {
        if (bp.species?.toUpperCase() !== species) return false;
        if (breedText && bp.breedText) {
          const bpBreed = bp.breedText.toLowerCase();
          return bpBreed.includes(breedText) || breedText.includes(bpBreed);
        }
        return true;
      });

      if (match?.slug) {
        console.log('[findProgramSlug] Found match:', match.slug);
        return match.slug;
      }

      // FALLBACK: If no database record exists, create a temporary slug from program name
      // This allows rules UI to work even before proper BreedingProgram records exist
      if (program.name) {
        const fallbackSlug = program.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        console.log('[findProgramSlug] Using fallback slug:', fallbackSlug);
        return fallbackSlug;
      }

      console.log('[findProgramSlug] No slug found');
      return null;
    },
    [breedingPrograms]
  );

  // Get matching plans for a program, sorted by status priority then expected birth date
  const getMatchingPlans = React.useCallback(
    (program: ListedProgramItem): BreederBreedingPlanItem[] => {
      const species = program.species?.toUpperCase();
      const breedText = program.breedText?.toLowerCase();

      const matched = breedingPlans.filter((plan) => {
        if (!species) return false;
        const planSpecies = plan.species?.toUpperCase();
        if (planSpecies !== species) return false;
        // If breed is specified, try to match
        if (breedText && plan.breedText) {
          return plan.breedText.toLowerCase().includes(breedText) ||
                 breedText.includes(plan.breedText.toLowerCase());
        }
        return true;
      });

      // Sort by birth date ascending (earliest/soonest first at top)
      // Use actual birth date if available, otherwise expected birth date
      return matched.sort((a, b) => {
        // Prefer actual birth date, fall back to expected birth date
        const dateA = a.birthDateActual
          ? new Date(a.birthDateActual).getTime()
          : a.expectedBirthDate
            ? new Date(a.expectedBirthDate).getTime()
            : Number.MAX_SAFE_INTEGER;
        const dateB = b.birthDateActual
          ? new Date(b.birthDateActual).getTime()
          : b.expectedBirthDate
            ? new Date(b.expectedBirthDate).getTime()
            : Number.MAX_SAFE_INTEGER;

        // If dates are different, sort by date (ascending - earliest first)
        if (dateA !== dateB) {
          return dateA - dateB;
        }

        // If dates are the same, prioritize active breeding cycles over planning
        const getStatusPriority = (status: string): number => {
          // Priority 1: Active breeding cycles (more important)
          if (['COMMITTED', 'IN_HEAT', 'BRED', 'CONFIRMED', 'WHELPING', 'NURSING', 'WEANING', 'PLACING'].includes(status)) return 1;
          // Priority 2: Planning status
          if (status === 'PLANNING') return 2;
          // Priority 3: Completed/Cancelled/Archived
          return 3;
        };

        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);
        return priorityA - priorityB;
      });
    },
    [breedingPlans]
  );

  // Get matching offspring groups for a program
  const getMatchingGroups = React.useCallback(
    (program: ListedProgramItem): BreederOffspringGroupItem[] => {
      const species = program.species?.toUpperCase();
      const breedText = program.breedText?.toLowerCase();

      return offspringGroups.filter((group) => {
        if (!species) return false;
        const groupSpecies = group.species?.toUpperCase();
        if (groupSpecies !== species) return false;
        // If breed is specified, try to match
        if (breedText && group.breed) {
          return group.breed.toLowerCase().includes(breedText) ||
                 breedText.includes(group.breed.toLowerCase());
        }
        return true;
      });
    },
    [offspringGroups]
  );

  // Compute summary stats for a program by matching species/breed
  const getProgramStats = React.useCallback(
    (program: ListedProgramItem): ProgramSummaryStats => {
      const matchingPlans = getMatchingPlans(program);
      const matchingGroups = getMatchingGroups(program);

      const now = new Date();
      const activePlans = matchingPlans.filter(
        (p) => p.status && !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(p.status)
      );

      // Status breakdown - count plans by status
      const statusBreakdown: Record<string, number> = {};
      matchingPlans.forEach((plan) => {
        const status = plan.status || "PLANNING";
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      // Upcoming litters: expected birth in future, not yet born
      const upcomingGroups = matchingGroups.filter((g) => {
        const expected = g.expectedBirthOn ? new Date(g.expectedBirthOn) : null;
        return expected && expected > now && !g.actualBirthOn;
      });

      // Next expected birth date
      const nextExpected = upcomingGroups
        .map((g) => g.expectedBirthOn)
        .filter(Boolean)
        .sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime())[0] || null;

      // Available offspring: born but not all placed
      const availableCount = matchingGroups
        .filter((g) => g.actualBirthOn)
        .reduce((sum, g) => sum + (g.availableCount || 0), 0);

      return {
        totalPlans: matchingPlans.length,
        activePlans: activePlans.length,
        statusBreakdown,
        upcomingLitters: upcomingGroups.length,
        nextExpectedBirth: nextExpected,
        availableCount,
      };
    },
    [getMatchingPlans, getMatchingGroups]
  );

  // Update profile with new programs
  const updatePrograms = (newPrograms: ListedProgramItem[]) => {
    if (!profile) return;

    const updatedProfile = { ...profile, listedPrograms: newPrograms };
    setProfile(updatedProfile);

    // Auto-save draft
    setSaving(true);
    saveMarketplaceProfileDraft(tenantId, updatedProfile)
      .catch((err) => {
        console.error("Failed to save draft:", err);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const addProgram = () => {
    const newPrograms = [...programs, createEmptyProgram()];
    updatePrograms(newPrograms);
    // Auto-expand the new program
    setExpandedIndex(newPrograms.length - 1);
  };

  const updateProgram = (index: number, updates: Partial<ListedProgramItem>) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], ...updates };
    updatePrograms(updated);
  };

  const removeProgram = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
    updatePrograms(programs.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Failed to load profile</p>
          <Link to="/marketplace/manage/animals">
            <Button variant="secondary">Back to Animals Management</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-portal-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/marketplace/manage/animals"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Animals Management
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Breeding Program Dashboard</h1>
              <p className="text-text-secondary">
                Your complete view of breeding programs, plans, and available offspring
              </p>
            </div>
            {saving && (
              <div className="text-sm text-text-tertiary">
                Saving...
              </div>
            )}
          </div>
        </div>

        {/* Programs List */}
        {programs.length === 0 ? (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <PawPrint className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-text-secondary mb-2">No program listings yet</p>
            <p className="text-sm text-text-tertiary mb-4">
              Add your breeding programs to let buyers know what you offer.
            </p>
            <Button variant="primary" onClick={addProgram}>
              <Plus size={16} className="mr-1.5" />
              Add Program
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {programs
              .map((program, index) => ({ program, originalIndex: index, stats: getProgramStats(program) }))
              .sort((a, b) => {
                // Sort by earliest upcoming birth date (programs requiring attention first)
                const dateA = a.stats.nextExpectedBirth ? new Date(a.stats.nextExpectedBirth).getTime() : Number.MAX_SAFE_INTEGER;
                const dateB = b.stats.nextExpectedBirth ? new Date(b.stats.nextExpectedBirth).getTime() : Number.MAX_SAFE_INTEGER;

                // If dates are different, sort by date (earliest first)
                if (dateA !== dateB) {
                  return dateA - dateB;
                }

                // If both have no upcoming births, sort by active plans count (more active = higher priority)
                if (dateA === Number.MAX_SAFE_INTEGER && dateB === Number.MAX_SAFE_INTEGER) {
                  return b.stats.activePlans - a.stats.activePlans;
                }

                return 0;
              })
              .map(({ program, originalIndex, stats }) => (
                <ProgramDashboardCard
                  key={originalIndex}
                  program={program}
                  index={originalIndex}
                  stats={stats}
                  loadingStats={loadingStats}
                  matchingPlans={getMatchingPlans(program)}
                  matchingGroups={getMatchingGroups(program)}
                  programSlug={findProgramSlug(program)}
                  onEdit={() => setExpandedIndex(originalIndex)}
                  onRemove={() => removeProgram(originalIndex)}
                  onOffspringGroupClick={setSelectedOffspringGroup}
                />
              ))}

            <Button variant="secondary" onClick={addProgram} className="w-full">
              <Plus size={16} className="mr-1.5" />
              Add Another Program
            </Button>
          </div>
        )}
      </div>

      {/* Program Editor Drawer */}
      {expandedIndex !== null && (
        <ProgramEditorDrawer
          program={programs[expandedIndex]}
          index={expandedIndex}
          onChange={(updates) => updateProgram(expandedIndex, updates)}
          onClose={() => setExpandedIndex(null)}
          onRemove={() => removeProgram(expandedIndex)}
          breederBreeds={(profile?.breeds || []) as SelectedBreed[]}
          programSlug={findProgramSlug(programs[expandedIndex])}
        />
      )}

      {/* Offspring Group Modal */}
      {selectedOffspringGroup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOffspringGroup(null)}
        >
          <div
            className="bg-portal-card border border-border-subtle rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-amber-500/20 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Baby className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {selectedOffspringGroup.listingTitle || "Offspring Group"}
                    </h3>
                  </div>
                  {selectedOffspringGroup.actualBirthOn && (
                    <p className="text-sm text-text-tertiary flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Born {formatDate(selectedOffspringGroup.actualBirthOn)}
                    </p>
                  )}
                  {!selectedOffspringGroup.actualBirthOn && selectedOffspringGroup.expectedBirthOn && (
                    <p className="text-sm text-text-tertiary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Expected {formatDate(selectedOffspringGroup.expectedBirthOn)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOffspringGroup(null)}
                  className="p-2 hover:bg-portal-surface rounded-lg transition-colors text-text-secondary hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="bg-portal-bg/50 rounded-lg p-2.5 border border-border-subtle">
                  <div className="text-xs text-text-tertiary mb-0.5">Total</div>
                  <div className="text-lg font-bold text-white">{selectedOffspringGroup.totalCount || 0}</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/30">
                  <div className="text-xs text-emerald-400 mb-0.5">Available</div>
                  <div className="text-lg font-bold text-emerald-400">{selectedOffspringGroup.availableCount || 0}</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/30">
                  <div className="text-xs text-blue-400 mb-0.5">Waitlist</div>
                  <div className="text-lg font-bold text-blue-400">—</div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/30">
                  <div className="text-xs text-amber-400 mb-0.5">Deposits</div>
                  <div className="text-lg font-bold text-amber-400">—</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-2.5 border border-green-500/30">
                  <div className="text-xs text-green-400 mb-0.5">Paid</div>
                  <div className="text-lg font-bold text-green-400">—</div>
                </div>
              </div>
            </div>

            {/* Modal Content - Individual Offspring List */}
            <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-6">
              {selectedOffspringGroup.offspring && selectedOffspringGroup.offspring.length > 0 ? (
                <div className="space-y-3">
                  {selectedOffspringGroup.offspring.map((offspring, idx) => {
                    const isAvailable = offspring.keeperIntent === 'AVAILABLE' && offspring.marketplaceListed;
                    const statusColor = isAvailable ? 'text-emerald-400' : 'text-text-tertiary';

                    return (
                      <div
                        key={offspring.id}
                        className="bg-portal-surface border border-border-subtle rounded-lg p-4 hover:border-border-default transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Offspring Photo */}
                          {offspring.photos && offspring.photos.length > 0 ? (
                            <img
                              src={offspring.photos[0]}
                              alt={offspring.name || `Offspring ${idx + 1}`}
                              className="w-20 h-20 rounded-lg object-cover border border-border-subtle flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-portal-bg border border-border-subtle flex items-center justify-center flex-shrink-0">
                              <Baby className="w-8 h-8 text-text-tertiary" />
                            </div>
                          )}

                          {/* Offspring Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="text-base font-semibold text-white">
                                    {offspring.name || `Offspring #${idx + 1}`}
                                  </h5>
                                  {offspring.collarColorName && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-portal-bg border border-border-subtle text-text-tertiary">
                                      <div
                                        className="w-3 h-3 rounded-full border border-border-subtle"
                                        style={{ backgroundColor: offspring.collarColorHex || '#888' }}
                                      />
                                      {offspring.collarColorName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  {offspring.sex && (
                                    <span className={offspring.sex === 'FEMALE' ? 'text-pink-400' : 'text-blue-400'}>
                                      {offspring.sex === 'FEMALE' ? '♀ Female' : '♂ Male'}
                                    </span>
                                  )}
                                  {offspring.priceCents && (
                                    <span className="text-text-secondary">
                                      ${(offspring.priceCents / 100).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                isAvailable
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                              }`}>
                                {isAvailable ? '✓ Listed' : 'Unlisted'}
                              </span>
                            </div>
                            {offspring.headlineOverride && (
                              <p className="text-sm text-text-secondary mt-1">{offspring.headlineOverride}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Baby className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary">No individual offspring recorded yet.</p>
                  <p className="text-sm text-text-tertiary mt-1">Add offspring to track availability and pricing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// apps/marketplace/src/breeder/pages/AnimalProgramsPage.tsx
// Animal Programs Management Page - V2
//
// Manage grouped breeding programs with multiple animal participants

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Badge } from "@bhq/ui";
import {
  Users,
  Plus,
  Eye,
  MessageSquare,
  Pencil,
  Trash2,
  Filter,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Flame,
} from "lucide-react";

import {
  getAnimalPrograms,
  deleteAnimalProgram,
  getProgramAnalytics,
  type AnimalProgram,
  type TemplateType,
  type ProgramAnalyticsResponse,
  type ProgramStats,
} from "../../api/client";

import { PerformanceSummaryRow } from "../components/analytics/PerformanceSummaryRow";
import { InsightsCallout, InsightBanner } from "../components/analytics/InsightsCallout";
import { InlineCardStats, StatsBadgeOverlay } from "../components/analytics/ProgramStatsOverlay";

import logoUrl from "@bhq/ui/assets/logo.png";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

const TEMPLATE_CONFIG: Record<TemplateType, { label: string; color: string }> = {
  STUD_SERVICES: { label: "Stud", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  CO_OWNERSHIP: { label: "Co-Own", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  CUSTOM: { label: "Custom", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AnimalProgramsPage() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [programs, setPrograms] = React.useState<AnimalProgram[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [publishedFilter, setPublishedFilter] = React.useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = React.useState<string>("ALL");

  // Analytics state
  const [analytics, setAnalytics] = React.useState<ProgramAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [dismissedInsights, setDismissedInsights] = React.useState<Set<string>>(new Set());

  const fetchPrograms = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAnimalPrograms(tenantId, {
        published: publishedFilter === "ALL" ? undefined : publishedFilter === "PUBLISHED",
        templateType: templateFilter === "ALL" ? undefined : templateFilter,
      });
      setPrograms(response.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load animal programs");
    } finally {
      setLoading(false);
    }
  }, [tenantId, publishedFilter, templateFilter]);

  // Fetch analytics data
  const fetchAnalytics = React.useCallback(async () => {
    if (!tenantId) return;
    setAnalyticsLoading(true);
    try {
      const data = await getProgramAnalytics(tenantId);
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      // Don't show error to user - analytics is supplementary
    } finally {
      setAnalyticsLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchPrograms();
    fetchAnalytics();
  }, [fetchPrograms, fetchAnalytics]);

  // Create a map of program stats by ID for quick lookup
  const programStatsMap = React.useMemo(() => {
    const map = new Map<number, ProgramStats>();
    if (analytics?.programStats) {
      for (const stat of analytics.programStats) {
        map.set(stat.programId, stat);
      }
    }
    return map;
  }, [analytics]);

  // Filter insights that haven't been dismissed
  const visibleInsights = React.useMemo(() => {
    if (!analytics?.insights) return [];
    return analytics.insights.filter((insight) => !dismissedInsights.has(insight.id));
  }, [analytics, dismissedInsights]);

  const handleDismissInsight = (id: string) => {
    setDismissedInsights((prev) => new Set([...prev, id]));
  };

  const handleDelete = async (program: AnimalProgram) => {
    if (!confirm(`Delete program "${program.name}"? This cannot be undone.`)) return;
    try {
      await deleteAnimalProgram(tenantId, program.id);
      fetchPrograms();
    } catch (err: any) {
      alert(err.message || "Failed to delete program");
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: programs.length,
    published: programs.filter((p) => p.published).length,
    draft: programs.filter((p) => !p.published).length,
    totalParticipants: programs.reduce((sum, p) => sum + p.participants.length, 0),
  };

  return (
    <div className="min-h-screen bg-portal-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Animal Programs</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage grouped breeding programs with multiple participants
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/manage/animal-programs/new")}>
              <Plus size={16} className="mr-1.5" />
              New Program
            </Button>
          </div>
        </div>

        {/* Public Visibility Info Banner */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-300 mb-1">
                What Anonymous Marketplace Visitors See
              </h3>
              <p className="text-xs text-text-secondary mb-2">
                Published programs are publicly visible to help buyers discover your animals. Here's what anonymous users can see:
              </p>
              <ul className="text-xs text-text-secondary ml-4 list-disc grid grid-cols-2 gap-x-4 gap-y-1">
                <li>Program name, description, and headline</li>
                <li>Pricing information and location (city/state)</li>
                <li>Cover image and template type (Stud Services, Guardian, etc.)</li>
                <li>Participating animals: photos, names, breed, and sex</li>
                <li>Your breeder profile and website link (if public)</li>
              </ul>
              <div className="mt-2 pt-2 border-t border-blue-500/20">
                <p className="text-xs text-blue-300 font-medium">
                  ✓ Anonymous users CANNOT view detailed animal profiles (pedigrees, health records, lineage) or send marketplace messages without creating an account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {analytics?.summary && (
          <PerformanceSummaryRow
            summary={analytics.summary}
            period="month"
            showSparklines={true}
            className="mb-6"
          />
        )}

        {/* Insights Callouts */}
        {visibleInsights.length > 0 && (
          <InsightsCallout
            insights={visibleInsights}
            onDismiss={handleDismissInsight}
            maxItems={3}
            className="mb-6"
          />
        )}

        {/* Basic Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-text-tertiary">Total Programs</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">{stats.published}</p>
            <p className="text-sm text-text-tertiary">Published</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-text-secondary">{stats.draft}</p>
            <p className="text-sm text-text-tertiary">Draft</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-400">{stats.totalParticipants}</p>
            <p className="text-sm text-text-tertiary">Total Animals</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter size={16} className="text-text-tertiary" />
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg text-white"
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg text-white"
          >
            <option value="ALL">All Templates</option>
            <option value="STUD_SERVICES">Stud Services</option>
            <option value="GUARDIAN">Guardian</option>
            <option value="TRAINED">Trained</option>
            <option value="REHOME">Rehome</option>
            <option value="CO_OWNERSHIP">Co-Ownership</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-portal-card rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchPrograms}>Try Again</Button>
          </div>
        )}

        {!loading && !error && programs.length === 0 && (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-text-secondary mb-2">No animal programs yet</p>
            <p className="text-sm text-text-tertiary mb-4">
              Create your first program to group multiple animals under a breeding program.
            </p>
            <Button variant="primary" onClick={() => navigate("/manage/animal-programs/new")}>
              <Plus size={16} className="mr-1.5" />
              Create First Program
            </Button>
          </div>
        )}

        {!loading && !error && programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                stats={programStatsMap.get(program.id)}
                onEdit={() => navigate(`/manage/animal-programs/${program.id}?edit=true`)}
                onDelete={() => handleDelete(program)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM CARD
// ═══════════════════════════════════════════════════════════════════════════

function ProgramCard({
  program,
  stats,
  onEdit,
  onDelete,
}: {
  program: AnimalProgram;
  stats?: ProgramStats;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const templateConfig = TEMPLATE_CONFIG[program.templateType] || {
    label: program.templateType,
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
  };

  const activeParticipants = program.participants.filter((p) => p.listed).length;

  return (
    <div className="bg-portal-card border border-border-subtle rounded-lg overflow-hidden hover:border-border-default transition-colors">
      {/* Image */}
      <div className="aspect-video bg-portal-surface relative">
        {program.coverImageUrl ? (
          <img
            src={program.coverImageUrl}
            alt={program.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
            {/* Subtle warm glow - purple/magenta to complement orange */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 65%)'
            }}></div>
            {/* Very subtle accent hints - teal and purple */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(20, 184, 166, 0.04) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
            }}></div>
            {/* Logo */}
            <div className="relative z-10 flex items-center justify-center">
              <img src={logoUrl} alt="BreederHQ" className="h-20 w-auto" />
            </div>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant={program.published ? "success" : "neutral"}>
            {program.published ? "Published" : "Draft"}
          </Badge>
        </div>
        {/* Stats badge overlay */}
        {stats && stats.viewsThisMonth > 0 && (
          <StatsBadgeOverlay
            viewsThisMonth={stats.viewsThisMonth}
            isTrending={stats.isTrending}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-1 ${templateConfig.color}`}>
              {templateConfig.label}
            </span>
            <h3 className="text-base font-semibold text-white">{program.name}</h3>
          </div>
        </div>

        {program.headline && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">{program.headline}</p>
        )}

        {/* Performance stats row */}
        {stats && (
          <div className="mb-3 pb-3 border-b border-border-subtle">
            <InlineCardStats
              viewsThisMonth={stats.viewsThisMonth}
              inquiriesThisMonth={stats.inquiriesThisMonth}
              isTrending={stats.isTrending}
              trendMultiplier={stats.trendMultiplier}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-text-tertiary">
            <Users size={14} />
            <span>{activeParticipants} active</span>
            <span className="text-text-tertiary">/ {program.participants.length} total</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-text-secondary hover:text-red-400 transition-colors rounded hover:bg-white/5"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
              title="View Details"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimalProgramsPage;

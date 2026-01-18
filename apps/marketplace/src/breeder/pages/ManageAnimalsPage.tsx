// apps/marketplace/src/breeder/pages/ManageAnimalsPage.tsx
// Direct Animal Listings Management Page - V2
//
// Manage individual animal listings for one-time sales or services

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Badge } from "@bhq/ui";
import {
  Users,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Filter,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Flame,
  X,
  Save,
  FileText,
  DollarSign,
  Settings,
  MapPin,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  Check,
  Copy,
} from "lucide-react";

import {
  getDirectListings,
  getDirectListing,
  deleteDirectListing,
  saveDirectListing,
  updateDirectListingStatus,
  getListingAnalytics,
  getAnimalListingData,
  type DirectAnimalListing,
  type DirectAnimalListingCreate,
  type TemplateType,
  type ListingAnalyticsResponse,
  type ListingStats,
  type DirectListingStatus,
  type DataDrawerConfig,
  type AnimalListingData,
} from "../../api/client";

import { DataDrawer } from "../components/DataDrawer";

import { PerformanceSummaryRow } from "../components/analytics/PerformanceSummaryRow";
import { InsightsCallout } from "../components/analytics/InsightsCallout";
import { InlineCardStats, StatsBadgeOverlay } from "../components/analytics/ProgramStatsOverlay";

import logoUrl from "@bhq/ui/assets/logo.png";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Note: We intentionally skip localStorage to avoid cross-user contamination
function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || "";
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

export function ManageAnimalsPage() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [listings, setListings] = React.useState<DirectAnimalListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = React.useState<string>("ALL");

  // Analytics state
  const [analytics, setAnalytics] = React.useState<ListingAnalyticsResponse | null>(null);
  const [dismissedInsights, setDismissedInsights] = React.useState<Set<string>>(new Set());

  // Selected listing for detail drawer
  const [selectedListing, setSelectedListing] = React.useState<DirectAnimalListing | null>(null);

  const fetchListings = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getDirectListings(tenantId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        templateType: templateFilter === "ALL" ? undefined : templateFilter,
      });
      setListings(response.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load animal listings");
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter, templateFilter]);

  // Fetch analytics data
  const fetchAnalytics = React.useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await getListingAnalytics(tenantId);
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to fetch listing analytics:", err);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchListings();
    fetchAnalytics();
  }, [fetchListings, fetchAnalytics]);

  // Create a map of listing stats by ID for quick lookup
  const listingStatsMap = React.useMemo(() => {
    const map = new Map<number, ListingStats>();
    if (analytics?.listingStats) {
      for (const stat of analytics.listingStats) {
        map.set(stat.listingId, stat);
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

  const handleDelete = async (listing: DirectAnimalListing) => {
    const animalName = listing.animal?.name || listing.headline || "this listing";
    if (!confirm(`Delete listing for "${animalName}"? This cannot be undone.`)) return;
    try {
      await deleteDirectListing(tenantId, listing.id);
      fetchListings();
    } catch (err: any) {
      alert(err.message || "Failed to delete listing");
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
    total: listings.length,
    live: listings.filter((l) => l.status === "ACTIVE").length,
    draft: listings.filter((l) => l.status === "DRAFT").length,
    paused: listings.filter((l) => l.status === "PAUSED").length,
  };

  return (
    <div className="min-h-screen bg-portal-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Individual Animals</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage individual animal listings for sale or placement
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/manage/individual-animals/new")}>
              <Plus size={16} className="mr-1.5" />
              New Listing
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
                Published listings are publicly visible to help buyers discover your animals. Here's what anonymous users can see:
              </p>
              <ul className="text-xs text-text-secondary ml-4 list-disc grid grid-cols-2 gap-x-4 gap-y-1">
                <li>Animal name, photos, and headline</li>
                <li>Pricing information and location (city/state)</li>
                <li>Template type (Stud Services, Guardian, etc.)</li>
                <li>Breed, sex, and basic animal info</li>
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
            <p className="text-sm text-text-tertiary">Total Listings</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">{stats.live}</p>
            <p className="text-sm text-text-tertiary">Live</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-text-secondary">{stats.draft}</p>
            <p className="text-sm text-text-tertiary">Draft</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-400">{stats.paused}</p>
            <p className="text-sm text-text-tertiary">Paused</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter size={16} className="text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg text-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="PAUSED">Paused</option>
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
            <Button variant="secondary" onClick={fetchListings}>Try Again</Button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                stats={listingStatsMap.get(listing.id)}
                onEdit={() => setSelectedListing(listing)}
                onDelete={() => handleDelete(listing)}
              />
            ))}
          </div>
        )}

        {/* Listing Detail Drawer */}
        {selectedListing && (
          <ListingDetailDrawer
            tenantId={tenantId}
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onSaved={() => {
              setSelectedListing(null);
              fetchListings();
            }}
            onListingUpdated={(updatedListing) => {
              // Update the listings array with the new data so reopening shows correct state
              setListings((prev) =>
                prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
              );
              // Also update selectedListing so current drawer has latest data
              setSelectedListing(updatedListing);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTING DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════

type DrawerTab = "overview" | "content" | "pricing" | "data" | "settings" | "preview";

const DRAWER_TABS: { id: DrawerTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Eye size={16} /> },
  { id: "content", label: "Content", icon: <FileText size={16} /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign size={16} /> },
  { id: "data", label: "Data", icon: <FileText size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  { id: "preview", label: "Preview", icon: <Globe size={16} /> },
];

function ListingDetailDrawer({
  tenantId,
  listing,
  onClose,
  onSaved,
  onListingUpdated,
}: {
  tenantId: string;
  listing: DirectAnimalListing;
  onClose: () => void;
  onSaved: () => void;
  onListingUpdated: (updatedListing: DirectAnimalListing) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<DrawerTab>("overview");
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Data Drawer state
  const [animalData, setAnimalData] = React.useState<AnimalListingData | null>(null);
  const [loadingAnimalData, setLoadingAnimalData] = React.useState(false);

  // Form state
  const [form, setForm] = React.useState({
    slug: listing.slug,
    headline: listing.headline || "",
    title: listing.title || "",
    summary: listing.summary || "",
    description: listing.description || "",
    priceModel: listing.priceModel || "inquire",
    priceCents: listing.priceCents ?? null,
    priceMinCents: listing.priceMinCents ?? null,
    priceMaxCents: listing.priceMaxCents ?? null,
    locationCity: listing.locationCity || "",
    locationRegion: listing.locationRegion || "",
    locationCountry: listing.locationCountry || "US", // ISO 2-letter country code
    status: listing.status,
    listed: listing.listed ?? true,
    dataDrawerConfig: listing.dataDrawerConfig as DataDrawerConfig || {},
  });

  // Track changes
  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Track previous dataDrawerConfig to detect changes
  const prevDataDrawerConfigRef = React.useRef<DataDrawerConfig>(form.dataDrawerConfig);

  // IMMEDIATE save for dataDrawerConfig changes (no debounce)
  React.useEffect(() => {
    const configChanged = JSON.stringify(form.dataDrawerConfig) !== JSON.stringify(prevDataDrawerConfigRef.current);

    if (configChanged && !saving) {
      prevDataDrawerConfigRef.current = form.dataDrawerConfig;

      const saveConfig = async () => {
        const input: DirectAnimalListingCreate = {
          id: listing.id,
          animalId: listing.animalId,
          slug: form.slug.trim(),
          templateType: listing.templateType,
          status: form.status as DirectListingStatus,
          listed: form.listed,
          headline: form.headline.trim() || undefined,
          title: form.title.trim() || undefined,
          summary: form.summary.trim() || undefined,
          description: form.description.trim() || undefined,
          priceModel: form.priceModel as "fixed" | "range" | "inquire",
          priceCents: form.priceModel === "fixed" ? form.priceCents : undefined,
          priceMinCents: form.priceModel === "range" ? form.priceMinCents : undefined,
          priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : undefined,
          locationCity: form.locationCity.trim() || undefined,
          locationRegion: form.locationRegion.trim() || undefined,
          locationCountry: form.locationCountry || undefined,
          dataDrawerConfig: form.dataDrawerConfig,
        };

        try {
          const savedListing = await saveDirectListing(tenantId, input);
          setHasChanges(false);
          // Update the parent's listings array so reopening the drawer shows correct data
          onListingUpdated(savedListing);
        } catch (err: any) {
          console.error("DataDrawerConfig save failed:", err);
        }
      };

      saveConfig();
    }
  }, [form.dataDrawerConfig, saving, form, listing, tenantId, onListingUpdated]);

  // Auto-save OTHER changes with debounce (not dataDrawerConfig)
  React.useEffect(() => {
    if (!hasChanges || saving) return;

    const timeoutId = setTimeout(async () => {
      const input: DirectAnimalListingCreate = {
        id: listing.id,
        animalId: listing.animalId,
        slug: form.slug.trim(),
        templateType: listing.templateType,
        status: form.status as DirectListingStatus,
        listed: form.listed,
        headline: form.headline.trim() || undefined,
        title: form.title.trim() || undefined,
        summary: form.summary.trim() || undefined,
        description: form.description.trim() || undefined,
        priceModel: form.priceModel as "fixed" | "range" | "inquire",
        priceCents: form.priceModel === "fixed" ? form.priceCents : undefined,
        priceMinCents: form.priceModel === "range" ? form.priceMinCents : undefined,
        priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : undefined,
        locationCity: form.locationCity.trim() || undefined,
        locationRegion: form.locationRegion.trim() || undefined,
        locationCountry: form.locationCountry || undefined,
        dataDrawerConfig: form.dataDrawerConfig,
      };

      try {
        console.log("Auto-saving other changes");
        await saveDirectListing(tenantId, input);
        setHasChanges(false);
      } catch (err: any) {
        console.error("Auto-save failed:", err);
        console.error("Failed payload:", input);
        // Silent fail - user can still manually save
      }
    }, 500); // 500ms debounce for other fields

    return () => clearTimeout(timeoutId);
  }, [hasChanges, saving, form, listing, tenantId]);

  // Fetch animal data when data tab is selected
  React.useEffect(() => {
    if (activeTab === "data" && !animalData && !loadingAnimalData) {
      setLoadingAnimalData(true);
      getAnimalListingData(tenantId, listing.animalId)
        .then((data) => setAnimalData(data))
        .catch((err) => console.error("Failed to load animal data:", err))
        .finally(() => setLoadingAnimalData(false));
    }
  }, [activeTab, animalData, loadingAnimalData, tenantId, listing.animalId]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      const input: DirectAnimalListingCreate = {
        id: listing.id,
        animalId: listing.animalId,
        slug: form.slug.trim(),
        templateType: listing.templateType,
        status: form.status as DirectListingStatus,
        listed: form.listed,
        headline: form.headline.trim() || undefined,
        title: form.title.trim() || undefined,
        summary: form.summary.trim() || undefined,
        description: form.description.trim() || undefined,
        priceModel: form.priceModel as "fixed" | "range" | "inquire",
        priceCents: form.priceModel === "fixed" ? form.priceCents : undefined,
        priceMinCents: form.priceModel === "range" ? form.priceMinCents : undefined,
        priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : undefined,
        locationCity: form.locationCity.trim() || undefined,
        locationRegion: form.locationRegion.trim() || undefined,
        locationCountry: form.locationCountry || undefined,
        dataDrawerConfig: form.dataDrawerConfig,
      };
      await saveDirectListing(tenantId, input);
      setHasChanges(false);
      onSaved();
    } catch (err: any) {
      alert(err.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (newStatus: DirectListingStatus) => {
    setSaving(true);
    try {
      await updateDirectListingStatus(tenantId, listing.id, newStatus);
      updateForm({ status: newStatus });
      onSaved();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // Handle background click
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const templateConfig = TEMPLATE_CONFIG[listing.templateType] || {
    label: listing.templateType,
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
  };

  const animal = listing.animal;
  const isLive = form.status === "ACTIVE";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-portal-card border border-border-subtle rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            {/* Animal photo */}
            {animal?.photoUrl ? (
              <img
                src={animal.photoUrl}
                alt={animal.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-portal-surface flex items-center justify-center">
                <Users className="w-7 h-7 text-text-tertiary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${templateConfig.color}`}>
                  {templateConfig.label}
                </span>
                <Badge variant={isLive ? "success" : "neutral"}>
                  {isLive ? "Live" : form.status === "PAUSED" ? "Paused" : "Draft"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-white">{animal?.name || "Untitled"}</h2>
              <p className="text-sm text-text-tertiary">
                {animal?.breed || "Unknown breed"} • {animal?.sex || "Unknown"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-white hover:bg-portal-surface rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-border-subtle">
          {DRAWER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-portal-surface text-white border-b-2 border-accent"
                  : "text-text-secondary hover:text-white hover:bg-portal-surface/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <OverviewTab
              listing={listing}
              form={form}
              updateForm={updateForm}
              templateConfig={templateConfig}
              onStatusToggle={handleStatusToggle}
              saving={saving}
            />
          )}
          {activeTab === "content" && (
            <ContentTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "pricing" && (
            <PricingTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "data" && (
            <DataTab
              animalData={animalData}
              loadingAnimalData={loadingAnimalData}
              initialConfig={form.dataDrawerConfig}
              onConfigChange={(config) => updateForm({ dataDrawerConfig: config })}
              listing={listing}
              form={form}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "preview" && (
            <PreviewTab listing={listing} form={form} templateConfig={templateConfig} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-subtle bg-portal-surface/50">
          <div className="text-sm text-text-tertiary">
            {hasChanges ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-amber-400">Auto-saving draft...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-green-400">All changes saved</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAWER TABS
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({
  listing,
  form,
  updateForm,
  templateConfig,
  onStatusToggle,
  saving,
}: {
  listing: DirectAnimalListing;
  form: any;
  updateForm: (u: any) => void;
  templateConfig: { label: string; color: string };
  onStatusToggle: (status: DirectListingStatus) => void;
  saving: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const animal = listing.animal;
  const isLive = form.status === "ACTIVE";
  const listingUrl = `/animals/${listing.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + listingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status & Actions */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Listing Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isLive ? "bg-green-500" : form.status === "PAUSED" ? "bg-amber-500" : "bg-gray-500"}`} />
            <div>
              <p className="text-white font-medium">
                {isLive ? "Published & Live" : form.status === "PAUSED" ? "Paused" : "Draft"}
              </p>
              <p className="text-sm text-text-tertiary">
                {isLive
                  ? "This listing is visible to buyers on the marketplace"
                  : form.status === "PAUSED"
                  ? "This listing is temporarily hidden from the marketplace"
                  : "This listing is not yet published"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLive ? (
              <Button
                variant="secondary"
                onClick={() => onStatusToggle("PAUSED")}
                disabled={saving}
              >
                Pause Listing
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => onStatusToggle("ACTIVE")}
                disabled={saving}
              >
                {form.status === "DRAFT" ? "Publish Now" : "Unpause"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Listing URL */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Listing URL</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-portal-card border border-border-subtle rounded-lg">
            <LinkIcon size={16} className="text-text-tertiary flex-shrink-0" />
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              className="flex-1 bg-transparent text-white text-sm outline-none"
              placeholder="listing-url-slug"
            />
          </div>
          <Button variant="secondary" onClick={copyUrl}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
          {isLive && (
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-secondary hover:text-white transition-colors"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Full URL: {window.location.origin}{listingUrl}
        </p>
      </div>

      {/* Animal Info (Read-only) */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Animal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-tertiary mb-1">Name</p>
            <p className="text-white">{animal?.name || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Breed</p>
            <p className="text-white">{animal?.breed || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Sex</p>
            <p className="text-white">{animal?.sex || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Species</p>
            <p className="text-white">{animal?.species || "Unknown"}</p>
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-4">
          To update animal details, edit the animal record directly in your animal management.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{listing.viewCount || 0}</p>
          <p className="text-xs text-text-tertiary">Total Views</p>
        </div>
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{listing.inquiryCount || 0}</p>
          <p className="text-xs text-text-tertiary">Inquiries</p>
        </div>
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : "—"}
          </p>
          <p className="text-xs text-text-tertiary">Created</p>
        </div>
      </div>
    </div>
  );
}

function ContentTab({ form, updateForm }: { form: any; updateForm: (u: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Headline
          <span className="text-text-tertiary font-normal ml-2">(Displayed prominently on listing)</span>
        </label>
        <input
          type="text"
          value={form.headline}
          onChange={(e) => updateForm({ headline: e.target.value })}
          className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
          placeholder="e.g., Champion bloodline stud available for breeding"
          maxLength={200}
        />
        <p className="text-xs text-text-tertiary mt-1">{form.headline.length}/200 characters</p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Title
          <span className="text-text-tertiary font-normal ml-2">(Optional page title)</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateForm({ title: e.target.value })}
          className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
          placeholder="Optional title for the listing page"
          maxLength={100}
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Summary
          <span className="text-text-tertiary font-normal ml-2">(Brief description for cards/previews)</span>
        </label>
        <textarea
          value={form.summary}
          onChange={(e) => updateForm({ summary: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent resize-none"
          placeholder="A brief 1-2 sentence summary..."
          maxLength={500}
        />
        <p className="text-xs text-text-tertiary mt-1">{form.summary.length}/500 characters</p>
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Full Description
          <span className="text-text-tertiary font-normal ml-2">(Detailed information for the listing page)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          rows={8}
          className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent resize-none"
          placeholder="Provide detailed information about this animal, their qualities, requirements, and what makes them special..."
        />
        <p className="text-xs text-text-tertiary mt-1">
          Supports basic formatting. {form.description.length} characters
        </p>
      </div>
    </div>
  );
}

function PricingTab({ form, updateForm }: { form: any; updateForm: (u: any) => void }) {
  const formatPrice = (cents: number | null) => {
    if (cents === null || cents === undefined) return "";
    return (cents / 100).toFixed(2);
  };

  const parsePrice = (value: string): number | null => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return Math.round(num * 100);
  };

  return (
    <div className="space-y-6">
      {/* Price Model */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Pricing Model</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "fixed", label: "Fixed Price", desc: "Set a specific price" },
            { value: "range", label: "Price Range", desc: "Show a min-max range" },
            { value: "inquire", label: "Contact for Price", desc: "Buyers must inquire" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateForm({ priceModel: option.value })}
              className={`p-4 rounded-lg border text-left transition-all ${
                form.priceModel === option.value
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-portal-surface hover:border-border-default"
              }`}
            >
              <p className={`font-medium ${form.priceModel === option.value ? "text-accent" : "text-white"}`}>
                {option.label}
              </p>
              <p className="text-xs text-text-tertiary mt-1">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Price Input */}
      {form.priceModel === "fixed" && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">Price</label>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formatPrice(form.priceCents)}
              onChange={(e) => updateForm({ priceCents: parsePrice(e.target.value) })}
              className="w-48 px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
              placeholder="0.00"
            />
            <span className="text-text-tertiary">USD</span>
          </div>
        </div>
      )}

      {/* Price Range Inputs */}
      {form.priceModel === "range" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Minimum Price</label>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formatPrice(form.priceMinCents)}
                onChange={(e) => updateForm({ priceMinCents: parsePrice(e.target.value) })}
                className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Maximum Price</label>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formatPrice(form.priceMaxCents)}
                onChange={(e) => updateForm({ priceMaxCents: parsePrice(e.target.value) })}
                className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Location */}
      <div className="pt-4 border-t border-border-subtle">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin size={16} />
          Location
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">City</label>
            <input
              type="text"
              value={form.locationCity}
              onChange={(e) => updateForm({ locationCity: e.target.value })}
              className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
              placeholder="e.g., Denver"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">State/Region</label>
            <input
              type="text"
              value={form.locationRegion}
              onChange={(e) => updateForm({ locationRegion: e.target.value })}
              className="w-full px-4 py-2.5 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent"
              placeholder="e.g., Colorado"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ form, updateForm }: { form: any; updateForm: (u: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Visibility Settings</h3>

        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.listed}
            onChange={(e) => updateForm({ listed: e.target.checked })}
            className="w-5 h-5 rounded border-border-subtle bg-portal-card text-accent focus:ring-accent focus:ring-offset-0 mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1">Show in marketplace search</div>
            <p className="text-xs text-text-secondary">
              When enabled, this listing will appear in marketplace search results and browse pages.
              When disabled, the listing is only accessible via direct link.
            </p>
          </div>
        </label>
      </div>

      {/* Status Management */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Listing Status</h3>

        <div className="space-y-3">
          {[
            { value: "DRAFT", label: "Draft", desc: "Not visible to anyone. Work in progress." },
            { value: "ACTIVE", label: "Active / Live", desc: "Published and visible to buyers." },
            { value: "PAUSED", label: "Paused", desc: "Temporarily hidden from marketplace." },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                form.status === option.value
                  ? "border-accent bg-accent/5"
                  : "border-border-subtle hover:border-border-default"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={form.status === option.value}
                onChange={(e) => updateForm({ status: e.target.value })}
                className="w-4 h-4 text-accent focus:ring-accent focus:ring-offset-0 mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{option.label}</div>
                <p className="text-xs text-text-tertiary">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-text-secondary mb-4">
          Deleting this listing is permanent and cannot be undone. All listing data, analytics, and history will be lost.
        </p>
        <Button variant="secondary" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
          <Trash2 size={16} className="mr-1.5" />
          Delete Listing
        </Button>
      </div>
    </div>
  );
}

function DataTab({
  animalData,
  loadingAnimalData,
  initialConfig,
  onConfigChange,
  listing,
  form,
}: {
  animalData: AnimalListingData | null;
  loadingAnimalData: boolean;
  initialConfig: DataDrawerConfig;
  onConfigChange: (config: DataDrawerConfig) => void;
  listing: DirectAnimalListing;
  form: any;
}) {
  const [previewMode, setPreviewMode] = React.useState(false);

  if (loadingAnimalData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading animal data...</p>
        </div>
      </div>
    );
  }

  if (!animalData) {
    return (
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-6 text-center">
        <p className="text-text-secondary">Failed to load animal data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-blue-300">Customize Listing Data</h3>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              previewMode
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "bg-portal-card text-text-secondary border border-border-subtle hover:border-blue-500/30"
            }`}
          >
            {previewMode ? <Eye size={14} /> : <EyeOff size={14} />}
            {previewMode ? "Viewing Preview" : "Show Preview"}
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          {previewMode
            ? "Preview how your listing will appear to buyers with the current data selections."
            : "Select which animal data sections and specific items to include in this marketplace listing. Changes are auto-saved as drafts."}
        </p>
      </div>

      {!previewMode ? (
        /* Embedded Data Drawer (without modal) */
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-4">
          <DataDrawer
            open={true}
            onClose={() => {}} // No-op since we're embedding
            animalData={animalData}
            initialConfig={initialConfig}
            onSave={onConfigChange}
            embedded={true}
          />
        </div>
      ) : (
        /* Live Preview */
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <DataPreview
            listing={listing}
            form={form}
            animalData={animalData}
            config={initialConfig}
          />
        </div>
      )}
    </div>
  );
}

function DataPreview({
  listing,
  form,
  animalData,
  config,
}: {
  listing: DirectAnimalListing;
  form: any;
  animalData: AnimalListingData;
  config: DataDrawerConfig;
}) {
  const animal = listing.animal;

  // Helper to check if section is enabled
  const isSectionEnabled = (sectionKey: string): boolean => {
    return config[sectionKey as keyof DataDrawerConfig]?.enabled === true;
  };

  // Count enabled sections
  const enabledSections = Object.keys(config).filter((key) =>
    config[key as keyof DataDrawerConfig]?.enabled === true
  );

  return (
    <div className="space-y-6">
      <div className="text-center py-4 border-b border-border-subtle">
        <h3 className="text-lg font-bold text-white mb-1">Live Preview</h3>
        <p className="text-sm text-text-secondary">
          Showing {enabledSections.length} data section{enabledSections.length !== 1 ? 's' : ''} enabled for this listing
        </p>
      </div>

      {enabledSections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h4 className="text-lg font-semibold text-white mb-2">No Data Sections Enabled</h4>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Toggle some sections on in the Data tab to see how they'll appear in your listing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Registry Section */}
          {isSectionEnabled('registry') && animalData.registrations.length > 0 && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📋</span> Registry
              </h3>
              <div className="space-y-2">
                {animalData.registrations
                  .filter(reg =>
                    !config.registry?.registryIds ||
                    config.registry.registryIds.length === 0 ||
                    config.registry.registryIds.includes(reg.id)
                  )
                  .map(reg => (
                    <div key={reg.id} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                      <span className="text-sm text-text-secondary">{reg.registryName}</span>
                      <span className="text-sm font-medium text-white">{reg.identifier}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Health Section */}
          {isSectionEnabled('health') && animalData.health.eligibleTraits.length > 0 && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>❤️</span> Health Testing
              </h3>
              <div className="space-y-2">
                {animalData.health.eligibleTraits
                  .filter(trait =>
                    !config.health?.traitIds ||
                    config.health.traitIds.length === 0 ||
                    config.health.traitIds.includes(trait.id)
                  )
                  .map(trait => (
                    <div key={trait.id} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                      <span className="text-sm text-text-secondary">{trait.displayName}</span>
                      <span className="text-sm font-medium text-white">{String(trait.value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Genetics Section */}
          {isSectionEnabled('genetics') && animalData.genetics.data && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🧬</span> Genetics
              </h3>
              <div className="space-y-3">
                {config.genetics?.showBreedComposition && animalData.genetics.data.breedComposition && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Breed Composition</p>
                    <p className="text-sm text-white">{JSON.stringify(animalData.genetics.data.breedComposition)}</p>
                  </div>
                )}
                {config.genetics?.showCoatColor && animalData.genetics.data.coatColorData && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Coat Color</p>
                    <p className="text-sm text-white">{JSON.stringify(animalData.genetics.data.coatColorData)}</p>
                  </div>
                )}
                {config.genetics?.showHealthGenetics && animalData.genetics.data.healthGeneticsData && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Health Genetics</p>
                    <p className="text-sm text-white">{JSON.stringify(animalData.genetics.data.healthGeneticsData)}</p>
                  </div>
                )}
                {config.genetics?.showCOI && animalData.genetics.data.coi && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Coefficient of Inbreeding (COI)</p>
                    <p className="text-sm text-white">{animalData.genetics.data.coi}%</p>
                  </div>
                )}
                {config.genetics?.showPredictedWeight && animalData.genetics.data.predictedAdultWeight && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Predicted Adult Weight</p>
                    <p className="text-sm text-white">{animalData.genetics.data.predictedAdultWeight} lbs</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {isSectionEnabled('achievements') && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🏆</span> Achievements
              </h3>
              {animalData.titles.eligibleTitles.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Titles</h4>
                  <div className="flex flex-wrap gap-2">
                    {animalData.titles.eligibleTitles
                      .filter(title =>
                        !config.achievements?.titleIds ||
                        config.achievements.titleIds.length === 0 ||
                        config.achievements.titleIds.includes(title.id)
                      )
                      .map(title => (
                        <span key={title.id} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                          {title.abbreviation}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {animalData.competitions.eligibleCompetitions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Competition Results</h4>
                  <div className="space-y-2">
                    {animalData.competitions.eligibleCompetitions
                      .filter(comp =>
                        !config.achievements?.competitionIds ||
                        config.achievements.competitionIds.length === 0 ||
                        config.achievements.competitionIds.includes(comp.id)
                      )
                      .slice(0, 3)
                      .map(comp => (
                        <div key={comp.id} className="text-sm">
                          <span className="text-white font-medium">{comp.eventName}</span>
                          <span className="text-text-secondary ml-2">• {comp.placementLabel || `#${comp.placement}`}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lineage Section */}
          {isSectionEnabled('lineage') && (animalData.lineage.sire || animalData.lineage.dam) && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🌳</span> Lineage
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {config.lineage?.showSire && animalData.lineage.sire && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Sire</p>
                    <p className="text-white font-medium">{animalData.lineage.sire.name}</p>
                    {animalData.lineage.sire.titles && (
                      <p className="text-xs text-blue-300 mt-1">{animalData.lineage.sire.titles}</p>
                    )}
                  </div>
                )}
                {config.lineage?.showDam && animalData.lineage.dam && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Dam</p>
                    <p className="text-white font-medium">{animalData.lineage.dam.name}</p>
                    {animalData.lineage.dam.titles && (
                      <p className="text-xs text-blue-300 mt-1">{animalData.lineage.dam.titles}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Section */}
          {isSectionEnabled('media') && animalData.media.items.length > 0 && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📸</span> Media
              </h3>
              <p className="text-sm text-text-secondary">
                {config.media?.mediaIds?.length || animalData.media.items.length} photo{(config.media?.mediaIds?.length || animalData.media.items.length) !== 1 ? 's' : ''} will be shown
              </p>
            </div>
          )}

          {/* Documents Section */}
          {isSectionEnabled('documents') && animalData.documents.items.length > 0 && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📄</span> Documents
              </h3>
              <div className="space-y-2">
                {animalData.documents.items
                  .filter(doc =>
                    !config.documents?.documentIds ||
                    config.documents.documentIds.length === 0 ||
                    config.documents.documentIds.includes(doc.id)
                  )
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                      <span className="text-sm text-text-secondary">{doc.title}</span>
                      <span className="text-xs text-text-tertiary">{doc.kind}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Breeding Section */}
          {isSectionEnabled('breeding') && (
            <div className="bg-portal-card border border-border-subtle rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🐾</span> Breeding History
              </h3>
              {config.breeding?.showOffspringCount && (
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Offspring Count</p>
                  <p className="text-white font-medium">{animalData.breeding.offspringCount || 0}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewTab({
  listing,
  form,
  templateConfig,
}: {
  listing: DirectAnimalListing;
  form: any;
  templateConfig: { label: string; color: string };
}) {
  const animal = listing.animal;

  const formatPrice = () => {
    if (form.priceModel === "inquire") return "Contact for pricing";
    if (form.priceModel === "fixed" && form.priceCents) {
      return `$${(form.priceCents / 100).toLocaleString()}`;
    }
    if (form.priceModel === "range" && form.priceMinCents && form.priceMaxCents) {
      return `$${(form.priceMinCents / 100).toLocaleString()} – $${(form.priceMaxCents / 100).toLocaleString()}`;
    }
    return "Contact for pricing";
  };

  return (
    <div className="space-y-6">
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-4 mb-4">
        <p className="text-sm text-text-secondary">
          This is a preview of how your listing will appear to buyers on the marketplace.
        </p>
      </div>

      {/* Preview Card */}
      <div className="bg-portal-card border border-border-subtle rounded-xl overflow-hidden max-w-md">
        {/* Image */}
        <div className="aspect-video bg-portal-surface relative">
          {animal?.photoUrl ? (
            <img
              src={animal.photoUrl}
              alt={animal.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0a0a0a]">
              <Users className="w-16 h-16 text-text-tertiary" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${templateConfig.color}`}>
              {templateConfig.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white mb-1">{animal?.name || "Animal Name"}</h3>
          {form.headline && (
            <p className="text-sm text-text-secondary mb-3">{form.headline}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <p className="text-lg font-bold text-accent">{formatPrice()}</p>
            {(form.locationCity || form.locationRegion) && (
              <p className="text-sm text-text-tertiary flex items-center gap-1">
                <MapPin size={14} />
                {[form.locationCity, form.locationRegion].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span>{animal?.breed || "Unknown breed"}</span>
            {animal?.sex && (
              <>
                <span>•</span>
                <span>{animal.sex}</span>
              </>
            )}
          </div>

          {form.summary && (
            <p className="text-sm text-text-secondary mt-3 line-clamp-2">{form.summary}</p>
          )}
        </div>
      </div>

      {/* Full Page Preview Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">Full Listing Preview</h4>
        <p className="text-xs text-text-secondary">
          Save your changes and use the external link in the Overview tab to see the full public listing page.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTING CARD
// ═══════════════════════════════════════════════════════════════════════════

function ListingCard({
  listing,
  stats,
  onEdit,
  onDelete,
}: {
  listing: DirectAnimalListing;
  stats?: ListingStats;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const templateConfig = TEMPLATE_CONFIG[listing.templateType] || {
    label: listing.templateType,
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
  };

  const animalName = listing.animal?.name || "Untitled";
  const photoUrl = listing.animal?.photoUrl;
  const isLive = listing.status === "ACTIVE";

  return (
    <div
      className="bg-portal-card border border-border-subtle rounded-lg overflow-hidden hover:border-border-default transition-colors cursor-pointer"
      onClick={onEdit}
    >
      {/* Image */}
      <div className="aspect-video bg-portal-surface relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={animalName}
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
          <Badge variant={isLive ? "success" : "neutral"}>
            {isLive ? "Live" : listing.status === "PAUSED" ? "Paused" : "Draft"}
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
            <h3 className="text-base font-semibold text-white">{animalName}</h3>
          </div>
        </div>

        {listing.headline && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">{listing.headline}</p>
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
            <span>{listing.animal?.breed || "Unknown breed"}</span>
            {listing.animal?.sex && <span className="text-text-tertiary">• {listing.animal.sex}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-text-secondary hover:text-red-400 transition-colors rounded hover:bg-white/5"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
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

export default ManageAnimalsPage;

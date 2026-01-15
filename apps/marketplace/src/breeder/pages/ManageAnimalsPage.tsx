// apps/marketplace/src/breeder/pages/ManageAnimalsPage.tsx
// Animal Listings Management Page - V2
//
// Two-path marketplace management:
// 1. Direct Listings - Individual animal listings (one-time sales/services)
// 2. Animal Programs - Grouped offerings (ongoing breeding programs)

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Badge } from "@bhq/ui";
import {
  Dog,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Filter,
  ArrowLeft,
  AlertCircle,
  X,
  ChevronRight,
  Sparkles,
  Users,
  PawPrint,
} from "lucide-react";

import {
  getDirectListings,
  saveDirectListing,
  updateDirectListingStatus,
  deleteDirectListing,
  type DirectAnimalListing,
  type DirectAnimalListingCreate,
  type TemplateType,
  type DirectListingStatus,
  type DataDrawerConfig,
} from "../../api/client";

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

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const TEMPLATE_CONFIG: Record<TemplateType, { label: string; color: string }> = {
  STUD_SERVICES: { label: "Stud", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  CO_OWNERSHIP: { label: "Co-Own", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  CUSTOM: { label: "Custom", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
};

const STATUS_CONFIG: Record<DirectListingStatus, { label: string; variant: "success" | "amber" | "neutral" | "red" }> = {
  ACTIVE: { label: "Live", variant: "success" },
  DRAFT: { label: "Draft", variant: "neutral" },
  PAUSED: { label: "Paused", variant: "amber" },
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
  const [editing, setEditing] = React.useState<DirectAnimalListing | null>(null);

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

  React.useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleToggleStatus = async (listing: DirectAnimalListing) => {
    const newStatus: DirectListingStatus = listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await updateDirectListingStatus(tenantId, listing.id, newStatus);
      fetchListings();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
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
          <Dog className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: listings.length,
    live: listings.filter((l) => l.status === "ACTIVE").length,
    draft: listings.filter((l) => l.status === "DRAFT").length,
  };

  return (
    <div className="min-h-screen bg-portal-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Animal Listings</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage individual listings and breeding programs
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/manage/animals-direct/new")}>
              <Plus size={16} className="mr-1.5" />
              New Listing
            </Button>
          </div>
        </div>

        {/* Main Navigation Cards - Prominent Focus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Direct Listings Card */}
          <div className="bg-gradient-to-br from-purple-500/10 via-portal-card to-portal-surface border-l-4 border-l-purple-500 rounded-xl overflow-hidden hover:border-l-purple-400 transition-all group cursor-pointer shadow-lg hover:shadow-purple-500/20">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Direct Listings</h3>
              <p className="text-sm text-text-tertiary mb-4">
                Individual animal listings for one-time sales or services
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border-subtle">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-text-tertiary">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.live}</div>
                  <div className="text-xs text-text-tertiary">Live</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-secondary">{stats.draft}</div>
                  <div className="text-xs text-text-tertiary">Draft</div>
                </div>
              </div>
            </div>
          </div>

          {/* Animal Programs Card */}
          <Link
            to="/manage/animal-programs"
            className="bg-gradient-to-br from-blue-500/10 via-portal-card to-portal-surface border-l-4 border-l-blue-500 rounded-xl overflow-hidden hover:border-l-blue-400 transition-all group shadow-lg hover:shadow-blue-500/20"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Animal Programs</h3>
              <p className="text-sm text-text-tertiary mb-4">
                STUD, REHOME, GUARDIAN, and other recurring programs
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Programs
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Breeding Programs Card */}
          <Link
            to="/manage/breeding-programs"
            className="bg-gradient-to-br from-amber-500/10 via-portal-card to-portal-surface border-l-4 border-l-amber-500 rounded-xl overflow-hidden hover:border-l-amber-400 transition-all group shadow-lg hover:shadow-amber-500/20"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                  <PawPrint className="w-8 h-8 text-amber-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Breeding Programs</h3>
              <p className="text-sm text-text-tertiary mb-4">
                Offspring groups from your breeding plans
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Programs
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Privacy Info - Compact */}
        <div className="mb-6 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-blue-300">Public listings</span> show animal names, photos, pricing, and location.
                <span className="text-blue-300 font-medium ml-1">Detailed profiles require account creation.</span>
              </p>
            </div>
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

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <Dog className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-text-secondary mb-2">No direct listings yet</p>
            <p className="text-sm text-text-tertiary mb-4">
              Create your first animal listing to showcase studs, rehomes, or other animals.
            </p>
            <Button variant="primary" onClick={() => navigate("/manage/animals-direct/new")}>
              <Plus size={16} className="mr-1.5" />
              Create First Listing
            </Button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onToggleStatus={() => handleToggleStatus(listing)}
                onEdit={() => setEditing(listing)}
                onDelete={() => handleDelete(listing)}
              />
            ))}
          </div>
        )}

        {/* Edit Drawer */}
        {editing && (
          <ListingEditDrawer
            tenantId={tenantId}
            listing={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchListings();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTING CARD
// ═══════════════════════════════════════════════════════════════════════════

function ListingCard({
  listing,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  listing: DirectAnimalListing;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const templateConfig = TEMPLATE_CONFIG[listing.templateType] || {
    label: listing.templateType,
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
  };
  const statusConfig = STATUS_CONFIG[listing.status] || {
    label: listing.status,
    variant: "neutral" as const
  };

  const animalName = listing.animal?.name || "Untitled";
  const animalBreed = listing.animal?.breed;
  const animalSex = listing.animal?.sex;
  const photoUrl = listing.animal?.photoUrl;

  return (
    <div className="bg-portal-card border border-border-subtle rounded-lg overflow-hidden hover:border-border-default transition-colors">
      {/* Image */}
      <div className="aspect-video bg-portal-surface relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={animalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dog className="w-12 h-12 text-text-tertiary" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-1 ${templateConfig.color}`}>
              {templateConfig.label}
            </span>
            <h3 className="text-base font-semibold text-white">
              {animalName}
            </h3>
          </div>
        </div>

        {listing.headline && (
          <p className="text-sm text-text-secondary line-clamp-1 mb-2">{listing.headline}</p>
        )}

        <div className="flex items-center gap-3 text-sm text-text-tertiary mb-3">
          {animalBreed && <span>{animalBreed}</span>}
          {animalSex && <span>• {animalSex}</span>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-accent font-medium">
            {listing.priceModel === "inquire"
              ? "Contact for price"
              : listing.priceModel === "fixed" && listing.priceCents
              ? formatPrice(listing.priceCents)
              : listing.priceModel === "range" && listing.priceMinCents && listing.priceMaxCents
              ? `${formatPrice(listing.priceMinCents)} - ${formatPrice(listing.priceMaxCents)}`
              : "—"
            }
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleStatus}
              className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
              title={listing.status === "ACTIVE" ? "Pause" : "Publish"}
            >
              {listing.status === "ACTIVE" ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTING EDIT DRAWER
// ═══════════════════════════════════════════════════════════════════════════

function ListingEditDrawer({
  tenantId,
  listing,
  onClose,
  onSaved,
}: {
  tenantId: string;
  listing: DirectAnimalListing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"basic" | "content" | "pricing">("basic");

  const [form, setForm] = React.useState({
    animalId: listing.animalId,
    slug: listing.slug,
    templateType: listing.templateType,
    status: listing.status,
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
    locationCountry: listing.locationCountry || "USA",
    listed: listing.listed ?? true,
  });

  const selectedAnimal = listing.animal;

  const handleSave = async () => {
    if (!form.slug.trim()) {
      alert("Please enter a slug");
      return;
    }

    setSaving(true);
    try {
      const input: DirectAnimalListingCreate = {
        id: listing.id,
        animalId: form.animalId,
        slug: form.slug.trim(),
        templateType: form.templateType,
        status: form.status,
        listed: form.listed,
        headline: form.headline.trim() || undefined,
        title: form.title.trim() || undefined,
        summary: form.summary.trim() || undefined,
        description: form.description.trim() || undefined,
        priceModel: form.priceModel,
        priceCents: form.priceModel === "fixed" ? (form.priceCents || undefined) : undefined,
        priceMinCents: form.priceModel === "range" ? (form.priceMinCents || undefined) : undefined,
        priceMaxCents: form.priceModel === "range" ? (form.priceMaxCents || undefined) : undefined,
        locationCity: form.locationCity.trim() || undefined,
        locationRegion: form.locationRegion.trim() || undefined,
        locationCountry: form.locationCountry.trim() || undefined,
        dataDrawerConfig: {} as DataDrawerConfig, // TODO: implement data drawer
        listingContent: {}, // TODO: implement template-specific content
      };
      await saveDirectListing(tenantId, input);
      onSaved();
    } catch (err: any) {
      alert(err.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  const canSave = form.slug.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-end z-50">
      <div className="bg-portal-card border-l border-border-subtle w-full max-w-2xl h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-white">Edit Listing</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-border-subtle">
          <button
            onClick={() => setActiveTab("basic")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "basic"
                ? "border-accent text-white"
                : "border-transparent text-text-secondary hover:text-white"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "content"
                ? "border-accent text-white"
                : "border-transparent text-text-secondary hover:text-white"
            }`}
          >
            Public Content
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "pricing"
                ? "border-accent text-white"
                : "border-transparent text-text-secondary hover:text-white"
            }`}
          >
            Pricing & Location
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "basic" && (
            <>
              {/* Animal Display (read-only) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Animal</label>
                <div className="flex items-center gap-3 p-3 bg-portal-surface border border-border-subtle rounded-lg">
                  {selectedAnimal?.photoUrl ? (
                    <img
                      src={selectedAnimal.photoUrl}
                      alt={selectedAnimal.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-portal-card flex items-center justify-center">
                      <Dog className="w-6 h-6 text-text-tertiary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{selectedAnimal?.name || "Unknown"}</p>
                    <p className="text-sm text-text-tertiary">
                      {[selectedAnimal?.breed, selectedAnimal?.sex].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="unique-listing-slug"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  URL-friendly identifier for this listing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Template <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, templateType: key as TemplateType })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        form.templateType === key
                          ? config.color
                          : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, status: "DRAFT" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.status === "DRAFT"
                        ? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setForm({ ...form, status: "ACTIVE" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setForm({ ...form, status: "PAUSED" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.status === "PAUSED"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Paused
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "content" && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  maxLength={120}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="Eye-catching headline (120 chars)"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  {form.headline.length}/120 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={100}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="Full listing title (100 chars)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Summary</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none"
                  placeholder="Brief summary (500 chars)"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  {form.summary.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={5000}
                  rows={8}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none"
                  placeholder="Full description (5000 chars, supports markdown)"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  {form.description.length}/5000 characters
                </p>
              </div>
            </>
          )}

          {activeTab === "pricing" && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Price Model</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, priceModel: "inquire" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.priceModel === "inquire"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Inquire
                  </button>
                  <button
                    onClick={() => setForm({ ...form, priceModel: "fixed" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.priceModel === "fixed"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    onClick={() => setForm({ ...form, priceModel: "range" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.priceModel === "range"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Range
                  </button>
                </div>
              </div>

              {form.priceModel === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">$</span>
                    <input
                      type="number"
                      value={form.priceCents ? form.priceCents / 100 : ""}
                      onChange={(e) =>
                        setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                      }
                      className="flex-1 px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {form.priceModel === "range" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Min Price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary">$</span>
                      <input
                        type="number"
                        value={form.priceMinCents ? form.priceMinCents / 100 : ""}
                        onChange={(e) =>
                          setForm({ ...form, priceMinCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                        }
                        className="flex-1 px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Max Price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary">$</span>
                      <input
                        type="number"
                        value={form.priceMaxCents ? form.priceMaxCents / 100 : ""}
                        onChange={(e) =>
                          setForm({ ...form, priceMaxCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                        }
                        className="flex-1 px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border-subtle">
                <label className="block text-sm font-medium text-white mb-2">Location (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">City</label>
                    <input
                      type="text"
                      value={form.locationCity}
                      onChange={(e) => setForm({ ...form, locationCity: e.target.value })}
                      className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">State/Region</label>
                    <input
                      type="text"
                      value={form.locationRegion}
                      onChange={(e) => setForm({ ...form, locationRegion: e.target.value })}
                      className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                      placeholder="State/Region"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-subtle">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ManageAnimalsPage;

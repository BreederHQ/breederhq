// apps/marketplace/src/breeder/pages/ManageAnimalsPage.tsx
// Animal Listings Management Page
//
// Full management capabilities for individual animal marketplace listings
// (studs, rehomes, guardians, trained, working, etc.)

import * as React from "react";
import { Link } from "react-router-dom";
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
  DollarSign,
  MapPin,
} from "lucide-react";

import {
  getBreederAnimalListings,
  updateBreederAnimalListingStatus,
  deleteBreederAnimalListing,
  type BreederAnimalListingItem,
  type BreederAnimalListingStatus,
  type BreederAnimalListingIntent,
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

const INTENT_CONFIG: Record<BreederAnimalListingIntent, { label: string; color: string }> = {
  STUD: { label: "Stud", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  BROOD_PLACEMENT: { label: "Brood", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  WORKING: { label: "Working", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  STARTED: { label: "Started", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  CO_OWNERSHIP: { label: "Co-Own", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
};

const STATUS_CONFIG: Record<BreederAnimalListingStatus, { label: string; variant: "success" | "amber" | "neutral" | "red" }> = {
  LIVE: { label: "Live", variant: "success" },
  DRAFT: { label: "Draft", variant: "neutral" },
  PAUSED: { label: "Paused", variant: "amber" },
  SOLD: { label: "Sold", variant: "red" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ManageAnimalsPage() {
  const tenantId = getTenantId();
  const [listings, setListings] = React.useState<BreederAnimalListingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [intentFilter, setIntentFilter] = React.useState<string>("ALL");

  const fetchListings = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getBreederAnimalListings(tenantId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        intent: intentFilter === "ALL" ? undefined : intentFilter,
      });
      setListings(response.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load animal listings");
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter, intentFilter]);

  React.useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleToggleStatus = async (listing: BreederAnimalListingItem) => {
    const newStatus = listing.status === "LIVE" ? "PAUSED" : "LIVE";
    try {
      await updateBreederAnimalListingStatus(tenantId, listing.id, newStatus);
      fetchListings();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (listing: BreederAnimalListingItem) => {
    if (!confirm(`Delete listing for "${listing.animalName}"? This cannot be undone.`)) return;
    try {
      await deleteBreederAnimalListing(tenantId, listing.id);
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
    live: listings.filter((l) => l.status === "LIVE").length,
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
              <h1 className="text-2xl font-bold text-white">Manage Animal Listings</h1>
              <p className="text-sm text-text-secondary mt-1">
                Create and manage individual animal marketplace listings
              </p>
            </div>
            <Button variant="primary">
              <Plus size={16} className="mr-1.5" />
              Add Animal Listing
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter size={16} className="text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg"
          >
            <option value="ALL">All Status</option>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="PAUSED">Paused</option>
            <option value="SOLD">Sold</option>
          </select>
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg"
          >
            <option value="ALL">All Types</option>
            <option value="STUD">Stud</option>
            <option value="REHOME">Rehome</option>
            <option value="GUARDIAN">Guardian</option>
            <option value="BROOD_PLACEMENT">Brood Placement</option>
            <option value="TRAINED">Trained</option>
            <option value="WORKING">Working</option>
            <option value="STARTED">Started</option>
            <option value="CO_OWNERSHIP">Co-Ownership</option>
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
            <p className="text-text-secondary mb-2">No animal listings yet</p>
            <p className="text-sm text-text-tertiary mb-4">
              Create your first animal listing to showcase studs, rehomes, or other animals.
            </p>
            <Button variant="primary">
              <Plus size={16} className="mr-1.5" />
              Add Your First Animal
            </Button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <AnimalListingCard
                key={listing.id}
                listing={listing}
                onToggleStatus={() => handleToggleStatus(listing)}
                onDelete={() => handleDelete(listing)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMAL LISTING CARD
// ═══════════════════════════════════════════════════════════════════════════

function AnimalListingCard({
  listing,
  onToggleStatus,
  onDelete,
}: {
  listing: BreederAnimalListingItem;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const intentConfig = INTENT_CONFIG[listing.intent];
  const statusConfig = STATUS_CONFIG[listing.status];

  return (
    <div className="bg-portal-card border border-border-subtle rounded-lg overflow-hidden hover:border-border-default transition-colors">
      {/* Image */}
      <div className="aspect-video bg-portal-surface relative">
        {listing.primaryPhotoUrl ? (
          <img
            src={listing.primaryPhotoUrl}
            alt={listing.animalName}
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
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-1 ${intentConfig.color}`}>
              {intentConfig.label}
            </span>
            <h3 className="text-base font-semibold text-white">{listing.animalName}</h3>
          </div>
        </div>

        {listing.title && (
          <p className="text-sm text-text-secondary line-clamp-1 mb-2">{listing.title}</p>
        )}

        <div className="flex items-center gap-3 text-sm text-text-tertiary mb-3">
          {listing.animalBreed && <span>{listing.animalBreed}</span>}
          {listing.animalSex && <span>• {listing.animalSex}</span>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-accent font-medium">
            {listing.priceCents ? formatPrice(listing.priceCents) : "Contact for price"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleStatus}
              className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
              title={listing.status === "LIVE" ? "Pause" : "Publish"}
            >
              {listing.status === "LIVE" ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
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

export default ManageAnimalsPage;

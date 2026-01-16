// apps/marketplace/src/breeder/pages/ManageServicesPage.tsx
// Services Listings Management Page
//
// Full management capabilities for service marketplace listings
// (stud services, training, grooming, transport, boarding, etc.)

import * as React from "react";
import { Link } from "react-router-dom";
import { Button, Badge } from "@bhq/ui";
import {
  Wrench,
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
  X,
} from "lucide-react";

import {
  getBreederServices,
  createBreederService,
  updateBreederService,
  publishBreederService,
  unpublishBreederService,
  deleteBreederService,
  type ServiceListingItem,
  type ServiceListingCreateInput,
  type BreederServiceType,
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

const SERVICE_TYPES: { value: BreederServiceType; label: string }[] = [
  { value: "STUD_SERVICE", label: "Stud Service" },
  { value: "TRAINING", label: "Training" },
  { value: "GROOMING", label: "Grooming" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "BOARDING", label: "Boarding" },
  { value: "OTHER_SERVICE", label: "Other" },
];

const SERVICE_TYPE_COLORS: Record<BreederServiceType, string> = {
  STUD_SERVICE: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  TRAINING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  GROOMING: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  TRANSPORT: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  BOARDING: "bg-green-500/20 text-green-300 border-green-500/30",
  OTHER_SERVICE: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ManageServicesPage() {
  const tenantId = getTenantId();
  const [services, setServices] = React.useState<ServiceListingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [editing, setEditing] = React.useState<ServiceListingItem | "new" | null>(null);

  const fetchServices = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getBreederServices(tenantId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      });
      setServices(response.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter, typeFilter]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleToggleStatus = async (service: ServiceListingItem) => {
    try {
      if (service.status === "ACTIVE") {
        await unpublishBreederService(tenantId, service.id);
      } else {
        await publishBreederService(tenantId, service.id);
      }
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (service: ServiceListingItem) => {
    if (!confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
    try {
      await deleteBreederService(tenantId, service.id);
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: services.length,
    active: services.filter((s) => s.status === "ACTIVE").length,
    draft: services.filter((s) => s.status !== "ACTIVE").length,
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
              <h1 className="text-2xl font-bold text-white">Manage Service Listings</h1>
              <p className="text-sm text-text-secondary mt-1">
                Offer stud services, training, grooming, and more
              </p>
            </div>
            <Button variant="primary" onClick={() => setEditing("new")}>
              <Plus size={16} className="mr-1.5" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-text-tertiary">Total Services</p>
          </div>
          <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            <p className="text-sm text-text-tertiary">Active</p>
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-portal-card border border-border-subtle rounded-lg"
          >
            <option value="ALL">All Types</option>
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-portal-card rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchServices}>Try Again</Button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <Wrench className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-text-secondary mb-2">No services yet</p>
            <p className="text-sm text-text-tertiary mb-4">
              Offer stud services, training, grooming, and more.
            </p>
            <Button variant="primary" onClick={() => setEditing("new")}>
              <Plus size={16} className="mr-1.5" />
              Add Your First Service
            </Button>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onToggleStatus={() => handleToggleStatus(service)}
                onEdit={() => setEditing(service)}
                onDelete={() => handleDelete(service)}
              />
            ))}
          </div>
        )}

        {/* Edit Drawer */}
        {editing && (
          <ServiceEditDrawer
            tenantId={tenantId}
            service={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchServices();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CARD
// ═══════════════════════════════════════════════════════════════════════════

function ServiceCard({
  service,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  service: ServiceListingItem;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive = service.status === "ACTIVE";
  const typeColor = SERVICE_TYPE_COLORS[service.listingType];
  const typeLabel = SERVICE_TYPES.find((t) => t.value === service.listingType)?.label || service.listingType;

  return (
    <div className="bg-portal-card border border-border-subtle rounded-lg p-4 hover:border-border-default transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${typeColor}`}>
            {typeLabel}
          </span>
          <Badge variant={isActive ? "success" : "neutral"}>
            {isActive ? "Active" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleStatus}
            className="p-1.5 text-text-secondary hover:text-white transition-colors rounded hover:bg-white/5"
            title={isActive ? "Unpublish" : "Publish"}
          >
            {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
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

      <h3 className="text-base font-semibold text-white mb-1">{service.title}</h3>

      {service.description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">{service.description}</p>
      )}

      <div className="space-y-1 text-sm">
        {(service.city || service.state) && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <MapPin size={12} />
            <span>{[service.city, service.state].filter(Boolean).join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <DollarSign size={12} className="text-text-tertiary" />
          <span className="text-accent">
            {service.priceType === "contact"
              ? "Contact for pricing"
              : service.priceType === "starting_at"
              ? `Starting at ${formatPrice(service.priceCents)}`
              : formatPrice(service.priceCents)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EDIT DRAWER
// ═══════════════════════════════════════════════════════════════════════════

function ServiceEditDrawer({
  tenantId,
  service,
  onClose,
  onSaved,
}: {
  tenantId: string;
  service: ServiceListingItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = service === null;
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    listingType: service?.listingType || ("TRAINING" as BreederServiceType),
    title: service?.title || "",
    description: service?.description || "",
    contactName: service?.contactName || "",
    contactEmail: service?.contactEmail || "",
    contactPhone: service?.contactPhone || "",
    city: service?.city || "",
    state: service?.state || "",
    priceCents: service?.priceCents ?? null,
    priceType: (service?.priceType || "contact") as "fixed" | "starting_at" | "contact",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const input: ServiceListingCreateInput = {
        listingType: form.listingType,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        priceCents: form.priceType !== "contact" ? form.priceCents ?? undefined : undefined,
        priceType: form.priceType,
      };

      if (isNew) {
        await createBreederService(tenantId, input);
      } else {
        await updateBreederService(tenantId, service!.id, input);
      }
      onSaved();
    } catch (err: any) {
      alert(err.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-portal-surface border-l border-border-subtle flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isNew ? "Add Service" : "Edit Service"}
          </h2>
          <button onClick={onClose} className="p-1 text-text-secondary hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
            <select
              value={form.listingType}
              onChange={(e) => setForm({ ...form, listingType: e.target.value as BreederServiceType })}
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Professional Dog Training"
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your service..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg resize-none"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Pricing</label>
            <div className="flex gap-2 mb-2">
              {(["contact", "fixed", "starting_at"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, priceType: type })}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    form.priceType === type
                      ? "border-accent bg-accent/10 text-white"
                      : "border-border-subtle text-text-secondary hover:border-border-default"
                  }`}
                >
                  {type === "contact" ? "Contact" : type === "fixed" ? "Fixed" : "Starting At"}
                </button>
              ))}
            </div>
            {form.priceType !== "contact" && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                <input
                  type="number"
                  value={form.priceCents != null ? form.priceCents / 100 : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, priceCents: val ? Math.round(parseFloat(val) * 100) : null });
                  }}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="pt-4 border-t border-border-subtle space-y-3">
            <h4 className="text-sm font-medium text-white">Contact Info</h4>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="Contact name"
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
            />
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="Email"
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
            />
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="Phone"
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? "Saving..." : isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ManageServicesPage;

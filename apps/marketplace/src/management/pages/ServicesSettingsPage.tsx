// apps/marketplace/src/management/pages/ServicesSettingsPage.tsx
// Breeder-side management of service listings (training, stud services, etc.)

import * as React from "react";
import { Button, SectionCard, Badge } from "@bhq/ui";
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import {
  getBreederServices,
  getBreederService,
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
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ServicesSettingsPageProps = {
  /** When true, hides internal header (drawer provides its own) */
  isDrawer?: boolean;
};

type EditingService = {
  id: number | null; // null = creating new
  listingType: BreederServiceType;
  title: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  priceCents: number | null;
  priceType: "fixed" | "starting_at" | "contact";
};

const SERVICE_TYPE_OPTIONS: { value: BreederServiceType; label: string }[] = [
  { value: "STUD_SERVICE", label: "Stud Service" },
  { value: "TRAINING", label: "Training" },
  { value: "GROOMING", label: "Grooming" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "BOARDING", label: "Boarding" },
  { value: "OTHER_SERVICE", label: "Other Service" },
];

const SERVICE_TYPE_LABELS: Record<BreederServiceType, string> = {
  STUD_SERVICE: "Stud Service",
  TRAINING: "Training",
  GROOMING: "Grooming",
  TRANSPORT: "Transport",
  BOARDING: "Boarding",
  OTHER_SERVICE: "Other Service",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w: any = typeof window !== "undefined" ? window : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

function createEmptyService(): EditingService {
  return {
    id: null,
    listingType: "TRAINING",
    title: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    state: "",
    priceCents: null,
    priceType: "contact",
  };
}

function serviceToEditing(s: ServiceListingItem): EditingService {
  return {
    id: s.id,
    listingType: s.listingType,
    title: s.title,
    description: s.description || "",
    contactName: s.contactName || "",
    contactEmail: s.contactEmail || "",
    contactPhone: s.contactPhone || "",
    city: s.city || "",
    state: s.state || "",
    priceCents: s.priceCents,
    priceType: s.priceType || "contact",
  };
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  service: ServiceListingItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const isActive = service.status === "ACTIVE";

  return (
    <div className="border border-border-subtle rounded-lg p-4 bg-portal-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-white truncate">{service.title}</h3>
            {isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="neutral">Draft</Badge>
            )}
          </div>
          <div className="text-sm text-text-secondary">
            {SERVICE_TYPE_LABELS[service.listingType]}
          </div>
          {service.city && service.state && (
            <div className="text-xs text-text-tertiary mt-1">
              {service.city}, {service.state}
            </div>
          )}
          {service.priceCents != null && (
            <div className="text-xs text-accent mt-1">
              {service.priceType === "starting_at" ? "Starting at " : ""}
              {formatCents(service.priceCents)}
            </div>
          )}
          {service.priceType === "contact" && (
            <div className="text-xs text-text-tertiary mt-1">
              Contact for pricing
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onTogglePublish}
            className="p-2 text-text-secondary hover:text-white transition-colors"
            title={isActive ? "Unpublish" : "Publish"}
          >
            {isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 text-text-secondary hover:text-white transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-text-secondary hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceForm({
  editing,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  editing: EditingService;
  onChange: (updates: Partial<EditingService>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isNew = editing.id === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-portal-card border-b border-border-subtle px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isNew ? "Create Service Listing" : "Edit Service Listing"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Service Type *
            </label>
            <select
              value={editing.listingType}
              onChange={(e) => onChange({ listingType: e.target.value as BreederServiceType })}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Title *
            </label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g., Professional Dog Training"
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={editing.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe your service..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                City
              </label>
              <input
                type="text"
                value={editing.city}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                State
              </label>
              <input
                type="text"
                value={editing.state}
                onChange={(e) => onChange({ state: e.target.value })}
                placeholder="State"
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Pricing
            </label>
            <div className="flex gap-3">
              <select
                value={editing.priceType}
                onChange={(e) =>
                  onChange({ priceType: e.target.value as "fixed" | "starting_at" | "contact" })
                }
                className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="contact">Contact for Pricing</option>
                <option value="fixed">Fixed Price</option>
                <option value="starting_at">Starting At</option>
              </select>
              {editing.priceType !== "contact" && (
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                  <input
                    type="number"
                    value={editing.priceCents != null ? editing.priceCents / 100 : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange({ priceCents: val ? Math.round(parseFloat(val) * 100) : null });
                    }}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="pt-2 border-t border-border-subtle">
            <h4 className="text-sm font-medium text-white mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={editing.contactName}
                  onChange={(e) => onChange({ contactName: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editing.contactEmail}
                  onChange={(e) => onChange({ contactEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editing.contactPhone}
                  onChange={(e) => onChange({ contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-portal-card border-t border-border-subtle px-5 py-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={saving || !editing.title.trim()}
          >
            {saving ? "Saving..." : isNew ? "Create Service" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ServicesSettingsPage({ isDrawer = false }: ServicesSettingsPageProps) {
  const tenantId = getTenantId();

  // Data state
  const [services, setServices] = React.useState<ServiceListingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Editing state
  const [editing, setEditing] = React.useState<EditingService | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Fetch services
  const fetchServices = React.useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getBreederServices(tenantId);
      setServices(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handlers
  const handleCreate = () => {
    setEditing(createEmptyService());
  };

  const handleEdit = async (service: ServiceListingItem) => {
    try {
      const detail = await getBreederService(tenantId, service.id);
      setEditing(serviceToEditing(detail));
    } catch {
      // Fallback to list data
      setEditing(serviceToEditing(service));
    }
  };

  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      const input: ServiceListingCreateInput = {
        listingType: editing.listingType,
        title: editing.title.trim(),
        description: editing.description.trim() || undefined,
        contactName: editing.contactName.trim() || undefined,
        contactEmail: editing.contactEmail.trim() || undefined,
        contactPhone: editing.contactPhone.trim() || undefined,
        city: editing.city.trim() || undefined,
        state: editing.state.trim() || undefined,
        priceCents: editing.priceType !== "contact" ? editing.priceCents ?? undefined : undefined,
        priceType: editing.priceType,
      };

      if (editing.id === null) {
        await createBreederService(tenantId, input);
      } else {
        await updateBreederService(tenantId, editing.id, input);
      }

      setEditing(null);
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to save service");
    } finally {
      setSaving(false);
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

  const handleTogglePublish = async (service: ServiceListingItem) => {
    try {
      if (service.status === "ACTIVE") {
        await unpublishBreederService(tenantId, service.id);
      } else {
        await publishBreederService(tenantId, service.id);
      }
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to update service status");
    }
  };

  // No tenant
  if (!tenantId) {
    return (
      <div className="p-6">
        <div className="text-center text-text-secondary">
          No tenant selected. Please select a business to manage services.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isDrawer && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Service Listings</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage your service offerings visible on the marketplace
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={16} className="mr-1.5" />
            Add Service
          </Button>
        </div>
      )}

      {/* Content */}
      <SectionCard
        title={isDrawer ? "Service Listings" : undefined}
        highlight={false}
      >
        {isDrawer && (
          <div className="flex justify-end mb-4">
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={14} className="mr-1" />
              Add Service
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-border-default rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchServices}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">
              No services yet. Add your first service listing to get started.
            </p>
            <Button variant="primary" onClick={handleCreate}>
              <Plus size={16} className="mr-1.5" />
              Add Service
            </Button>
          </div>
        )}

        {/* Services list */}
        {!loading && !error && services.length > 0 && (
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => handleEdit(service)}
                onDelete={() => handleDelete(service)}
                onTogglePublish={() => handleTogglePublish(service)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Edit Modal */}
      {editing && (
        <ServiceForm
          editing={editing}
          onChange={(updates) => setEditing((prev) => prev ? { ...prev, ...updates } : null)}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

export default ServicesSettingsPage;

// apps/admin/src/SubscriptionAdmin.tsx
import * as React from "react";
import { PageHeader, Card, SectionCard, Button, Input } from "@bhq/ui";
import {
  adminSubscriptionApi,
  ProductDTO,
  SubscriptionDTO,
  ProductEntitlementDTO,
} from "./api";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
}

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  TRIAL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PAST_DUE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  CANCELED: "bg-red-500/20 text-red-400 border-red-500/30",
  EXPIRED: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

const ENTITLEMENT_LABELS: Record<string, string> = {
  ANIMAL_QUOTA: "Animals",
  CONTACT_QUOTA: "Contacts",
  PORTAL_USER_QUOTA: "Portal Users",
  BREEDING_PLAN_QUOTA: "Breeding Plans",
  MARKETPLACE_LISTING_QUOTA: "Marketplace Listings",
  STORAGE_QUOTA_GB: "Storage (GB)",
  SMS_QUOTA: "SMS Messages",
  MARKETPLACE_ACCESS: "Marketplace Access",
  PRIORITY_SUPPORT: "Priority Support",
  ADVANCED_ANALYTICS: "Advanced Analytics",
  API_ACCESS: "API Access",
};

// ────────────────────────────────────────────────────────────────────────────
// Subscription List Tab
// ────────────────────────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionDTO[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSubscriptionApi.listSubscriptions({
        status: statusFilter || undefined,
        limit: 100,
      });
      setSubscriptions(res.subscriptions || []);
    } catch (e: any) {
      setError(e.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this subscription?")) return;
    try {
      await adminSubscriptionApi.cancelSubscription(id);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to cancel");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELED">Canceled</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <Button size="sm" variant="outline" onClick={reload}>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="py-8 text-center text-neutral-400">
          Loading subscriptions...
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && subscriptions.length === 0 && (
        <div className="py-8 text-center text-neutral-400">
          No subscriptions found
        </div>
      )}

      {!loading && !error && subscriptions.length > 0 && (
        <div className="overflow-hidden rounded border border-hairline">
          <table className="w-full text-sm">
            <thead className="text-secondary bg-surface-strong">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Tenant</th>
                <th className="text-left px-3 py-2">Plan</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Period End</th>
                <th className="text-left px-3 py-2">Stripe</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5">
                  <td className="px-3 py-2 font-mono text-xs">{sub.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {sub.tenant?.name || `Tenant #${sub.tenantId}`}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {sub.tenant?.primaryEmail || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {sub.product?.name || `Product #${sub.productId}`}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        STATUS_COLORS[sub.status] || STATUS_COLORS.EXPIRED
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {fmtDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[120px]">
                    {sub.stripeSubscriptionId || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {sub.status !== "CANCELED" && sub.status !== "EXPIRED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(sub.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Products Tab
// ────────────────────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInactive, setShowInactive] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductDTO | null>(
    null
  );
  const [showCreate, setShowCreate] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSubscriptionApi.listProducts({
        includeInactive: showInactive,
      });
      setProducts(res.products || []);
    } catch (e: any) {
      setError(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
          <Button size="sm" variant="outline" onClick={reload}>
            Refresh
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          New Product
        </Button>
      </div>

      {loading && (
        <div className="py-8 text-center text-neutral-400">
          Loading products...
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-8 text-center text-neutral-400">
          No products found
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onReload={reload}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <ProductModal
          product={null}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            reload();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onReload,
}: {
  product: ProductDTO;
  onEdit: () => void;
  onReload: () => void;
}) {
  const handleToggleActive = async () => {
    try {
      await adminSubscriptionApi.updateProduct(product.id, {
        active: !product.active,
      });
      onReload();
    } catch (e: any) {
      alert(e.message || "Failed to update");
    }
  };

  return (
    <Card className={!product.active ? "opacity-60" : ""}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {product.name}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  product.type === "SUBSCRIPTION"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : product.type === "ADD_ON"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
                }`}
              >
                {product.type}
              </span>
              {!product.active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 mt-1">
              {product.description || "No description"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {fmtPrice(product.priceUSD)}
            </div>
            {product.billingInterval && (
              <div className="text-xs text-neutral-400">
                /{product.billingInterval.toLowerCase()}
              </div>
            )}
          </div>
        </div>

        {/* Entitlements */}
        {product.entitlements && product.entitlements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Entitlements
            </h4>
            <div className="flex flex-wrap gap-2">
              {product.entitlements.map((ent) => (
                <span
                  key={ent.entitlementKey}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-strong text-xs"
                >
                  <span className="text-neutral-300">
                    {ENTITLEMENT_LABELS[ent.entitlementKey] || ent.entitlementKey}
                  </span>
                  <span className="text-white font-medium">
                    {ent.limitValue === null ? "∞" : ent.limitValue}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Features
            </h4>
            <ul className="text-sm text-neutral-300 space-y-1">
              {(product.features as string[]).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={handleToggleActive}>
            {product.active ? "Deactivate" : "Activate"}
          </Button>
          {product.stripeProductId && (
            <span className="ml-auto text-xs text-neutral-500 font-mono">
              Stripe: {product.stripeProductId}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Product Modal (Create/Edit)
// ────────────────────────────────────────────────────────────────────────────
function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [name, setName] = React.useState(product?.name || "");
  const [description, setDescription] = React.useState(
    product?.description || ""
  );
  const [type, setType] = React.useState<ProductDTO["type"]>(
    product?.type || "SUBSCRIPTION"
  );
  const [priceUSD, setPriceUSD] = React.useState(
    product ? String(product.priceUSD / 100) : ""
  );
  const [billingInterval, setBillingInterval] = React.useState<
    ProductDTO["billingInterval"]
  >(product?.billingInterval || "MONTHLY");
  const [features, setFeatures] = React.useState(
    (product?.features || []).join("\n")
  );
  const [sortOrder, setSortOrder] = React.useState(
    String(product?.sortOrder || 0)
  );

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const priceCents = Math.round(parseFloat(priceUSD || "0") * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setError("Invalid price");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      if (isEdit) {
        await adminSubscriptionApi.updateProduct(product!.id, {
          name: name.trim(),
          description: description.trim() || null,
          priceUSD: priceCents,
          features: features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
          sortOrder: parseInt(sortOrder) || 0,
        });
      } else {
        await adminSubscriptionApi.createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          priceUSD: priceCents,
          billingInterval:
            type === "SUBSCRIPTION" ? billingInterval || undefined : undefined,
          features: features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
          sortOrder: parseInt(sortOrder) || 0,
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[540px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Product" : "New Product"}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-secondary mb-1">
              Name <span className="text-orange-500">*</span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pro Plan"
            />
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Description</div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For growing businesses..."
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Type</div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductDTO["type"])}
                  className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                >
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="ADD_ON">Add-On</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
              {type === "SUBSCRIPTION" && (
                <div>
                  <div className="text-xs text-secondary mb-1">Interval</div>
                  <select
                    value={billingInterval || "MONTHLY"}
                    onChange={(e) =>
                      setBillingInterval(
                        e.target.value as ProductDTO["billingInterval"]
                      )
                    }
                    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary mb-1">
                Price (USD) <span className="text-orange-500">*</span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value)}
                placeholder="29.00"
              />
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Sort Order</div>
              <Input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">
              Features (one per line)
            </div>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Up to 100 animals\nPriority support\n..."
              rows={4}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary resize-none"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={working}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={working}>
              {working ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────
type Tab = "subscriptions" | "products";

export default function SubscriptionAdmin() {
  const [activeTab, setActiveTab] = React.useState<Tab>("subscriptions");

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Subscription Management"
        subtitle="Manage products, plans, and tenant subscriptions"
      />

      {/* Tab Navigation */}
      <div className="border-b border-hairline">
        <nav className="inline-flex items-end gap-6" role="tablist">
          {(
            [
              { key: "subscriptions", label: "Subscriptions" },
              { key: "products", label: "Products" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "pb-2 text-sm font-medium transition-colors select-none",
                  isActive ? "text-white" : "text-neutral-400 hover:text-white",
                ].join(" ")}
                style={{
                  borderBottom: isActive
                    ? "2px solid #f97316"
                    : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "subscriptions" && <SubscriptionsTab />}
      {activeTab === "products" && <ProductsTab />}
    </div>
  );
}

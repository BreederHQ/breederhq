// apps/admin/src/SubscriptionAdmin.tsx
import * as React from "react";
import { PageHeader, Card, SectionCard, Button, Input } from "@bhq/ui";
import {
  adminSubscriptionApi,
  adminFeatureApi,
  ProductDTO,
  SubscriptionDTO,
  ProductEntitlementDTO,
  FeatureDTO,
  FeatureModule,
  EntitlementKeyType,
  FeatureAnalyticsDTO,
} from "./api";

// ────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ────────────────────────────────────────────────────────────────────────────

const FEATURE_MODULES: FeatureModule[] = [
  "GENETICS",
  "MARKETPLACE",
  "FINANCIAL",
  "ANIMALS",
  "CONTACTS",
  "BREEDING",
  "DOCUMENTS",
  "HEALTH",
  "SCHEDULING",
  "PORTAL",
  "REPORTING",
  "SETTINGS",
];

const MODULE_LABELS: Record<FeatureModule, string> = {
  GENETICS: "Genetics Lab",
  MARKETPLACE: "Marketplace",
  FINANCIAL: "Financial Suite",
  ANIMALS: "Animals",
  CONTACTS: "Contacts & CRM",
  BREEDING: "Breeding Plans",
  DOCUMENTS: "Documents",
  HEALTH: "Health Records",
  SCHEDULING: "Scheduling",
  PORTAL: "Client Portal",
  REPORTING: "Reporting",
  SETTINGS: "Settings",
};

const MODULE_COLORS: Record<FeatureModule, string> = {
  GENETICS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  MARKETPLACE: "bg-green-500/20 text-green-400 border-green-500/30",
  FINANCIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ANIMALS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CONTACTS: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  BREEDING: "bg-red-500/20 text-red-400 border-red-500/30",
  DOCUMENTS: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  HEALTH: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  SCHEDULING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PORTAL: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  REPORTING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  SETTINGS: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

const ENTITLEMENT_KEYS: EntitlementKeyType[] = [
  "PLATFORM_ACCESS",
  "MARKETPLACE_ACCESS",
  "PORTAL_ACCESS",
  "BREEDING_PLANS",
  "FINANCIAL_SUITE",
  "DOCUMENT_MANAGEMENT",
  "HEALTH_RECORDS",
  "WAITLIST_MANAGEMENT",
  "ADVANCED_REPORTING",
  "API_ACCESS",
  "MULTI_LOCATION",
  "E_SIGNATURES",
  "DATA_EXPORT",
  "GENETICS_STANDARD",
  "GENETICS_PRO",
  "ANIMAL_QUOTA",
  "CONTACT_QUOTA",
  "PORTAL_USER_QUOTA",
  "BREEDING_PLAN_QUOTA",
  "MARKETPLACE_LISTING_QUOTA",
  "STORAGE_QUOTA_GB",
  "SMS_QUOTA",
];

const ENTITLEMENT_LABELS: Record<string, string> = {
  PLATFORM_ACCESS: "Platform Access",
  MARKETPLACE_ACCESS: "Marketplace Access",
  PORTAL_ACCESS: "Portal Access",
  BREEDING_PLANS: "Breeding Plans",
  FINANCIAL_SUITE: "Financial Suite",
  DOCUMENT_MANAGEMENT: "Document Management",
  HEALTH_RECORDS: "Health Records",
  WAITLIST_MANAGEMENT: "Waitlist Management",
  ADVANCED_REPORTING: "Advanced Reporting",
  API_ACCESS: "API Access",
  MULTI_LOCATION: "Multi-Location",
  E_SIGNATURES: "E-Signatures",
  DATA_EXPORT: "Data Export",
  GENETICS_STANDARD: "Genetics (Standard)",
  GENETICS_PRO: "Genetics (Pro)",
  ANIMAL_QUOTA: "Animal Quota",
  CONTACT_QUOTA: "Contact Quota",
  PORTAL_USER_QUOTA: "Portal User Quota",
  BREEDING_PLAN_QUOTA: "Breeding Plan Quota",
  MARKETPLACE_LISTING_QUOTA: "Marketplace Listing Quota",
  STORAGE_QUOTA_GB: "Storage (GB)",
  SMS_QUOTA: "SMS Quota",
};

const QUOTA_ENTITLEMENTS = [
  "ANIMAL_QUOTA",
  "CONTACT_QUOTA",
  "PORTAL_USER_QUOTA",
  "BREEDING_PLAN_QUOTA",
  "MARKETPLACE_LISTING_QUOTA",
  "STORAGE_QUOTA_GB",
  "SMS_QUOTA",
];

function isQuotaEntitlement(key: string): boolean {
  return QUOTA_ENTITLEMENTS.includes(key);
}

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

// ────────────────────────────────────────────────────────────────────────────
// Features Tab
// ────────────────────────────────────────────────────────────────────────────

function FeaturesTab() {
  const [features, setFeatures] = React.useState<FeatureDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = React.useState<FeatureModule | "">("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [showInactive, setShowInactive] = React.useState(false);
  const [editingFeature, setEditingFeature] = React.useState<FeatureDTO | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFeatureApi.listFeatures({
        module: moduleFilter || undefined,
        includeArchived: showArchived,
        includeInactive: showInactive,
      });
      setFeatures(res.features || []);
    } catch (e: any) {
      setError(e.message || "Failed to load features");
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, showArchived, showInactive]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  // Group features by module
  const groupedFeatures = React.useMemo(() => {
    const groups: Record<FeatureModule, FeatureDTO[]> = {} as any;
    for (const mod of FEATURE_MODULES) {
      groups[mod] = [];
    }
    for (const f of features) {
      if (groups[f.module]) {
        groups[f.module].push(f);
      }
    }
    return groups;
  }, [features]);

  const handleArchive = async (feature: FeatureDTO) => {
    if (!window.confirm(`Archive feature "${feature.name}"?`)) return;
    try {
      await adminFeatureApi.archiveFeature(feature.id);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to archive");
    }
  };

  const handleRestore = async (feature: FeatureDTO) => {
    try {
      await adminFeatureApi.restoreFeature(feature.id);
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to restore");
    }
  };

  const handleToggleActive = async (feature: FeatureDTO) => {
    try {
      await adminFeatureApi.updateFeature(feature.id, {
        isActive: !feature.isActive,
      });
      reload();
    } catch (e: any) {
      alert(e.message || "Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-surface-strong border border-hairline rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">About Features</h3>
        <p className="text-sm text-neutral-400">
          Features are individual platform capabilities that can be gated by subscription tier.
          Each feature maps to an <strong>Entitlement Key</strong> which products grant access to.
          When you add a new UI feature, register it here with a unique key (e.g., <code className="text-orange-400">GENETICS_COI_CALCULATIONS</code>),
          then use that key in your code to check access.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as FeatureModule | "")}
            className="h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary"
          >
            <option value="">All Modules</option>
            {FEATURE_MODULES.map((mod) => (
              <option key={mod} value={mod}>
                {MODULE_LABELS[mod]}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
          <Button size="sm" variant="outline" onClick={reload}>
            Refresh
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New Feature
        </Button>
      </div>

      {loading && (
        <div className="py-8 text-center text-neutral-400">Loading features...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && features.length === 0 && (
        <div className="py-8 text-center text-neutral-400">
          No features found. Click "New Feature" to create one.
        </div>
      )}

      {/* Features grouped by module */}
      {!loading && !error && features.length > 0 && (
        <div className="space-y-6">
          {FEATURE_MODULES.filter(
            (mod) => moduleFilter === "" || moduleFilter === mod
          ).map((mod) => {
            const modFeatures = groupedFeatures[mod];
            if (modFeatures.length === 0) return null;
            return (
              <div key={mod}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${MODULE_COLORS[mod]}`}
                  >
                    {MODULE_LABELS[mod]}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {modFeatures.length} feature{modFeatures.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-2">
                  {modFeatures.map((feature) => (
                    <FeatureRow
                      key={feature.id}
                      feature={feature}
                      onEdit={() => setEditingFeature(feature)}
                      onArchive={() => handleArchive(feature)}
                      onRestore={() => handleRestore(feature)}
                      onToggleActive={() => handleToggleActive(feature)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <FeatureModal
          feature={null}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            reload();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingFeature && (
        <FeatureModal
          feature={editingFeature}
          onClose={() => setEditingFeature(null)}
          onSaved={() => {
            setEditingFeature(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function FeatureRow({
  feature,
  onEdit,
  onArchive,
  onRestore,
  onToggleActive,
}: {
  feature: FeatureDTO;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onToggleActive: () => void;
}) {
  const isArchived = !!feature.archivedAt;
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded border border-hairline bg-surface ${
        isArchived ? "opacity-50" : ""
      } ${!feature.isActive && !isArchived ? "opacity-70" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs text-orange-400 font-mono">{feature.key}</code>
          {!feature.isActive && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Inactive
            </span>
          )}
          {isArchived && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              Archived
            </span>
          )}
        </div>
        <div className="text-sm text-white mt-0.5">{feature.name}</div>
        {feature.description && (
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            {feature.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="px-2 py-0.5 rounded bg-surface-strong border border-hairline">
          {ENTITLEMENT_LABELS[feature.entitlementKey] || feature.entitlementKey}
        </span>
      </div>
      {feature.uiHint && (
        <div className="text-xs text-neutral-500 max-w-[150px] truncate" title={feature.uiHint}>
          {feature.uiHint}
        </div>
      )}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        {!isArchived && (
          <>
            <Button size="sm" variant="outline" onClick={onToggleActive}>
              {feature.isActive ? "Disable" : "Enable"}
            </Button>
            <Button size="sm" variant="outline" onClick={onArchive}>
              Archive
            </Button>
          </>
        )}
        {isArchived && (
          <Button size="sm" variant="outline" onClick={onRestore}>
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}

function FeatureModal({
  feature,
  onClose,
  onSaved,
}: {
  feature: FeatureDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!feature;
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [key, setKey] = React.useState(feature?.key || "");
  const [name, setName] = React.useState(feature?.name || "");
  const [description, setDescription] = React.useState(feature?.description || "");
  const [module, setModule] = React.useState<FeatureModule>(feature?.module || "GENETICS");
  const [entitlementKey, setEntitlementKey] = React.useState<EntitlementKeyType>(
    feature?.entitlementKey || "PLATFORM_ACCESS"
  );
  const [uiHint, setUiHint] = React.useState(feature?.uiHint || "");
  const [isActive, setIsActive] = React.useState(feature?.isActive ?? true);

  const handleSubmit = async () => {
    if (!key.trim()) {
      setError("Key is required");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    // Validate key format
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      setError("Key must be UPPER_SNAKE_CASE (e.g., GENETICS_COI_CALC)");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      if (isEdit) {
        await adminFeatureApi.updateFeature(feature!.id, {
          key: key.trim(),
          name: name.trim(),
          description: description.trim() || null,
          module,
          entitlementKey,
          uiHint: uiHint.trim() || null,
          isActive,
        });
      } else {
        await adminFeatureApi.createFeature({
          key: key.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          module,
          entitlementKey,
          uiHint: uiHint.trim() || undefined,
          isActive,
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
      <div className="relative w-[600px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Feature" : "New Feature"}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary mb-1">
                Feature Key <span className="text-orange-500">*</span>
              </div>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="GENETICS_COI_CALCULATIONS"
                className="font-mono text-sm"
              />
              <div className="text-xs text-neutral-500 mt-1">
                UPPER_SNAKE_CASE, used in code
              </div>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">
                Display Name <span className="text-orange-500">*</span>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="COI Calculations"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Calculate coefficient of inbreeding for breeding pairs..."
              rows={2}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary mb-1">Module</div>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as FeatureModule)}
                className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              >
                {FEATURE_MODULES.map((mod) => (
                  <option key={mod} value={mod}>
                    {MODULE_LABELS[mod]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Entitlement Key</div>
              <select
                value={entitlementKey}
                onChange={(e) => setEntitlementKey(e.target.value as EntitlementKeyType)}
                className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
              >
                {ENTITLEMENT_KEYS.filter((k) => !isQuotaEntitlement(k)).map((k) => (
                  <option key={k} value={k}>
                    {ENTITLEMENT_LABELS[k] || k}
                  </option>
                ))}
              </select>
              <div className="text-xs text-neutral-500 mt-1">
                Products grant entitlement keys, which unlock features
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">UI Location Hint</div>
            <Input
              value={uiHint}
              onChange={(e) => setUiHint(e.target.value)}
              placeholder="Genetics Lab > Analysis Tools"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Where this feature appears in the UI (for documentation)
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              Active (feature is available when entitled)
            </label>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={working}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={working}>
              {working ? "Saving..." : isEdit ? "Save Changes" : "Create Feature"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Entitlements Tab
// ────────────────────────────────────────────────────────────────────────────

function EntitlementsTab() {
  const [entitlements, setEntitlements] = React.useState<
    Array<{
      key: EntitlementKeyType;
      name: string;
      description: string;
      type: "BOOLEAN" | "QUOTA";
      featureCount: number;
      productCount: number;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [keyFeatures, setKeyFeatures] = React.useState<FeatureDTO[]>([]);
  const [loadingFeatures, setLoadingFeatures] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFeatureApi.listEntitlementKeys();
      setEntitlements(res.entitlementKeys || []);
    } catch (e: any) {
      setError(e.message || "Failed to load entitlement keys");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const handleExpand = async (key: string) => {
    if (expandedKey === key) {
      setExpandedKey(null);
      setKeyFeatures([]);
      return;
    }
    setExpandedKey(key);
    setLoadingFeatures(true);
    try {
      const res = await adminFeatureApi.getEntitlementKeyFeatures(key);
      setKeyFeatures(res.features || []);
    } catch (e: any) {
      console.error("Failed to load features for key", e);
      setKeyFeatures([]);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const booleanEntitlements = entitlements.filter((e) => e.type === "BOOLEAN");
  const quotaEntitlements = entitlements.filter((e) => e.type === "QUOTA");

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-surface-strong border border-hairline rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">About Entitlement Keys</h3>
        <p className="text-sm text-neutral-400">
          Entitlement keys are the access controls that <strong>Products</strong> grant to subscribers.
          They come in two types: <strong>Boolean</strong> (on/off access) and <strong>Quota</strong> (numeric limits).
          Features map to entitlement keys - when a user has a product that grants an entitlement key,
          they can access all features mapped to that key.
        </p>
      </div>

      {loading && (
        <div className="py-8 text-center text-neutral-400">Loading entitlement keys...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Boolean Entitlements */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Feature Access (Boolean)
            </h3>
            <div className="grid gap-2">
              {booleanEntitlements.map((ent) => (
                <EntitlementRow
                  key={ent.key}
                  entitlement={ent}
                  isExpanded={expandedKey === ent.key}
                  onToggleExpand={() => handleExpand(ent.key)}
                  features={expandedKey === ent.key ? keyFeatures : []}
                  loadingFeatures={expandedKey === ent.key && loadingFeatures}
                />
              ))}
            </div>
          </div>

          {/* Quota Entitlements */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Quotas (Numeric Limits)
            </h3>
            <div className="grid gap-2">
              {quotaEntitlements.map((ent) => (
                <EntitlementRow
                  key={ent.key}
                  entitlement={ent}
                  isExpanded={expandedKey === ent.key}
                  onToggleExpand={() => handleExpand(ent.key)}
                  features={expandedKey === ent.key ? keyFeatures : []}
                  loadingFeatures={expandedKey === ent.key && loadingFeatures}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntitlementRow({
  entitlement,
  isExpanded,
  onToggleExpand,
  features,
  loadingFeatures,
}: {
  entitlement: {
    key: EntitlementKeyType;
    name: string;
    description: string;
    type: "BOOLEAN" | "QUOTA";
    featureCount: number;
    productCount: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  features: FeatureDTO[];
  loadingFeatures: boolean;
}) {
  return (
    <div className="border border-hairline rounded bg-surface">
      <div
        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-white/5"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-xs text-orange-400 font-mono">{entitlement.key}</code>
            <span
              className={`text-xs px-1.5 py-0.5 rounded border ${
                entitlement.type === "QUOTA"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
            >
              {entitlement.type}
            </span>
          </div>
          <div className="text-sm text-white mt-0.5">{entitlement.name}</div>
          {entitlement.description && (
            <div className="text-xs text-neutral-500 mt-0.5">{entitlement.description}</div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>{entitlement.featureCount} features</span>
          <span>{entitlement.productCount} products</span>
          <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-hairline p-3 bg-surface-strong">
          {loadingFeatures ? (
            <div className="text-sm text-neutral-400">Loading features...</div>
          ) : features.length === 0 ? (
            <div className="text-sm text-neutral-500">No features mapped to this entitlement key.</div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-neutral-400 mb-2">Features using this entitlement:</div>
              {features.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${
                      MODULE_COLORS[f.module]
                    }`}
                  >
                    {MODULE_LABELS[f.module]}
                  </span>
                  <code className="text-xs text-orange-400 font-mono">{f.key}</code>
                  <span className="text-neutral-300">{f.name}</span>
                  {!f.isActive && (
                    <span className="text-xs text-yellow-400">(inactive)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions Tab (Enhanced)
// ────────────────────────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [selectedSub, setSelectedSub] = React.useState<SubscriptionDTO | null>(null);

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

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await adminSubscriptionApi.updateSubscription(id, { status });
      reload();
      setSelectedSub(null);
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-surface-strong border border-hairline rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">About Subscriptions</h3>
        <p className="text-sm text-neutral-400">
          Subscriptions are tenant instances of Products. When a tenant subscribes to a product,
          they receive all entitlements (and thus features) that product grants.
          Click a subscription row to view details and manage status.
        </p>
      </div>

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
        <div className="py-8 text-center text-neutral-400">Loading subscriptions...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && subscriptions.length === 0 && (
        <div className="py-8 text-center text-neutral-400">No subscriptions found</div>
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
                <tr
                  key={sub.id}
                  className="hover:bg-white/5 cursor-pointer"
                  onClick={() => setSelectedSub(sub)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{sub.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{sub.tenant?.name || `Tenant #${sub.tenantId}`}</div>
                    <div className="text-xs text-neutral-400">{sub.tenant?.primaryEmail || "—"}</div>
                  </td>
                  <td className="px-3 py-2">{sub.product?.name || `Product #${sub.productId}`}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        STATUS_COLORS[sub.status] || STATUS_COLORS.EXPIRED
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(sub.currentPeriodEnd)}</td>
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[120px]">
                    {sub.stripeSubscriptionId || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {sub.status !== "CANCELED" && sub.status !== "EXPIRED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(sub.id);
                        }}
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

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <SubscriptionDetailModal
          subscription={selectedSub}
          onClose={() => setSelectedSub(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

function SubscriptionDetailModal({
  subscription,
  onClose,
  onUpdateStatus,
}: {
  subscription: SubscriptionDTO;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[600px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="text-lg font-semibold mb-4">Subscription Details</div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary">Tenant</div>
              <div className="text-sm text-white">
                {subscription.tenant?.name || `Tenant #${subscription.tenantId}`}
              </div>
              <div className="text-xs text-neutral-400">{subscription.tenant?.primaryEmail}</div>
            </div>
            <div>
              <div className="text-xs text-secondary">Product</div>
              <div className="text-sm text-white">
                {subscription.product?.name || `Product #${subscription.productId}`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary">Status</div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  STATUS_COLORS[subscription.status] || STATUS_COLORS.EXPIRED
                }`}
              >
                {subscription.status}
              </span>
            </div>
            <div>
              <div className="text-xs text-secondary">Period End</div>
              <div className="text-sm text-white">{fmtDate(subscription.currentPeriodEnd)}</div>
            </div>
          </div>

          {subscription.stripeSubscriptionId && (
            <div>
              <div className="text-xs text-secondary">Stripe Subscription ID</div>
              <code className="text-sm text-orange-400 font-mono">
                {subscription.stripeSubscriptionId}
              </code>
            </div>
          )}

          {subscription.product?.entitlements && subscription.product.entitlements.length > 0 && (
            <div>
              <div className="text-xs text-secondary mb-2">Entitlements Granted</div>
              <div className="flex flex-wrap gap-2">
                {subscription.product.entitlements.map((ent) => (
                  <span
                    key={ent.entitlementKey}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-strong text-xs border border-hairline"
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

          {/* Status Management */}
          <div className="border-t border-hairline pt-4">
            <div className="text-xs text-secondary mb-2">Change Status</div>
            <div className="flex gap-2 flex-wrap">
              {["ACTIVE", "TRIAL", "PAST_DUE", "CANCELED", "EXPIRED"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={subscription.status === status ? "default" : "outline"}
                  onClick={() => onUpdateStatus(subscription.id, status)}
                  disabled={subscription.status === status}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Products Tab (Enhanced)
// ────────────────────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInactive, setShowInactive] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductDTO | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [managingEntitlements, setManagingEntitlements] = React.useState<ProductDTO | null>(null);

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
      {/* Instructions */}
      <div className="bg-surface-strong border border-hairline rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">About Products</h3>
        <p className="text-sm text-neutral-400">
          Products are purchasable SKUs that sync with Stripe. Each product grants a set of
          <strong> entitlement keys</strong> to subscribers. Click "Manage Entitlements" to
          configure which entitlements (and thus features) a product grants.
        </p>
      </div>

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
        <div className="py-8 text-center text-neutral-400">Loading products...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-8 text-center text-neutral-400">No products found</div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onManageEntitlements={() => setManagingEntitlements(product)}
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

      {/* Entitlements Manager */}
      {managingEntitlements && (
        <ProductEntitlementsModal
          product={managingEntitlements}
          onClose={() => setManagingEntitlements(null)}
          onSaved={() => {
            setManagingEntitlements(null);
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
  onManageEntitlements,
  onReload,
}: {
  product: ProductDTO;
  onEdit: () => void;
  onManageEntitlements: () => void;
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
              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
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
            <p className="text-sm text-neutral-400 mt-1">{product.description || "No description"}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{fmtPrice(product.priceUSD)}</div>
            {product.billingInterval && (
              <div className="text-xs text-neutral-400">/{product.billingInterval.toLowerCase()}</div>
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
              Feature Bullets (Marketing)
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
          <Button size="sm" variant="outline" onClick={onManageEntitlements}>
            Manage Entitlements
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

  const [name, setName] = React.useState(product?.name || "");
  const [description, setDescription] = React.useState(product?.description || "");
  const [type, setType] = React.useState<ProductDTO["type"]>(product?.type || "SUBSCRIPTION");
  const [priceUSD, setPriceUSD] = React.useState(product ? String(product.priceUSD / 100) : "");
  const [billingInterval, setBillingInterval] = React.useState<ProductDTO["billingInterval"]>(
    product?.billingInterval || "MONTHLY"
  );
  const [features, setFeatures] = React.useState((product?.features || []).join("\n"));
  const [sortOrder, setSortOrder] = React.useState(String(product?.sortOrder || 0));

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
          billingInterval: type === "SUBSCRIPTION" ? billingInterval || undefined : undefined,
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
        <div className="text-lg font-semibold mb-4">{isEdit ? "Edit Product" : "New Product"}</div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-secondary mb-1">
              Name <span className="text-orange-500">*</span>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro Plan" />
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
                      setBillingInterval(e.target.value as ProductDTO["billingInterval"])
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
            <div className="text-xs text-secondary mb-1">Marketing Features (one per line)</div>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Up to 100 animals\nPriority support\n..."
              rows={4}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary resize-none"
            />
            <div className="text-xs text-neutral-500 mt-1">
              These are display bullets for pricing pages, not the actual entitlements
            </div>
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

function ProductEntitlementsModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [working, setWorking] = React.useState(false);
  const [entitlements, setEntitlements] = React.useState<ProductEntitlementDTO[]>(
    product.entitlements || []
  );
  const [addingKey, setAddingKey] = React.useState<EntitlementKeyType | "">("");
  const [addingLimit, setAddingLimit] = React.useState<string>("");

  const existingKeys = new Set(entitlements.map((e) => e.entitlementKey));

  const handleAdd = async () => {
    if (!addingKey) return;
    setWorking(true);
    try {
      const limitValue = addingLimit.trim() === "" ? null : parseInt(addingLimit);
      await adminSubscriptionApi.addEntitlement(product.id, {
        entitlementKey: addingKey,
        limitValue: isNaN(limitValue as number) ? null : limitValue,
      });
      setEntitlements([
        ...entitlements,
        { entitlementKey: addingKey, limitValue: isNaN(limitValue as number) ? null : limitValue },
      ]);
      setAddingKey("");
      setAddingLimit("");
    } catch (e: any) {
      alert(e.message || "Failed to add entitlement");
    } finally {
      setWorking(false);
    }
  };

  const handleRemove = async (key: string) => {
    if (!window.confirm(`Remove entitlement "${ENTITLEMENT_LABELS[key] || key}"?`)) return;
    setWorking(true);
    try {
      await adminSubscriptionApi.removeEntitlement(product.id, key);
      setEntitlements(entitlements.filter((e) => e.entitlementKey !== key));
    } catch (e: any) {
      alert(e.message || "Failed to remove entitlement");
    } finally {
      setWorking(false);
    }
  };

  const handleUpdateLimit = async (key: string, newLimit: string) => {
    setWorking(true);
    try {
      const limitValue = newLimit.trim() === "" ? null : parseInt(newLimit);
      await adminSubscriptionApi.updateEntitlement(product.id, key, {
        limitValue: isNaN(limitValue as number) ? null : limitValue,
      });
      setEntitlements(
        entitlements.map((e) =>
          e.entitlementKey === key
            ? { ...e, limitValue: isNaN(limitValue as number) ? null : limitValue }
            : e
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to update limit");
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
      <div className="relative w-[600px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="text-lg font-semibold mb-2">Manage Entitlements</div>
        <div className="text-sm text-neutral-400 mb-4">
          Configure which entitlements "{product.name}" grants to subscribers.
        </div>

        <div className="space-y-4">
          {/* Current Entitlements */}
          {entitlements.length > 0 && (
            <div className="space-y-2">
              {entitlements.map((ent) => (
                <div
                  key={ent.entitlementKey}
                  className="flex items-center gap-3 p-2 rounded bg-surface-strong border border-hairline"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {ENTITLEMENT_LABELS[ent.entitlementKey] || ent.entitlementKey}
                    </div>
                    <code className="text-xs text-orange-400 font-mono">{ent.entitlementKey}</code>
                  </div>
                  {isQuotaEntitlement(ent.entitlementKey) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Limit:</span>
                      <Input
                        type="number"
                        min="0"
                        value={ent.limitValue === null ? "" : String(ent.limitValue)}
                        onChange={(e) => handleUpdateLimit(ent.entitlementKey, e.target.value)}
                        placeholder="∞"
                        className="w-20 h-7 text-xs"
                        disabled={working}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-green-400">✓ Enabled</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(ent.entitlementKey)}
                    disabled={working}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {entitlements.length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-4">
              No entitlements configured. Add entitlements below.
            </div>
          )}

          {/* Add Entitlement */}
          <div className="border-t border-hairline pt-4">
            <div className="text-xs text-secondary mb-2">Add Entitlement</div>
            <div className="flex items-center gap-2">
              <select
                value={addingKey}
                onChange={(e) => setAddingKey(e.target.value as EntitlementKeyType | "")}
                className="flex-1 h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                disabled={working}
              >
                <option value="">Select entitlement...</option>
                {ENTITLEMENT_KEYS.filter((k) => !existingKeys.has(k)).map((k) => (
                  <option key={k} value={k}>
                    {ENTITLEMENT_LABELS[k] || k}
                  </option>
                ))}
              </select>
              {addingKey && isQuotaEntitlement(addingKey) && (
                <Input
                  type="number"
                  min="0"
                  value={addingLimit}
                  onChange={(e) => setAddingLimit(e.target.value)}
                  placeholder="Limit (empty = ∞)"
                  className="w-32 h-9"
                  disabled={working}
                />
              )}
              <Button size="sm" onClick={handleAdd} disabled={!addingKey || working}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Analytics Tab
// ────────────────────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [analytics, setAnalytics] = React.useState<FeatureAnalyticsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [orphanedFeatures, setOrphanedFeatures] = React.useState<FeatureDTO[]>([]);
  const [ungatedKeys, setUngatedKeys] = React.useState<string[]>([]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, orphanedRes, ungatedRes] = await Promise.all([
        adminFeatureApi.getFeatureAnalytics(),
        adminFeatureApi.getOrphanedFeatures({ days: 30 }),
        adminFeatureApi.getUngatedFeatureKeys({ days: 30 }),
      ]);
      setAnalytics(analyticsRes);
      setOrphanedFeatures(orphanedRes.features || []);
      setUngatedKeys(ungatedRes.featureKeys || []);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-surface-strong border border-hairline rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Feature Analytics</h3>
        <p className="text-sm text-neutral-400">
          Track how features are being used across the platform. See which features are most popular,
          identify upgrade opportunities from denied access attempts, and catch orphaned or ungated features.
        </p>
      </div>

      {loading && (
        <div className="py-8 text-center text-neutral-400">Loading analytics...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-400">Error: {error}</div>
      )}

      {!loading && !error && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-xs text-neutral-400 uppercase tracking-wide">Total Checks</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {analytics.totalChecks.toLocaleString()}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-xs text-neutral-400 uppercase tracking-wide">Denied Access</div>
                <div className="text-2xl font-bold text-red-400 mt-1">
                  {analytics.totalDenied.toLocaleString()}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-xs text-neutral-400 uppercase tracking-wide">Orphaned Features</div>
                <div className="text-2xl font-bold text-yellow-400 mt-1">
                  {orphanedFeatures.length}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-xs text-neutral-400 uppercase tracking-wide">Ungated Keys</div>
                <div className="text-2xl font-bold text-orange-400 mt-1">{ungatedKeys.length}</div>
              </div>
            </Card>
          </div>

          {/* Top Features */}
          {analytics.topFeatures.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Most Used Features</h3>
                <div className="space-y-2">
                  {analytics.topFeatures.slice(0, 10).map((f, i) => (
                    <div key={f.featureKey} className="flex items-center gap-3">
                      <span className="w-6 text-xs text-neutral-500">{i + 1}.</span>
                      <code className="text-xs text-orange-400 font-mono flex-1">{f.featureKey}</code>
                      <span className="text-sm text-neutral-300">{f.featureName}</span>
                      <span className="text-sm text-white font-medium">{f.checkCount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Denied Attempts */}
          {analytics.deniedAttempts.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Upgrade Opportunities</h3>
                <p className="text-xs text-neutral-400 mb-3">
                  Features users tried to access but were denied - potential upgrade targets.
                </p>
                <div className="space-y-2">
                  {analytics.deniedAttempts.slice(0, 10).map((f) => (
                    <div key={f.featureKey} className="flex items-center gap-3">
                      <code className="text-xs text-orange-400 font-mono flex-1">{f.featureKey}</code>
                      <span className="text-sm text-neutral-300">{f.featureName}</span>
                      <span className="text-sm text-red-400">{f.denyCount} denied</span>
                      <span className="text-xs text-neutral-500">({f.tenantCount} tenants)</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Orphaned Features */}
          {orphanedFeatures.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Orphaned Features</h3>
                <p className="text-xs text-neutral-400 mb-3">
                  Features registered in the database but never checked in code (last 30 days).
                  Consider archiving if no longer needed.
                </p>
                <div className="space-y-1">
                  {orphanedFeatures.map((f) => (
                    <div key={f.id} className="flex items-center gap-2">
                      <code className="text-xs text-orange-400 font-mono">{f.key}</code>
                      <span className="text-sm text-neutral-300">{f.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border ${MODULE_COLORS[f.module]}`}
                      >
                        {MODULE_LABELS[f.module]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Ungated Keys */}
          {ungatedKeys.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Ungated Feature Keys</h3>
                <p className="text-xs text-neutral-400 mb-3">
                  Feature keys being checked in code but not registered in the database.
                  Register these to track them properly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ungatedKeys.map((key) => (
                    <code
                      key={key}
                      className="text-xs text-orange-400 font-mono px-2 py-1 rounded bg-surface-strong border border-hairline"
                    >
                      {key}
                    </code>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* No Issues */}
          {orphanedFeatures.length === 0 && ungatedKeys.length === 0 && (
            <div className="text-center py-4 text-green-400">
              All features are properly registered and tracked.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────

type Tab = "subscriptions" | "products" | "features" | "entitlements" | "analytics";

export default function SubscriptionAdmin() {
  const [activeTab, setActiveTab] = React.useState<Tab>("features");

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "features", label: "Features" },
    { key: "entitlements", label: "Entitlements" },
    { key: "products", label: "Products" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Subscription Management"
        subtitle="Manage features, entitlements, products, and tenant subscriptions"
      />

      {/* Tab Navigation */}
      <div className="border-b border-hairline">
        <nav className="inline-flex items-end gap-6" role="tablist">
          {tabs.map((tab) => {
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
                  borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "features" && <FeaturesTab />}
      {activeTab === "entitlements" && <EntitlementsTab />}
      {activeTab === "products" && <ProductsTab />}
      {activeTab === "subscriptions" && <SubscriptionsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

// apps/platform/src/components/GeneralSettingsTab.tsx
// Settings tab for configuring general platform preferences including default views

import React from "react";
import { Card, SectionCard } from "@bhq/ui";
import {
  type ViewPreferencesConfig,
  type ViewMode,
  type ViewPreferenceModule,
  VIEW_PREFERENCE_MODULES,
  DEFAULT_VIEW_PREFERENCES,
} from "@bhq/api";
import {
  fetchViewPreferences,
  saveViewPreferences,
} from "@bhq/ui/utils/viewPreferences";
import { resolveTenantId } from "@bhq/ui/utils/tenant";
import { LayoutGrid, Table } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type GeneralSettingsHandle = {
  save: () => Promise<void>;
};

type Props = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
};

// ============================================================================
// Helpers
// ============================================================================

async function resolveTenantIdSafe(): Promise<string | null> {
  try {
    const raw = await resolveTenantId();
    const trimmed = (raw == null ? "" : String(raw)).trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function ViewModeToggle({
  module,
  label,
  description,
  value,
  onChange,
}: {
  module: ViewPreferenceModule;
  label: string;
  description: string;
  value: ViewMode;
  onChange: (module: ViewPreferenceModule, value: ViewMode) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-hairline last:border-b-0">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
      <div className="flex items-center gap-1 p-0.5 rounded-md bg-surface-raised">
        <button
          type="button"
          onClick={() => onChange(module, "cards")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            value === "cards"
              ? "bg-[hsl(var(--brand-orange))] text-black"
              : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
          }`}
          aria-label="Card view"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(module, "table")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            value === "table"
              ? "bg-[hsl(var(--brand-orange))] text-black"
              : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
          }`}
          aria-label="Table view"
        >
          <Table className="w-3.5 h-3.5" />
          <span>Table</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const GeneralSettingsTab = React.forwardRef<GeneralSettingsHandle, Props>(
  function GeneralSettingsTabImpl({ onDirty }, ref) {
    // State
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [initial, setInitial] = React.useState<ViewPreferencesConfig>(DEFAULT_VIEW_PREFERENCES);
    const [form, setForm] = React.useState<ViewPreferencesConfig>(DEFAULT_VIEW_PREFERENCES);

    // Dirty tracking
    const isDirty = React.useMemo(
      () => JSON.stringify(form) !== JSON.stringify(initial),
      [form, initial]
    );
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    // Load config on mount
    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true);
          setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
          const config = await fetchViewPreferences(tenantId);
          if (!ignore) {
            setInitial(config);
            setForm(config);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load general settings");
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
      return () => {
        ignore = true;
      };
    }, []);

    // Save handler
    async function saveAll() {
      setError("");
      try {
        const tenantId = await resolveTenantIdSafe();
        if (!tenantId) throw new Error("Missing tenant id");
        const saved = await saveViewPreferences(form, tenantId);
        setInitial(saved);
        setForm(saved);
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Failed to save general settings");
      }
    }

    React.useImperativeHandle(ref, () => ({
      async save() {
        await saveAll();
      },
    }));

    // Update handler
    const handleViewModeChange = (module: ViewPreferenceModule, value: ViewMode) => {
      setForm((f) => ({ ...f, [module]: value }));
    };

    if (loading) {
      return (
        <SectionCard title="General Settings" subtitle="Configure platform-wide preferences">
          <div className="text-sm text-secondary">Loading...</div>
        </SectionCard>
      );
    }

    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Default View Preferences */}
        <SectionCard
          title="Default View Preferences"
          subtitle="Set the default view mode (cards or table) for each module when users first log in"
        >
          <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-4">
            <div className="text-sm font-medium text-blue-300 mb-2">How View Defaults Work</div>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>These settings determine the default view for users who haven't set their own preference</li>
              <li>Users can always toggle between card and table views within each module</li>
              <li>Once a user changes their view in a module, their preference is saved locally</li>
              <li>These defaults apply to all new users and users who haven't customized their view</li>
            </ul>
          </Card>

          <Card className="p-4">
            <div className="space-y-1">
              {VIEW_PREFERENCE_MODULES.map((moduleInfo) => (
                <ViewModeToggle
                  key={moduleInfo.key}
                  module={moduleInfo.key}
                  label={moduleInfo.label}
                  description={moduleInfo.description}
                  value={form[moduleInfo.key]}
                  onChange={handleViewModeChange}
                />
              ))}
            </div>
          </Card>
        </SectionCard>
      </div>
    );
  }
);

export { GeneralSettingsTab };
export default GeneralSettingsTab;

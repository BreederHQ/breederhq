// apps/animals/src/components/PrivacyTab.tsx
// Privacy tab for animal detail view - consolidates all privacy/sharing controls

import React, { useEffect, useState, useCallback } from "react";
import { makeApi, type PrivacySettings } from "../api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  species?: string;
  sex?: string;
};

type Mode = "view" | "edit";

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper Components
 * ───────────────────────────────────────────────────────────────────────────── */

function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  readOnly,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  // In read-only mode, show a visual indicator instead of a checkbox
  // Use strict boolean check - only show read-only when explicitly true
  if (readOnly === true) {
    return (
      <div className="flex items-start gap-3 py-2 select-none">
        <div className="pt-0.5">
          <div
            className={`w-4 h-4 rounded flex items-center justify-center ${
              checked
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-surface border border-hairline"
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-secondary">{description}</div>
        </div>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("PrivacyToggle clicked:", { label, checked, disabled, readOnly });
    if (!disabled) {
      console.log("Calling onChange with:", !checked);
      onChange(!checked);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={`flex items-start gap-3 py-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/5"}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      <div className="pt-0.5 pointer-events-none">
        <div
          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
            checked
              ? "bg-accent border-accent"
              : "bg-surface border-hairline"
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 pointer-events-none">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
    </div>
  );
}

function PrivacySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function PrivacyBadge({ isPublic, size = "sm" }: { isPublic: boolean; size?: "sm" | "xs" }) {
  const sizeClasses = size === "xs" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs";

  if (isPublic) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} bg-green-500/20 text-green-400 border border-green-500/30`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Shared
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Private
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function PrivacyTab({ animal, mode }: { animal: AnimalRow; mode: Mode }) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.animals.lineage.getPrivacySettings(animal.id);
      setSettings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load privacy settings");
    } finally {
      setLoading(false);
    }
  }, [animal.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key: keyof Omit<PrivacySettings, "animalId">, value: boolean) => {
    console.log("updateSetting called:", { key, value, settings: !!settings, mode });
    if (!settings || mode !== "edit") {
      console.log("updateSetting early return - settings:", !!settings, "mode:", mode);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.animals.lineage.updatePrivacySettings(animal.id, { [key]: value });
      setSettings(updated);
    } catch (err: any) {
      console.error("Failed to update privacy setting:", err);
      setError(err?.message || "Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
        Loading privacy settings...
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-2">Error loading privacy settings</div>
        <div className="text-secondary text-sm">{error}</div>
        <button
          onClick={loadSettings}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!settings) return null;

  const isEditable = mode === "edit";
  const masterEnabled = settings.allowCrossTenantMatching;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="text-lg font-semibold">Privacy & Sharing</h3>
            <p className="text-sm text-secondary">
              Control what information is visible to other breeders in the BreederHQ network
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-secondary">(saving...)</span>}
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${
              masterEnabled ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {masterEnabled ? "Discoverable" : "Private"}
          </span>
        </div>
      </div>

      {/* Master Toggle - Prominent Card */}
      <div
        className={`rounded-lg border-2 p-4 ${
          masterEnabled
            ? "border-green-500/40 bg-green-500/5"
            : "border-yellow-500/40 bg-yellow-500/5"
        }`}
      >
        <PrivacyToggle
          label="Enable network visibility"
          description="Allow BreederHQ to match this animal with records from other breeders (via microchip, registry number, etc.). When disabled, this animal won't appear in other breeders' pedigrees."
          checked={masterEnabled}
          onChange={(v) => updateSetting("allowCrossTenantMatching", v)}
          disabled={!isEditable}
          readOnly={!isEditable}
        />
      </div>

      {/* Warning when master is disabled */}
      {!masterEnabled && (
        <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
          Network visibility is disabled. This animal won't appear in other breeders' pedigrees and COI
          calculations across programs won't include this animal's lineage. Enable network visibility to
          configure sharing options below.
        </div>
      )}

      {/* Settings Sections - Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Identity Section */}
          <PrivacySection title="Identity" icon="🏷️" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Show name"
              description="Display this animal's name to other breeders"
              checked={settings.showName}
              onChange={(v) => updateSetting("showName", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show photo"
              description="Display this animal's main photo in shared pedigrees"
              checked={settings.showPhoto}
              onChange={(v) => updateSetting("showPhoto", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show full birth date"
              description="Show complete DOB (otherwise only year is shown)"
              checked={settings.showFullDob}
              onChange={(v) => updateSetting("showFullDob", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
          </PrivacySection>

          {/* Health Section */}
          <PrivacySection title="Health" icon="🏥" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Enable health sharing"
              description="Allow individual health tests to be shared with the network. When enabled, you can select which specific tests to share in the Health tab."
              checked={settings.enableHealthSharing ?? false}
              onChange={(v) => updateSetting("enableHealthSharing", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            {settings.enableHealthSharing && (
              <div className="text-xs text-secondary mt-2 pl-7">
                Visit the <span className="font-medium text-primary">Health</span> tab to select which individual tests to share.
              </div>
            )}
          </PrivacySection>

          {/* Genetics Section */}
          <PrivacySection title="Genetics" icon="🧬" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Enable genetics sharing"
              description="Allow individual genetic results to be shared with the network. When enabled, you can select which specific results to share in the Genetics tab."
              checked={settings.enableGeneticsSharing ?? false}
              onChange={(v) => updateSetting("enableGeneticsSharing", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            {settings.enableGeneticsSharing && (
              <div className="text-xs text-secondary mt-2 pl-7">
                Visit the <span className="font-medium text-primary">Genetics</span> tab to select which individual results to share.
              </div>
            )}
          </PrivacySection>

          {/* Breeding Section */}
          <PrivacySection title="Breeding" icon="🐾" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Show breeding history"
              description="Display past matings, litter counts, and offspring information"
              checked={settings.showBreedingHistory ?? false}
              onChange={(v) => updateSetting("showBreedingHistory", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
          </PrivacySection>

          {/* Achievements Section - Bottom of left column */}
          <PrivacySection title="Achievements" icon="🏆" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Show titles"
              description="Display earned titles (CH, GCH, etc.) in shared pedigrees"
              checked={settings.showTitles ?? true}
              onChange={(v) => updateSetting("showTitles", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show title details"
              description="Include event name, location, and date where titles were earned"
              checked={settings.showTitleDetails ?? false}
              onChange={(v) => updateSetting("showTitleDetails", v)}
              disabled={!isEditable || !masterEnabled || !settings.showTitles}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show competitions"
              description="Display competition entry count and aggregate placement stats"
              checked={settings.showCompetitions ?? false}
              onChange={(v) => updateSetting("showCompetitions", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show competition details"
              description="Include individual competition results and scores"
              checked={settings.showCompetitionDetails ?? false}
              onChange={(v) => updateSetting("showCompetitionDetails", v)}
              disabled={!isEditable || !masterEnabled || !settings.showCompetitions}
              readOnly={!isEditable}
            />
          </PrivacySection>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Registry Section */}
          <PrivacySection title="Registry" icon="📋" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Show full registry numbers"
              description="Show complete AKC/UKC/etc. numbers (otherwise only last 4 digits)"
              checked={settings.showRegistryFull}
              onChange={(v) => updateSetting("showRegistryFull", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Show breeder information"
              description="Display breeder name and program details"
              checked={settings.showBreeder}
              onChange={(v) => updateSetting("showBreeder", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
          </PrivacySection>

          {/* Contact Section */}
          <PrivacySection title="Contact Preferences" icon="📧" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Allow info requests"
              description="Let other breeders request additional information about this animal"
              checked={settings.allowInfoRequests}
              onChange={(v) => updateSetting("allowInfoRequests", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            <PrivacyToggle
              label="Allow direct contact"
              description="Show your contact information directly (otherwise they must send a request)"
              checked={settings.allowDirectContact}
              onChange={(v) => updateSetting("allowDirectContact", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
          </PrivacySection>

          {/* Documents Section */}
          <PrivacySection title="Documents" icon="📄" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Enable document sharing"
              description="Allow individual documents to be shared with the network. When enabled, you can select which specific documents to share in the Documents tab."
              checked={settings.enableDocumentSharing ?? false}
              onChange={(v) => updateSetting("enableDocumentSharing", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            {settings.enableDocumentSharing && (
              <div className="text-xs text-secondary mt-2 pl-7">
                Visit the <span className="font-medium text-primary">Documents</span> tab to select which individual documents to share.
              </div>
            )}
          </PrivacySection>

          {/* Media Section - Under Documents */}
          <PrivacySection title="Media" icon="📷" disabled={!masterEnabled}>
            <PrivacyToggle
              label="Enable media sharing"
              description="Allow individual photos and videos to be shared with the network. When enabled, you can select which specific media items to share in the Media tab."
              checked={settings.enableMediaSharing ?? false}
              onChange={(v) => updateSetting("enableMediaSharing", v)}
              disabled={!isEditable || !masterEnabled}
              readOnly={!isEditable}
            />
            {settings.enableMediaSharing && (
              <div className="text-xs text-secondary mt-2 pl-7">
                Visit the <span className="font-medium text-primary">Media</span> tab to select which individual items to share.
              </div>
            )}
          </PrivacySection>
        </div>
      </div>
    </div>
  );
}

export default PrivacyTab;

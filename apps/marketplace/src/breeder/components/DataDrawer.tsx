// apps/marketplace/src/breeder/components/DataDrawer.tsx

import * as React from "react";
import { Dialog } from "@bhq/ui";
import { Eye, EyeOff } from "lucide-react";
import type {
  AnimalListingData,
  DataDrawerConfig,
  HealthTrait,
  TitleItem,
  CompetitionItem,
  MediaItem,
  DocumentItem,
  RegistryItem,
} from "../../api/client";
import "./DataDrawer.css";

export interface DataDrawerProps {
  open: boolean;
  onClose: () => void;
  animalData: AnimalListingData | null;
  initialConfig?: DataDrawerConfig;
  onSave: (config: DataDrawerConfig) => void;
  embedded?: boolean; // If true, renders without Dialog wrapper
}

type SectionKey =
  | "achievements"
  | "breeding"
  | "documents"
  | "genetics"
  | "health"
  | "lineage"
  | "media"
  | "registry";

interface SectionInfo {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

const SECTIONS: SectionInfo[] = [
  { key: "achievements", label: "Achievements", icon: "🏆", description: "Titles and competition results" },
  { key: "breeding", label: "Breeding", icon: "🐾", description: "Offspring count and breeding history" },
  { key: "documents", label: "Documents", icon: "📄", description: "Certificates, health records, contracts" },
  { key: "genetics", label: "Genetics", icon: "🧬", description: "DNA test results and genetic data" },
  { key: "health", label: "Health", icon: "❤️", description: "Health testing and clearances" },
  { key: "lineage", label: "Lineage", icon: "🌳", description: "Sire and dam information" },
  { key: "media", label: "Media", icon: "📸", description: "Photos and videos" },
  { key: "registry", label: "Registry", icon: "📋", description: "Registration numbers" },
];

export function DataDrawer({ open, onClose, animalData, initialConfig, onSave, embedded }: DataDrawerProps) {
  const [config, setConfig] = React.useState<DataDrawerConfig>(initialConfig || {});
  const [activeSection, setActiveSection] = React.useState<SectionKey | null>(null);

  // Track the last config we sent to parent (for embedded mode auto-save)
  const lastSavedConfigRef = React.useRef<string>(JSON.stringify(initialConfig || {}));

  // Track whether we're in the middle of a save cycle to prevent re-initialization
  const isSavingRef = React.useRef(false);

  // Sync local state when initialConfig prop changes from parent
  // This handles: drawer open/close, external data refresh, etc.
  React.useEffect(() => {
    const newConfigStr = JSON.stringify(initialConfig || {});
    const currentConfigStr = JSON.stringify(config);

    // Skip if we're in a save cycle (our own changes propagating back)
    if (isSavingRef.current) {
      // Check if the incoming config matches what we saved
      if (newConfigStr === lastSavedConfigRef.current) {
        isSavingRef.current = false;
      }
      return;
    }

    // Reinitialize if parent's config is different from our local state
    if (newConfigStr !== currentConfigStr) {
      setConfig(initialConfig || {});
      lastSavedConfigRef.current = newConfigStr;
    }
  }, [initialConfig]); // Intentionally excluding config to avoid loops

  // In embedded mode, automatically call onSave when config changes
  React.useEffect(() => {
    if (!embedded) return;

    const currentConfigStr = JSON.stringify(config);

    // Only save if the current config is different from what we last saved
    if (currentConfigStr !== lastSavedConfigRef.current) {
      // Mark that we're saving to prevent the sync effect from overwriting
      isSavingRef.current = true;
      lastSavedConfigRef.current = currentConfigStr;
      onSave(config);
    }
  }, [config, embedded, onSave]);

  // Helper to check if section is enabled by privacy
  const isSectionEnabled = (key: SectionKey): boolean => {
    if (!animalData) return false;
    switch (key) {
      case "health":
        return animalData.health.enabled;
      case "genetics":
        return animalData.genetics.enabled;
      case "achievements":
        return animalData.titles.enabled || animalData.competitions.enabled;
      case "media":
        return animalData.media.enabled;
      case "documents":
        return animalData.documents.enabled;
      case "breeding":
        return animalData.breeding.enabled;
      case "lineage":
        // Lineage doesn't have a privacy toggle - it's available if parents exist
        return !!(animalData.lineage.sire || animalData.lineage.dam);
      case "registry":
        // Registry requires privacy to be enabled (data check is separate for "empty" state)
        return animalData.privacySettings.showRegistryFull;
      default:
        return false;
    }
  };

  // Helper to get the reason why a section is disabled
  const getDisabledReason = (key: SectionKey): string | null => {
    if (!animalData) return null;

    switch (key) {
      case "registry":
        if (!animalData.privacySettings.showRegistryFull) {
          return "Enable in Privacy tab";
        }
        // If privacy is enabled but no data, section shows as "empty" not "disabled"
        return null;
      case "lineage":
        // Lineage has no privacy toggle, so if disabled it means no parents
        if (!animalData.lineage.sire && !animalData.lineage.dam) {
          return "No parents linked";
        }
        return null;
      case "health":
        if (!animalData.health.enabled) return "Enable in Privacy tab";
        return null;
      case "genetics":
        if (!animalData.genetics.enabled) return "Enable in Privacy tab";
        return null;
      case "media":
        if (!animalData.media.enabled) return "Enable in Privacy tab";
        return null;
      case "documents":
        if (!animalData.documents.enabled) return "Enable in Privacy tab";
        return null;
      case "breeding":
        if (!animalData.breeding.enabled) return "Enable in Privacy tab";
        return null;
      case "achievements":
        if (!animalData.titles.enabled && !animalData.competitions.enabled) return "Enable in Privacy tab";
        return null;
      default:
        return "Enable in Privacy tab";
    }
  };

  // Helper to get count of items in section
  const getSectionCount = (key: SectionKey): number => {
    if (!animalData) return 0;
    switch (key) {
      case "health":
        return animalData.health.eligibleTraits.length;
      case "genetics":
        return animalData.genetics.data ? 1 : 0;
      case "achievements":
        return animalData.titles.eligibleTitles.length + animalData.competitions.eligibleCompetitions.length;
      case "media":
        return animalData.media.items.length;
      case "documents":
        return animalData.documents.items.length;
      case "breeding":
        return 1; // Offspring count
      case "lineage":
        return (animalData.lineage.sire ? 1 : 0) + (animalData.lineage.dam ? 1 : 0);
      case "registry":
        return animalData.registrations.length;
      default:
        return 0;
    }
  };

  // Helper to check if section has partial visibility (some items hidden by per-item flags)
  const hasPartialVisibility = (key: SectionKey): boolean => {
    if (!animalData) return false;

    switch (key) {
      case "health":
        // Check if some traits are not marketplace visible
        return animalData.health.allTraits &&
               animalData.health.allTraits.length > animalData.health.eligibleTraits.length;
      case "achievements":
        // Check if some titles/competitions are not public
        return (animalData.titles.allTitles &&
                animalData.titles.allTitles.length > animalData.titles.eligibleTitles.length) ||
               (animalData.competitions.allCompetitions &&
                animalData.competitions.allCompetitions.length > animalData.competitions.eligibleCompetitions.length);
      case "documents":
      case "media":
        // For documents/media, we'd need total count vs eligible count
        // This would require updating the API to return total counts
        // For now, return false - can enhance later
        return false;
      default:
        return false;
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const toggleSection = (key: SectionKey, enabled: boolean) => {
    if (!animalData) return;

    // When enabling a section, auto-select all available items
    if (enabled) {
      selectAllInSection(key);
    } else {
      // When disabling, just turn off the section
      setConfig((prev) => ({
        ...prev,
        [key]: { ...prev[key], enabled: false },
      }));
    }
  };

  const selectAllInSection = (key: SectionKey) => {
    if (!animalData) return;

    switch (key) {
      case "health":
        setConfig((prev) => ({
          ...prev,
          health: {
            enabled: true,
            traitIds: animalData.health.eligibleTraits.map((t) => t.id),
          },
        }));
        break;
      case "achievements":
        setConfig((prev) => ({
          ...prev,
          achievements: {
            enabled: true,
            titleIds: animalData.titles.eligibleTitles.map((t) => t.id),
            competitionIds: animalData.competitions.eligibleCompetitions.map((c) => c.id),
          },
        }));
        break;
      case "media":
        setConfig((prev) => ({
          ...prev,
          media: {
            enabled: true,
            mediaIds: animalData.media.items.map((m) => m.id),
          },
        }));
        break;
      case "documents":
        setConfig((prev) => ({
          ...prev,
          documents: {
            enabled: true,
            documentIds: animalData.documents.items.map((d) => d.id),
          },
        }));
        break;
      case "registry":
        setConfig((prev) => ({
          ...prev,
          registry: {
            enabled: true,
            registryIds: animalData.registrations.map((r) => r.id),
          },
        }));
        break;
      case "genetics":
        setConfig((prev) => ({
          ...prev,
          genetics: {
            enabled: true,
            showBreedComposition: true,
            showHealthGenetics: true,
            showCoatColor: true,
            showCOI: true,
            showPredictedWeight: true,
          },
        }));
        break;
      case "lineage":
        setConfig((prev) => ({
          ...prev,
          lineage: {
            enabled: true,
            showSire: !!animalData.lineage.sire,
            showDam: !!animalData.lineage.dam,
          },
        }));
        break;
      case "breeding":
        setConfig((prev) => ({
          ...prev,
          breeding: {
            enabled: true,
            showOffspringCount: true,
          },
        }));
        break;
    }
  };

  const deselectAllInSection = (key: SectionKey) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { enabled: false },
    }));
  };

  if (!animalData) {
    return null;
  }

  const drawerContent = (
    <div className="data-drawer">
        {/* Empty State */}
        {SECTIONS.every((s) => !isSectionEnabled(s.key)) && (
          <div className="data-drawer__empty">
            <div className="data-drawer__empty-icon">🔒</div>
            <h3>No Data Available</h3>
            <p>
              All sections are disabled based on your privacy settings. Visit the Privacy tab in your animal's profile
              to enable data sharing.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // TODO: Link to animal privacy tab
                window.alert("Navigate to animal Privacy tab");
              }}
            >
              Manage Privacy Settings
            </button>
          </div>
        )}

        {/* Two-column layout */}
        {SECTIONS.some((s) => isSectionEnabled(s.key)) && (
          <div className="data-drawer__content">
            {/* Left: Section Selector */}
            <div className="data-drawer__sections">
              <div className="data-drawer__sections-header">
                <h4>Data Sections</h4>
                <p className="text-sm text-muted">Select which data to include in this listing</p>
              </div>

              <div className="data-drawer__sections-list">
                {SECTIONS.map((section) => {
                  const enabled = isSectionEnabled(section.key);
                  const selected = config[section.key]?.enabled ?? false;
                  const count = getSectionCount(section.key);
                  const partial = enabled && hasPartialVisibility(section.key);
                  const isEmpty = enabled && count === 0;

                  return (
                    <div
                      key={section.key}
                      className={[
                        "data-drawer__section-item",
                        activeSection === section.key ? "active" : "",
                        !enabled ? "disabled" : "",
                        partial ? "partial" : "",
                        isEmpty ? "empty" : "",
                      ].join(" ")}
                      onClick={() => enabled && setActiveSection(section.key)}
                      style={{ cursor: enabled ? "pointer" : "not-allowed" }}
                    >
                      <button
                        type="button"
                        className={`data-drawer__section-toggle ${
                          selected
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (enabled) {
                            toggleSection(section.key, !selected);
                          }
                        }}
                        title={selected ? "Visible in listing" : "Hidden from listing"}
                        disabled={!enabled}
                      >
                        {selected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div className="data-drawer__section-info">
                        <div className="data-drawer__section-label">
                          <span className="data-drawer__section-icon">{section.icon}</span>
                          <span>{section.label}</span>
                          {enabled && count > 0 && (
                            <span className="data-drawer__section-count">({count})</span>
                          )}
                        </div>
                        {!enabled && (
                          <div className="data-drawer__section-locked">
                            <span className="text-xs text-muted">
                              {getDisabledReason(section.key)?.includes("Privacy") ? "🔒" : "📭"}{" "}
                              {getDisabledReason(section.key)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="data-drawer__sections-footer">
                <div className="data-drawer__legend">
                  <h5 className="data-drawer__legend-title">Legend</h5>
                  <div className="data-drawer__legend-items">
                    <div className="data-drawer__legend-item">
                      <div className="data-drawer__legend-indicator data-drawer__legend-indicator--active"></div>
                      <span className="text-xs">Fully Available</span>
                    </div>
                    <div className="data-drawer__legend-item">
                      <div className="data-drawer__legend-indicator data-drawer__legend-indicator--empty"></div>
                      <span className="text-xs">Ready - No Data</span>
                    </div>
                    <div className="data-drawer__legend-item">
                      <div className="data-drawer__legend-indicator data-drawer__legend-indicator--partial"></div>
                      <span className="text-xs">Mixed Privacy</span>
                    </div>
                    <div className="data-drawer__legend-item">
                      <div className="data-drawer__legend-indicator data-drawer__legend-indicator--locked"></div>
                      <span className="text-xs">Privacy Locked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Section Detail + Preview */}
            <div className="data-drawer__detail">
              {!activeSection && (
                <div className="data-drawer__instructions">
                  <div className="data-drawer__instructions-icon">📋</div>
                  <h3>How to Customize Your Listing Data</h3>

                  <div className="data-drawer__instructions-section">
                    <h4>1. Choose What to Share</h4>
                    <p>
                      Click on any section on the left to see what information you can include in this listing.
                      Each section (Health, Media, Achievements, etc.) contains different types of data about your animal.
                    </p>
                  </div>

                  <div className="data-drawer__instructions-section">
                    <h4>2. Select Specific Items</h4>
                    <p>
                      When you click a section, you'll see all the items available to share. Check the boxes next to the
                      items you want to include in this particular listing. You can pick and choose exactly what information
                      to show to potential buyers.
                    </p>
                  </div>

                  <div className="data-drawer__instructions-section">
                    <h4>3. Privacy Settings Control Availability</h4>
                    <p>
                      Some sections may be locked (🔒). This means they're disabled in your animal's Privacy Settings.
                      You can enable them by visiting the Privacy tab in your animal's profile, then come back here to
                      select what to include.
                    </p>
                  </div>

                  <div className="data-drawer__instructions-section">
                    <h4>4. Different Listings, Different Data</h4>
                    <p>
                      You can create multiple listings for the same animal with different information. For example, you might
                      share full health testing for a breeding listing, but only basic info for a pet listing. Each listing
                      can be customized separately.
                    </p>
                  </div>

                  <div className="data-drawer__instructions-tip">
                    <strong>💡 Tip:</strong> Start by clicking on the sections you want to include (like Identity or Health),
                    then choose the specific details to share. When you're done, click "Save Configuration" at the bottom.
                  </div>
                </div>
              )}

              {activeSection && (
                <>
                  <SectionDetail
                    sectionKey={activeSection}
                    animalData={animalData}
                    config={config}
                    setConfig={setConfig}
                    onSelectAll={() => selectAllInSection(activeSection)}
                    onDeselectAll={() => deselectAllInSection(activeSection)}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!embedded && (
          <div className="data-drawer__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Configuration
            </button>
          </div>
        )}
      </div>
  );

  // In embedded mode, render content directly. Otherwise wrap in Dialog.
  if (embedded) {
    return drawerContent;
  }

  return (
    <Dialog open={open} onClose={onClose} title="Customize Listing Data" size="xl">
      {drawerContent}
    </Dialog>
  );
}

// Section Detail Component
interface SectionDetailProps {
  sectionKey: SectionKey;
  animalData: AnimalListingData;
  config: DataDrawerConfig;
  setConfig: React.Dispatch<React.SetStateAction<DataDrawerConfig>>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function SectionDetail({ sectionKey, animalData, config, setConfig, onSelectAll, onDeselectAll }: SectionDetailProps) {
  const section = SECTIONS.find((s) => s.key === sectionKey);
  if (!section) return null;

  const sectionConfig = config[sectionKey];
  const isEnabled = sectionConfig?.enabled ?? false;

  return (
    <div className="section-detail">
      <div className="section-detail__header">
        <div>
          <h3>
            {section.icon} {section.label}
          </h3>
          <p className="text-sm text-muted">{section.description}</p>
        </div>
        <div className="section-detail__actions">
          <button type="button" className="btn btn-sm btn-secondary" onClick={onSelectAll} disabled={!isEnabled}>
            Select All
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onDeselectAll}>
            Deselect All
          </button>
        </div>
      </div>

      <div className="section-detail__body">
        {!isEnabled && (
          <div className="section-detail__disabled">
            <p>This section is not enabled. Check the box in the left panel to enable it.</p>
          </div>
        )}

        {isEnabled && (
          <>
            {sectionKey === "health" && <HealthSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "genetics" && <GeneticsSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "achievements" && <AchievementsSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "media" && <MediaSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "documents" && <DocumentsSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "registry" && <RegistrySection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "lineage" && <LineageSection animalData={animalData} config={config} setConfig={setConfig} />}
            {sectionKey === "breeding" && <BreedingSection animalData={animalData} config={config} setConfig={setConfig} />}
          </>
        )}
      </div>
    </div>
  );
}

// Individual Section Components

function HealthSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedIds = config.health?.traitIds || [];
  const traitHistoryEnabled = config.health?.traitHistoryEnabled || {};

  const toggleTrait = (id: number) => {
    setConfig((prev) => {
      const current = prev.health?.traitIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        health: { ...prev.health, enabled: true, traitIds: updated },
      };
    });
  };

  const toggleTraitHistory = (traitId: number) => {
    setConfig((prev) => {
      const currentHistory = prev.health?.traitHistoryEnabled || {};
      return {
        ...prev,
        health: {
          ...prev.health,
          enabled: true,
          traitHistoryEnabled: {
            ...currentHistory,
            [traitId]: !currentHistory[traitId],
          },
        },
      };
    });
  };

  if (animalData.health.eligibleTraits.length === 0) {
    return (
      <div className="section-detail__disabled">
        <p>No health testing data available yet.</p>
        <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
          This section will automatically appear on your listing once you add health tests to this animal's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="section-items">
      {animalData.health.eligibleTraits.map((trait) => {
        const isSelected = selectedIds.includes(trait.id);
        const hasHistory = trait.supportsHistory && (trait.historyCount ?? 0) > 0;
        const showHistory = traitHistoryEnabled[trait.id] ?? false;

        return (
          <div key={trait.id} className="section-item-wrapper">
            <label className="section-item">
              <input type="checkbox" checked={isSelected} onChange={() => toggleTrait(trait.id)} />
              <div className="section-item__info">
                <div className="section-item__label">{trait.displayName}</div>
                <div className="section-item__value text-sm text-muted">
                  {String(trait.value)} {trait.verified && "✓"}
                </div>
              </div>
            </label>
            {/* Show history toggle for traits that support it and have history */}
            {isSelected && hasHistory && (
              <div className="section-item__history-toggle">
                <label className="history-toggle">
                  <input
                    type="checkbox"
                    checked={showHistory}
                    onChange={() => toggleTraitHistory(trait.id)}
                  />
                  <span className="history-toggle__label">
                    Show all {trait.historyCount} records
                  </span>
                  <span className="history-toggle__hint text-xs text-muted">
                    {showHistory ? "(Full history will be displayed)" : "(Only latest shown)"}
                  </span>
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GeneticsSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  if (!animalData.genetics.data) {
    return (
      <div className="section-detail__disabled">
        <p>No genetics data available yet.</p>
        <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
          This section will automatically appear on your listing once you add genetics test results to this animal's profile.
        </p>
      </div>
    );
  }

  const geneticsConfig = config.genetics || {};

  const toggleField = (field: keyof NonNullable<DataDrawerConfig["genetics"]>) => {
    setConfig((prev) => ({
      ...prev,
      genetics: {
        ...prev.genetics,
        enabled: true,
        [field]: !geneticsConfig[field],
      },
    }));
  };

  return (
    <div className="section-items">
      <label className="section-item">
        <input type="checkbox" checked={geneticsConfig.showBreedComposition ?? false} onChange={() => toggleField("showBreedComposition")} />
        <div className="section-item__info">
          <div className="section-item__label">Breed Composition</div>
        </div>
      </label>
      <label className="section-item">
        <input type="checkbox" checked={geneticsConfig.showCoatColor ?? false} onChange={() => toggleField("showCoatColor")} />
        <div className="section-item__info">
          <div className="section-item__label">Coat Color</div>
        </div>
      </label>
      <label className="section-item">
        <input type="checkbox" checked={geneticsConfig.showHealthGenetics ?? false} onChange={() => toggleField("showHealthGenetics")} />
        <div className="section-item__info">
          <div className="section-item__label">Health Genetics</div>
        </div>
      </label>
      <label className="section-item">
        <input type="checkbox" checked={geneticsConfig.showCOI ?? false} onChange={() => toggleField("showCOI")} />
        <div className="section-item__info">
          <div className="section-item__label">Coefficient of Inbreeding (COI)</div>
          {animalData.genetics.data.coi !== null && (
            <div className="section-item__value text-sm text-muted">{animalData.genetics.data.coi}%</div>
          )}
        </div>
      </label>
      <label className="section-item">
        <input type="checkbox" checked={geneticsConfig.showPredictedWeight ?? false} onChange={() => toggleField("showPredictedWeight")} />
        <div className="section-item__info">
          <div className="section-item__label">Predicted Adult Weight</div>
          {animalData.genetics.data.predictedAdultWeight !== null && (
            <div className="section-item__value text-sm text-muted">{animalData.genetics.data.predictedAdultWeight} lbs</div>
          )}
        </div>
      </label>
    </div>
  );
}

function AchievementsSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedTitleIds = config.achievements?.titleIds || [];
  const selectedCompIds = config.achievements?.competitionIds || [];

  const toggleTitle = (id: number) => {
    setConfig((prev) => {
      const current = prev.achievements?.titleIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        achievements: { ...prev.achievements, enabled: true, titleIds: updated },
      };
    });
  };

  const toggleCompetition = (id: number) => {
    setConfig((prev) => {
      const current = prev.achievements?.competitionIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        achievements: { ...prev.achievements, enabled: true, competitionIds: updated },
      };
    });
  };

  return (
    <div className="section-items">
      {animalData.titles.eligibleTitles.length > 0 && (
        <>
          <h4 className="section-subsection">Titles</h4>
          {animalData.titles.eligibleTitles.map((title) => (
            <label key={title.id} className="section-item">
              <input type="checkbox" checked={selectedTitleIds.includes(title.id)} onChange={() => toggleTitle(title.id)} />
              <div className="section-item__info">
                <div className="section-item__label">{title.name} ({title.abbreviation})</div>
                <div className="section-item__value text-sm text-muted">
                  {title.organization} {title.verified && "✓"}
                </div>
              </div>
            </label>
          ))}
        </>
      )}

      {animalData.competitions.eligibleCompetitions.length > 0 && (
        <>
          <h4 className="section-subsection">Competitions</h4>
          {animalData.competitions.eligibleCompetitions.map((comp) => (
            <label key={comp.id} className="section-item">
              <input type="checkbox" checked={selectedCompIds.includes(comp.id)} onChange={() => toggleCompetition(comp.id)} />
              <div className="section-item__info">
                <div className="section-item__label">{comp.eventName}</div>
                <div className="section-item__value text-sm text-muted">
                  {comp.placementLabel || `#${comp.placement}`}
                </div>
              </div>
            </label>
          ))}
        </>
      )}

      {animalData.titles.eligibleTitles.length === 0 && animalData.competitions.eligibleCompetitions.length === 0 && (
        <div className="section-detail__disabled">
          <p>No achievements available yet.</p>
          <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
            This section will automatically appear on your listing once you add titles or competition results to this animal's profile.
          </p>
        </div>
      )}
    </div>
  );
}

function MediaSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedIds = config.media?.mediaIds || [];

  const toggleMedia = (id: number) => {
    setConfig((prev) => {
      const current = prev.media?.mediaIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        media: { enabled: true, mediaIds: updated },
      };
    });
  };

  if (animalData.media.items.length === 0) {
    return (
      <div className="section-detail__disabled">
        <p>No media available yet.</p>
        <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
          This section will automatically appear on your listing once you add photos or videos to this animal's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="section-items">
      {animalData.media.items.map((media) => (
        <label key={media.id} className="section-item">
          <input type="checkbox" checked={selectedIds.includes(media.id)} onChange={() => toggleMedia(media.id)} />
          <div className="section-item__info">
            <div className="section-item__label">{media.filename}</div>
            {media.caption && <div className="section-item__value text-sm text-muted">{media.caption}</div>}
          </div>
        </label>
      ))}
    </div>
  );
}

function DocumentsSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedIds = config.documents?.documentIds || [];

  const toggleDocument = (id: number) => {
    setConfig((prev) => {
      const current = prev.documents?.documentIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        documents: { enabled: true, documentIds: updated },
      };
    });
  };

  if (animalData.documents.items.length === 0) {
    return (
      <div className="section-detail__disabled">
        <p>No documents available yet.</p>
        <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
          This section will automatically appear on your listing once you add documents to this animal's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="section-items">
      {animalData.documents.items.map((doc) => (
        <label key={doc.id} className="section-item">
          <input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleDocument(doc.id)} />
          <div className="section-item__info">
            <div className="section-item__label">{doc.filename}</div>
            <div className="section-item__value text-sm text-muted">{doc.kind}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function RegistrySection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedIds = config.registry?.registryIds || [];

  const toggleRegistry = (id: number) => {
    setConfig((prev) => {
      const current = prev.registry?.registryIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        registry: { enabled: true, registryIds: updated },
      };
    });
  };

  if (animalData.registrations.length === 0) {
    return (
      <div className="section-detail__disabled">
        <p>No registry identifiers available yet.</p>
        <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
          This section will automatically appear on your listing once you add registry information to this animal's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="section-items">
      {animalData.registrations.map((reg) => (
        <label key={reg.id} className="section-item">
          <input type="checkbox" checked={selectedIds.includes(reg.id)} onChange={() => toggleRegistry(reg.id)} />
          <div className="section-item__info">
            <div className="section-item__label">{reg.registryName || "Registry"}</div>
            <div className="section-item__value text-sm text-muted">{reg.identifier}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function LineageSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const lineageConfig = config.lineage || {};

  const toggleField = (field: "showSire" | "showDam") => {
    setConfig((prev) => ({
      ...prev,
      lineage: {
        ...prev.lineage,
        enabled: true,
        [field]: !lineageConfig[field],
      },
    }));
  };

  return (
    <div className="section-items">
      {animalData.lineage.sire && (
        <label className="section-item">
          <input type="checkbox" checked={lineageConfig.showSire ?? false} onChange={() => toggleField("showSire")} />
          <div className="section-item__info">
            <div className="section-item__label">Sire: {animalData.lineage.sire.name}</div>
            <div className="section-item__value text-sm text-muted">{animalData.lineage.sire.titles}</div>
          </div>
        </label>
      )}
      {animalData.lineage.dam && (
        <label className="section-item">
          <input type="checkbox" checked={lineageConfig.showDam ?? false} onChange={() => toggleField("showDam")} />
          <div className="section-item__info">
            <div className="section-item__label">Dam: {animalData.lineage.dam.name}</div>
            <div className="section-item__value text-sm text-muted">{animalData.lineage.dam.titles}</div>
          </div>
        </label>
      )}
      {!animalData.lineage.sire && !animalData.lineage.dam && (
        <div className="section-detail__disabled">
          <p>No parent information available yet.</p>
          <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>
            This section will automatically appear on your listing once you add sire/dam information to this animal's profile.
          </p>
        </div>
      )}
    </div>
  );
}

function BreedingSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const breedingConfig = config.breeding || {};

  const toggleField = (field: "showOffspringCount") => {
    setConfig((prev) => ({
      ...prev,
      breeding: {
        ...prev.breeding,
        enabled: true,
        [field]: !breedingConfig[field],
      },
    }));
  };

  return (
    <div className="section-items">
      <label className="section-item">
        <input type="checkbox" checked={breedingConfig.showOffspringCount ?? false} onChange={() => toggleField("showOffspringCount")} />
        <div className="section-item__info">
          <div className="section-item__label">Offspring Count</div>
          <div className="section-item__value text-sm text-muted">{animalData.breeding.offspringCount} offspring</div>
        </div>
      </label>
    </div>
  );
}


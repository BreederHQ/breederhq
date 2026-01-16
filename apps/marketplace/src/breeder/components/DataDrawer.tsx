// apps/marketplace/src/breeder/components/DataDrawer.tsx

import * as React from "react";
import { Dialog } from "@bhq/ui";
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
}

type SectionKey =
  | "achievements"
  | "breeding"
  | "documents"
  | "genetics"
  | "health"
  | "identity"
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
  { key: "identity", label: "Identity", icon: "🪪", description: "Name, photo, birth date" },
  { key: "lineage", label: "Lineage", icon: "🌳", description: "Sire and dam information" },
  { key: "media", label: "Media", icon: "📸", description: "Photos and videos" },
  { key: "registry", label: "Registry", icon: "📋", description: "Registration numbers" },
];

export function DataDrawer({ open, onClose, animalData, initialConfig, onSave }: DataDrawerProps) {
  const [config, setConfig] = React.useState<DataDrawerConfig>(initialConfig || {});
  const [activeSection, setActiveSection] = React.useState<SectionKey | null>("health");

  // Reset config when animalData changes
  React.useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

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
      case "identity":
        return true; // Always available
      case "lineage":
        return true; // Always available if parents exist
      case "registry":
        return animalData.registrations.length > 0;
      default:
        return false;
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
      case "identity":
        return 3; // Name, photo, DOB
      case "lineage":
        return (animalData.lineage.sire ? 1 : 0) + (animalData.lineage.dam ? 1 : 0);
      case "registry":
        return animalData.registrations.length;
      default:
        return 0;
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const toggleSection = (key: SectionKey, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
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
      case "identity":
        setConfig((prev) => ({
          ...prev,
          identity: {
            enabled: true,
            showName: true,
            showPhoto: true,
            showDob: animalData.privacySettings.showFullDob,
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

  return (
    <Dialog open={open} onClose={onClose} title="Customize Listing Data" size="xl">
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

                  return (
                    <button
                      key={section.key}
                      type="button"
                      className={[
                        "data-drawer__section-item",
                        activeSection === section.key ? "active" : "",
                        !enabled ? "disabled" : "",
                      ].join(" ")}
                      onClick={() => enabled && setActiveSection(section.key)}
                      disabled={!enabled}
                    >
                      <div className="data-drawer__section-checkbox">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSection(section.key, e.target.checked);
                          }}
                          disabled={!enabled}
                        />
                      </div>
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
                            <span className="text-xs text-muted">🔒 Enable in Privacy tab</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="data-drawer__sections-footer">
                <p className="text-xs text-muted">
                  Some sections are disabled based on your Privacy settings.
                </p>
              </div>
            </div>

            {/* Right: Section Detail + Preview */}
            <div className="data-drawer__detail">
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
        <div className="data-drawer__footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
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
            {sectionKey === "identity" && <IdentitySection animalData={animalData} config={config} setConfig={setConfig} />}
          </>
        )}
      </div>
    </div>
  );
}

// Individual Section Components

function HealthSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const selectedIds = config.health?.traitIds || [];

  const toggleTrait = (id: number) => {
    setConfig((prev) => {
      const current = prev.health?.traitIds || [];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        ...prev,
        health: { enabled: true, traitIds: updated },
      };
    });
  };

  if (animalData.health.eligibleTraits.length === 0) {
    return <p className="text-muted">No health testing data available for marketplace display.</p>;
  }

  return (
    <div className="section-items">
      {animalData.health.eligibleTraits.map((trait) => (
        <label key={trait.id} className="section-item">
          <input type="checkbox" checked={selectedIds.includes(trait.id)} onChange={() => toggleTrait(trait.id)} />
          <div className="section-item__info">
            <div className="section-item__label">{trait.displayName}</div>
            <div className="section-item__value text-sm text-muted">
              {String(trait.value)} {trait.verified && "✓"}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

function GeneticsSection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  if (!animalData.genetics.data) {
    return <p className="text-muted">No genetics data available.</p>;
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
        <p className="text-muted">No achievements available for marketplace display.</p>
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
    return <p className="text-muted">No media available.</p>;
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
    return <p className="text-muted">No documents available.</p>;
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
    return <p className="text-muted">No registry identifiers available.</p>;
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
        <p className="text-muted">No parent information available.</p>
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

function IdentitySection({ animalData, config, setConfig }: Omit<SectionDetailProps, "sectionKey" | "onSelectAll" | "onDeselectAll">) {
  const identityConfig = config.identity || {};

  const toggleField = (field: keyof NonNullable<DataDrawerConfig["identity"]>) => {
    setConfig((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        enabled: true,
        [field]: !identityConfig[field],
      },
    }));
  };

  return (
    <div className="section-items">
      <label className="section-item">
        <input type="checkbox" checked={identityConfig.showName ?? true} onChange={() => toggleField("showName")} />
        <div className="section-item__info">
          <div className="section-item__label">Name</div>
          <div className="section-item__value text-sm text-muted">{animalData.animal.name}</div>
        </div>
      </label>
      <label className="section-item">
        <input type="checkbox" checked={identityConfig.showPhoto ?? true} onChange={() => toggleField("showPhoto")} />
        <div className="section-item__info">
          <div className="section-item__label">Photo</div>
        </div>
      </label>
      {animalData.privacySettings.showFullDob && (
        <label className="section-item">
          <input type="checkbox" checked={identityConfig.showDob ?? false} onChange={() => toggleField("showDob")} />
          <div className="section-item__info">
            <div className="section-item__label">Birth Date</div>
            <div className="section-item__value text-sm text-muted">{animalData.animal.birthDate}</div>
          </div>
        </label>
      )}
    </div>
  );
}

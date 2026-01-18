// apps/marketplace/src/breeder/components/InlineRulesWidget.tsx
// Compact inline widget for managing rules at any level (program, plan, group, offspring)

import { useState, useEffect } from "react";
import { Button } from "@bhq/ui";
import { Settings, Plus, Eye, EyeOff, X, ChevronDown, ChevronUp, Ban } from "lucide-react";
import {
  getEffectiveRules,
  createOrUpdateBreedingProgramRule,
  toggleBreedingProgramRule,
  deleteBreedingProgramRule,
  disableRuleInheritance,
  type BreedingProgramRule,
  type BreedingRuleLevel,
  type BreedingRuleCategory,
  type CreateRuleParams,
} from "../../api/client";

// Helper to get tenant ID from window global
// Note: We intentionally skip localStorage to avoid cross-user contamination
function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || "";
  } catch {
    return "";
  }
}

interface InlineRulesWidgetProps {
  level: BreedingRuleLevel;
  levelId: string;
  compact?: boolean; // If true, show minimal UI
}

const RULE_TEMPLATES = [
  {
    ruleType: "auto_list_available",
    name: "Auto-list Available",
    category: "LISTING" as BreedingRuleCategory,
    description: "Auto-list offspring when Keeper Intent = AVAILABLE",
    defaultConfig: { minAgeWeeks: 8, requirePhotos: true, minPhotoCount: 1 },
  },
  {
    ruleType: "auto_unlist_on_status_change",
    name: "Auto-unlist on Change",
    category: "LISTING" as BreedingRuleCategory,
    description: "Auto-unlist when status changes from AVAILABLE",
    defaultConfig: {},
  },
  {
    ruleType: "default_price_by_sex",
    name: "Price by Sex",
    category: "PRICING" as BreedingRuleCategory,
    description: "Set different prices for males/females",
    defaultConfig: { malePriceCents: 250000, femalePriceCents: 280000, applyToExisting: false },
  },
  {
    ruleType: "hide_photos_until_age",
    name: "Hide Photos Until Age",
    category: "VISIBILITY" as BreedingRuleCategory,
    description: "Hide photos until offspring reach age",
    defaultConfig: { minAgeWeeks: 6, showBlurred: true, showCount: true },
  },
  {
    ruleType: "accept_inquiries",
    name: "Accept Inquiries",
    category: "BUYER_INTERACTION" as BreedingRuleCategory,
    description: "Enable/disable inquiry form",
    defaultConfig: { enabled: true, autoRespond: false },
  },
  {
    ruleType: "notify_waitlist_on_photos",
    name: "Email Waitlist on Photos",
    category: "BUYER_INTERACTION" as BreedingRuleCategory,
    description: "Email waitlist when photos added",
    defaultConfig: { enabled: true, minPhotos: 1 },
  },
];

const CATEGORY_COLORS: Record<BreedingRuleCategory, string> = {
  LISTING: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PRICING: "text-green-400 bg-green-500/10 border-green-500/20",
  VISIBILITY: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  BUYER_INTERACTION: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  STATUS: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  NOTIFICATIONS: "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

// Helper to get human-readable level names
const LEVEL_LABELS: Record<BreedingRuleLevel, string> = {
  TENANT: "Account-wide",
  PROGRAM: "Breeding Program",
  PLAN: "Breeding Plan",
  GROUP: "Offspring Group",
  OFFSPRING: "Individual Offspring",
};

export default function InlineRulesWidget({ level, levelId, compact = false }: InlineRulesWidgetProps) {
  const tenantId = getTenantId();
  const [rules, setRules] = useState<BreedingProgramRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    loadRules();
  }, [level, levelId, tenantId]);

  async function loadRules() {
    if (!tenantId) return;

    try {
      setLoading(true);
      const response = await getEffectiveRules(tenantId, level, levelId);
      setRules(response.rules);
    } catch (err) {
      console.error("Failed to load rules:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRule(rule: BreedingProgramRule) {
    if (!tenantId) return;

    try {
      const response = await toggleBreedingProgramRule(tenantId, rule.id);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? response.rule : r)));
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  }

  async function handleDeleteRule(rule: BreedingProgramRule) {
    if (!tenantId) return;
    if (!confirm(`Delete "${rule.name}"?`)) return;

    try {
      await deleteBreedingProgramRule(tenantId, rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  }

  async function handleAddRule(template: typeof RULE_TEMPLATES[0]) {
    if (!tenantId) return;

    const params: CreateRuleParams = {
      category: template.category,
      ruleType: template.ruleType,
      name: template.name,
      description: template.description,
      enabled: true,
      config: template.defaultConfig,
      level,
      levelId,
    };

    try {
      const response = await createOrUpdateBreedingProgramRule(tenantId, params);
      setRules((prev) => [...prev, response.rule]);
      setShowAddMenu(false);
    } catch (err) {
      console.error("Failed to add rule:", err);
      alert(`Failed to add rule: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleDisableInheritance(fromLevel: BreedingRuleLevel) {
    if (!tenantId) return;
    if (!confirm(`This will disable all rules inherited from ${LEVEL_LABELS[fromLevel]}. Continue?`)) return;

    try {
      const response = await disableRuleInheritance(tenantId, level, levelId, fromLevel);
      if (response.overridesCreated > 0) {
        // Reload rules to get the updated state
        await loadRules();
      }
    } catch (err) {
      console.error("Failed to disable inheritance:", err);
      alert(`Failed to disable inheritance: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  const enabledCount = rules.filter((r) => r.enabled).length;
  const existingTypes = new Set(rules.map((r) => r.ruleType));
  const availableTemplates = RULE_TEMPLATES.filter((t) => !existingTypes.has(t.ruleType));

  return (
    <div className="space-y-3">
      {/* Add Rule Button */}
      {availableTemplates.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-muted">
            {rules.length > 0 && `${enabledCount} of ${rules.length} rules active`}
          </div>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      )}

      {/* Add Rule Menu */}
      {showAddMenu && availableTemplates.length > 0 && (
        <div className="p-3 border border-border-subtle bg-black/10 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-text-muted mb-2">Select a rule to add:</div>
          {availableTemplates.map((template) => (
            <button
              key={template.ruleType}
              onClick={() => handleAddRule(template)}
              className="w-full text-left p-2 hover:bg-white/5 border border-border-subtle rounded transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{template.description}</div>
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[template.category]}`}
                >
                  {template.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Rules List - Grouped by Level */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-center text-sm text-text-muted border border-border-subtle rounded-lg bg-portal-card">
            Loading rules...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted border border-border-subtle rounded-lg bg-portal-card">
            No rules configured yet. Click "Add Rule" above to get started.
          </div>
        ) : (
          <GroupedRulesList
            rules={rules}
            currentLevel={level}
            currentLevelId={levelId}
            tenantId={tenantId}
            onToggle={handleToggleRule}
            onDelete={handleDeleteRule}
            onDisableInheritance={handleDisableInheritance}
          />
        )}
      </div>
    </div>
  );
}

// Component to group and display rules by level
function GroupedRulesList({
  rules,
  currentLevel,
  currentLevelId,
  tenantId,
  onToggle,
  onDelete,
  onDisableInheritance,
}: {
  rules: BreedingProgramRule[];
  currentLevel: BreedingRuleLevel;
  currentLevelId: string;
  tenantId: string;
  onToggle: (rule: BreedingProgramRule) => void;
  onDelete: (rule: BreedingProgramRule) => void;
  onDisableInheritance: (fromLevel: BreedingRuleLevel) => void;
}) {
  const levelHierarchy: BreedingRuleLevel[] = ["TENANT", "PROGRAM", "PLAN", "GROUP", "OFFSPRING"];
  const currentLevelIndex = levelHierarchy.indexOf(currentLevel);

  // Group rules by their level
  const rulesByLevel = rules.reduce((acc, rule) => {
    if (!acc[rule.level]) {
      acc[rule.level] = [];
    }
    acc[rule.level].push(rule);
    return acc;
  }, {} as Record<BreedingRuleLevel, BreedingProgramRule[]>);

  // Get levels that have rules, in hierarchy order
  const levelsWithRules = levelHierarchy.filter((lvl) => rulesByLevel[lvl]?.length > 0);

  // Separate into inherited and local
  const inheritedLevels = levelsWithRules.filter(
    (lvl) => levelHierarchy.indexOf(lvl) < currentLevelIndex
  );
  const localLevel = levelsWithRules.find((lvl) => lvl === currentLevel);

  return (
    <div className="space-y-4">
      {/* Inherited rules - grouped by source level (top-down: Program → Plan → Group) */}
      {inheritedLevels.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              Inherited Rules
            </div>
            <div className="flex-1 h-px bg-amber-500/20" />
          </div>
          <div className="space-y-3">
            {inheritedLevels.map((inheritedLevel) => (
              <div key={inheritedLevel}>
                <div className="flex items-center gap-2 mb-1 pl-1">
                  <button
                    onClick={() => onDisableInheritance(inheritedLevel)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    title={`Disable all rules inherited from ${LEVEL_LABELS[inheritedLevel]}`}
                  >
                    <Ban className="w-3 h-3" />
                    <span>Disable Inheritance</span>
                  </button>
                  <div className="text-xs text-text-muted">
                    From {LEVEL_LABELS[inheritedLevel]}:
                  </div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-portal-card overflow-hidden divide-y divide-border-subtle opacity-75">
                  {rulesByLevel[inheritedLevel].map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      onToggle={() => onToggle(rule)}
                      onDelete={() => onDelete(rule)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local rules (defined at this level) - show last */}
      {localLevel && rulesByLevel[localLevel] && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold text-green-400 uppercase tracking-wide">
              Rules assigned to this {LEVEL_LABELS[currentLevel]}
            </div>
            <div className="flex-1 h-px bg-green-500/20" />
          </div>
          <div className="border border-green-500/30 rounded-lg bg-portal-card overflow-hidden divide-y divide-border-subtle">
            {rulesByLevel[localLevel].map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onToggle={() => onToggle(rule)}
                onDelete={() => onDelete(rule)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
}: {
  rule: BreedingProgramRule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const categoryColor = CATEGORY_COLORS[rule.category];

  return (
    <div className="p-3">
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`mt-0.5 p-1 rounded transition-colors ${
            rule.enabled
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          }`}
          title={rule.enabled ? "Enabled (click to disable)" : "Disabled (click to enable)"}
        >
          {rule.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {/* Rule info - takes remaining space */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{rule.name}</span>
              </div>
              {rule.description && (
                <div className="text-xs text-text-muted mt-1">{rule.description}</div>
              )}
            </div>

            {/* Category Badge */}
            <div className="flex-shrink-0">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor} whitespace-nowrap`}>
                {rule.category}
              </span>
            </div>

            {/* Actions - fixed width */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {Object.keys(rule.config).length > 0 ? (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                  title={showConfig ? "Hide settings" : "Show settings"}
                >
                  {showConfig ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <div className="w-[22px]" />
              )}
              <button
                onClick={onDelete}
                className="p-1 hover:bg-red-500/20 rounded transition-colors text-text-muted hover:text-red-400"
                title="Delete rule"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Config (expanded) */}
          {showConfig && Object.keys(rule.config).length > 0 && (
            <div className="mt-3 space-y-3">
              <RuleConfigForm rule={rule} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Rule-specific configuration forms
function RuleConfigForm({ rule }: { rule: BreedingProgramRule }) {
  const config = rule.config as any;

  // Auto-list Available rule
  if (rule.ruleType === "auto_list_available") {
    const hasMinAge = config.minAgeWeeks !== undefined && config.minAgeWeeks !== null;

    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle space-y-3">
        <div className="text-xs font-semibold text-white mb-2">Settings</div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasMinAge}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Wait until minimum age before listing</span>
          </label>

          {hasMinAge && (
            <div className="ml-6 flex items-center gap-2">
              <input
                type="number"
                value={config.minAgeWeeks || 8}
                readOnly
                className="w-20 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
              />
              <span className="text-xs text-text-muted">weeks old</span>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.requirePhotos || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Require photos before listing</span>
          </label>

          {config.requirePhotos && (
            <div className="ml-6 flex items-center gap-2">
              <input
                type="number"
                value={config.minPhotoCount || 1}
                readOnly
                className="w-20 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
              />
              <span className="text-xs text-text-muted">photo(s) minimum</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Price by Sex rule
  if (rule.ruleType === "default_price_by_sex") {
    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle space-y-3">
        <div className="text-xs font-semibold text-white mb-2">Pricing</div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-text-secondary">Male Price</span>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-text-muted">$</span>
              <input
                type="text"
                value={((config.malePriceCents || 0) / 100).toLocaleString()}
                readOnly
                className="flex-1 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-text-secondary">Female Price</span>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-text-muted">$</span>
              <input
                type="text"
                value={((config.femalePriceCents || 0) / 100).toLocaleString()}
                readOnly
                className="flex-1 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
              />
            </div>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.applyToExisting || false}
            readOnly
            className="w-4 h-4 rounded border-border-subtle"
          />
          <span className="text-xs text-white">Apply to existing listings</span>
        </label>
      </div>
    );
  }

  // Hide Photos Until Age rule
  if (rule.ruleType === "hide_photos_until_age") {
    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle space-y-3">
        <div className="text-xs font-semibold text-white mb-2">Photo Visibility</div>

        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-text-secondary">Hide photos until age</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                value={config.minAgeWeeks || 6}
                readOnly
                className="w-20 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
              />
              <span className="text-xs text-text-muted">weeks old</span>
            </div>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showBlurred || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Show blurred placeholders</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showCount || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Show photo count</span>
          </label>
        </div>
      </div>
    );
  }

  // Accept Inquiries rule
  if (rule.ruleType === "accept_inquiries") {
    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle space-y-3">
        <div className="text-xs font-semibold text-white mb-2">Inquiry Settings</div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Accept inquiries from buyers</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoRespond || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Send automatic response</span>
          </label>
        </div>
      </div>
    );
  }

  // Notify Waitlist rule
  if (rule.ruleType === "notify_waitlist_on_photos") {
    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle space-y-3">
        <div className="text-xs font-semibold text-white mb-2">Waitlist Notifications</div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled || false}
              readOnly
              className="w-4 h-4 rounded border-border-subtle"
            />
            <span className="text-xs text-white">Notify waitlist when photos are added</span>
          </label>

          <label className="block">
            <span className="text-xs text-text-secondary">Minimum photos before notifying</span>
            <input
              type="number"
              value={config.minPhotos || 1}
              readOnly
              className="mt-1 w-20 px-2 py-1 text-sm bg-black/30 border border-border-subtle rounded text-white"
            />
          </label>
        </div>
      </div>
    );
  }

  // Auto-unlist (simple, no config)
  if (rule.ruleType === "auto_unlist_on_status_change") {
    return (
      <div className="p-3 bg-black/20 rounded border border-border-subtle">
        <div className="text-xs text-text-muted">
          This rule automatically removes listings when offspring status changes from AVAILABLE to any other status.
        </div>
      </div>
    );
  }

  // Fallback for unknown rule types
  return (
    <div className="p-3 bg-black/20 rounded border border-border-subtle">
      <div className="text-xs font-semibold text-text-muted mb-2">Configuration:</div>
      <div className="space-y-1">
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="text-xs">
            <span className="text-text-secondary">{key}:</span>{" "}
            <span className="text-white">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// apps/marketplace/src/breeder/components/InlineRulesWidget.tsx
// Compact inline widget for managing rules at any level (program, plan, group, offspring)

import { useState, useEffect } from "react";
import { Button } from "@bhq/ui";
import { Settings, Plus, Eye, EyeOff, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  getEffectiveRules,
  createOrUpdateBreedingProgramRule,
  toggleBreedingProgramRule,
  deleteBreedingProgramRule,
  type BreedingProgramRule,
  type BreedingRuleLevel,
  type BreedingRuleCategory,
  type CreateRuleParams,
} from "../../api/client";

// Helper to get tenant ID from window/localStorage
function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
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
    name: "Notify on Photos",
    category: "NOTIFICATIONS" as BreedingRuleCategory,
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

export default function InlineRulesWidget({ level, levelId, compact = false }: InlineRulesWidgetProps) {
  const tenantId = getTenantId();
  const [rules, setRules] = useState<BreedingProgramRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadRules();
    }
  }, [expanded, level, levelId, tenantId]);

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

  const enabledCount = rules.filter((r) => r.enabled).length;
  const existingTypes = new Set(rules.map((r) => r.ruleType));
  const availableTemplates = RULE_TEMPLATES.filter((t) => !existingTypes.has(t.ruleType));

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-accent/20 hover:bg-accent/30 border border-accent/40 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="font-medium">
          Automation Rules {rules.length > 0 && `(${enabledCount} active)`}
        </span>
      </button>
    );
  }

  return (
    <div className="border border-border-subtle rounded-lg bg-portal-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-black/20">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold">Automation Rules</span>
          {rules.length > 0 && (
            <span className="text-xs text-text-muted">
              ({enabledCount} active)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {availableTemplates.length > 0 && (
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Add rule"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Collapse"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Rule Menu */}
      {showAddMenu && availableTemplates.length > 0 && (
        <div className="p-3 border-b border-border-subtle bg-black/10 space-y-2">
          <div className="text-xs font-semibold text-text-muted mb-2">Add Rule:</div>
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

      {/* Rules List */}
      <div className="divide-y divide-border-subtle">
        {loading ? (
          <div className="p-4 text-center text-sm text-text-muted">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted">
            No rules configured. Click <Plus className="w-3 h-3 inline" /> to add one.
          </div>
        ) : (
          rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onToggle={() => handleToggleRule(rule)}
              onDelete={() => handleDeleteRule(rule)}
            />
          ))
        )}
      </div>
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

  const isInherited = rule.level !== rule.level; // Would need actual check
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{rule.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor}`}>
                  {rule.category}
                </span>
                {isInherited && (
                  <span className="text-xs text-text-muted">(inherited)</span>
                )}
              </div>
              {rule.description && (
                <div className="text-xs text-text-muted mt-1">{rule.description}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {Object.keys(rule.config).length > 0 && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                  title="View config"
                >
                  {showConfig ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
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
            <div className="mt-2 p-2 bg-black/20 rounded border border-border-subtle">
              <div className="text-xs font-semibold text-text-muted mb-1">Configuration:</div>
              <pre className="text-xs text-text-muted overflow-x-auto">
                {JSON.stringify(rule.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

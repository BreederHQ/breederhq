// apps/marketplace/src/breeder/pages/BreedingProgramRulesPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@bhq/ui";
import { ArrowLeft, Plus, Settings, Play, History, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getBreedingProgramRules,
  createOrUpdateBreedingProgramRule,
  toggleBreedingProgramRule,
  deleteBreedingProgramRule,
  executeBreedingProgramRules,
  type BreedingProgramRule,
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

interface RuleTemplate {
  ruleType: string;
  name: string;
  description: string;
  category: BreedingRuleCategory;
  defaultConfig: Record<string, any>;
  configSchema: ConfigField[];
}

interface ConfigField {
  key: string;
  label: string;
  type: "number" | "boolean" | "text" | "select";
  options?: { label: string; value: any }[];
  defaultValue: any;
  help?: string;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    ruleType: "auto_list_available",
    name: "Auto-list Available Offspring",
    description: "Automatically list offspring on marketplace when Keeper Intent is AVAILABLE",
    category: "LISTING",
    defaultConfig: {
      minAgeWeeks: 8,
      requirePhotos: true,
      minPhotoCount: 1,
    },
    configSchema: [
      {
        key: "minAgeWeeks",
        label: "Minimum Age (weeks)",
        type: "number",
        defaultValue: 8,
        help: "Only list offspring when they reach this age",
      },
      {
        key: "requirePhotos",
        label: "Require Photos",
        type: "boolean",
        defaultValue: true,
        help: "Only list if offspring has photos",
      },
      {
        key: "minPhotoCount",
        label: "Minimum Photo Count",
        type: "number",
        defaultValue: 1,
        help: "Minimum number of photos required",
      },
    ],
  },
  {
    ruleType: "auto_unlist_on_status_change",
    name: "Auto-unlist on Status Change",
    description: "Automatically unlist offspring when keeper intent changes from AVAILABLE",
    category: "LISTING",
    defaultConfig: {},
    configSchema: [],
  },
  {
    ruleType: "default_price_by_sex",
    name: "Default Pricing by Sex",
    description: "Set different default prices for males and females",
    category: "PRICING",
    defaultConfig: {
      malePriceCents: 250000,
      femalePriceCents: 280000,
      applyToExisting: false,
    },
    configSchema: [
      {
        key: "malePriceCents",
        label: "Male Price (cents)",
        type: "number",
        defaultValue: 250000,
        help: "Default price for male offspring (in cents, e.g., 250000 = $2,500)",
      },
      {
        key: "femalePriceCents",
        label: "Female Price (cents)",
        type: "number",
        defaultValue: 280000,
        help: "Default price for female offspring",
      },
      {
        key: "applyToExisting",
        label: "Apply to Existing",
        type: "boolean",
        defaultValue: false,
        help: "Apply pricing to existing offspring",
      },
    ],
  },
  {
    ruleType: "hide_photos_until_age",
    name: "Hide Photos Until Age",
    description: "Don't show photos until offspring reach a certain age",
    category: "VISIBILITY",
    defaultConfig: {
      minAgeWeeks: 6,
      showBlurred: true,
      showCount: true,
    },
    configSchema: [
      {
        key: "minAgeWeeks",
        label: "Minimum Age (weeks)",
        type: "number",
        defaultValue: 6,
        help: "Hide photos until this age",
      },
      {
        key: "showBlurred",
        label: "Show Blurred Preview",
        type: "boolean",
        defaultValue: true,
        help: "Show blurred preview images",
      },
      {
        key: "showCount",
        label: "Show Photo Count",
        type: "boolean",
        defaultValue: true,
        help: "Display how many photos are available",
      },
    ],
  },
  {
    ruleType: "accept_inquiries",
    name: "Accept Inquiries",
    description: "Enable or disable the inquiry form",
    category: "BUYER_INTERACTION",
    defaultConfig: {
      enabled: true,
      autoRespond: false,
      responseTemplate: "",
    },
    configSchema: [
      {
        key: "enabled",
        label: "Enable Inquiries",
        type: "boolean",
        defaultValue: true,
        help: "Allow buyers to submit inquiries",
      },
      {
        key: "autoRespond",
        label: "Auto-respond",
        type: "boolean",
        defaultValue: false,
        help: "Send automatic response to inquiries",
      },
      {
        key: "responseTemplate",
        label: "Response Template",
        type: "text",
        defaultValue: "",
        help: "Automatic response message",
      },
    ],
  },
  {
    ruleType: "notify_waitlist_on_photos",
    name: "Notify Waitlist on Photos",
    description: "Send email to waitlist members when new photos are added",
    category: "NOTIFICATIONS",
    defaultConfig: {
      enabled: true,
      minPhotos: 1,
    },
    configSchema: [
      {
        key: "enabled",
        label: "Enable Notifications",
        type: "boolean",
        defaultValue: true,
        help: "Send notifications when photos are added",
      },
      {
        key: "minPhotos",
        label: "Minimum Photos",
        type: "number",
        defaultValue: 1,
        help: "Only notify after this many photos are added",
      },
    ],
  },
];

const CATEGORY_LABELS: Record<BreedingRuleCategory, string> = {
  LISTING: "Listing",
  PRICING: "Pricing",
  VISIBILITY: "Visibility",
  BUYER_INTERACTION: "Buyer Interaction",
  STATUS: "Status",
  NOTIFICATIONS: "Notifications",
};

const CATEGORY_COLORS: Record<BreedingRuleCategory, string> = {
  LISTING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PRICING: "bg-green-500/10 text-green-400 border-green-500/20",
  VISIBILITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  BUYER_INTERACTION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  STATUS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  NOTIFICATIONS: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function BreedingProgramRulesPage() {
  const { programSlug } = useParams<{ programSlug: string }>();
  const navigate = useNavigate();
  const tenantId = getTenantId();

  const [rules, setRules] = useState<BreedingProgramRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<BreedingProgramRule | null>(null);

  useEffect(() => {
    loadRules();
  }, [programSlug, tenantId]);

  async function loadRules() {
    if (!programSlug || !tenantId) return;

    try {
      setLoading(true);
      const response = await getBreedingProgramRules(tenantId, {
        level: "PROGRAM",
        levelId: programSlug,
      });
      setRules(response.rules);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRule(rule: BreedingProgramRule) {
    if (!tenantId) return;

    try {
      const response = await toggleBreedingProgramRule(tenantId, rule.id);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? response.rule : r))
      );
    } catch (err) {
      alert(`Failed to toggle rule: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleDeleteRule(rule: BreedingProgramRule) {
    if (!tenantId) return;
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return;

    try {
      await deleteBreedingProgramRule(tenantId, rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (err) {
      alert(`Failed to delete rule: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleExecuteRule(rule: BreedingProgramRule) {
    if (!tenantId || !programSlug) return;

    try {
      const result = await executeBreedingProgramRules(tenantId, "PROGRAM", programSlug);
      alert(
        `Rule executed!\n\nSuccess: ${result.success}\nResults: ${result.results.length} operations`
      );
    } catch (err) {
      alert(`Failed to execute rule: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleCreateRule(template: RuleTemplate, config: Record<string, any>) {
    if (!tenantId || !programSlug) return;

    const params: CreateRuleParams = {
      category: template.category,
      ruleType: template.ruleType,
      name: template.name,
      description: template.description,
      enabled: true,
      config,
      level: "PROGRAM",
      levelId: programSlug,
    };

    try {
      const response = await createOrUpdateBreedingProgramRule(tenantId, params);
      setRules((prev) => [...prev, response.rule]);
      setShowAddModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      alert(`Failed to create rule: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<BreedingRuleCategory, BreedingProgramRule[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-bg text-white p-8">
        <div className="max-w-5xl mx-auto">
          <p>Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-portal-bg text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-text-muted hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Breeding Program Rules</h1>
            <p className="text-text-muted">
              Automation rules for <span className="text-white">{programSlug}</span>
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-8">
          <p className="text-amber-400 text-sm">
            Rules set at the program level automatically apply to all breeding plans, offspring
            groups, and individual offspring. You can override rules at more specific levels.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Rules by Category */}
        {rules.length === 0 ? (
          <div className="bg-portal-card border border-border-subtle rounded-lg p-8 text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <h3 className="text-lg font-semibold mb-2">No rules configured</h3>
            <p className="text-text-muted mb-4">
              Add your first automation rule to streamline your breeding program management.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(groupedRules) as BreedingRuleCategory[]).map((category) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs border ${CATEGORY_COLORS[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-text-muted text-sm">
                    ({groupedRules[category].length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {groupedRules[category].map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onToggle={() => handleToggleRule(rule)}
                      onDelete={() => handleDeleteRule(rule)}
                      onExecute={() => handleExecuteRule(rule)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Rule Modal */}
        {showAddModal && (
          <AddRuleModal
            templates={RULE_TEMPLATES}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onClose={() => {
              setShowAddModal(false);
              setSelectedTemplate(null);
            }}
            onCreate={handleCreateRule}
          />
        )}
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onExecute,
}: {
  rule: BreedingProgramRule;
  onToggle: () => void;
  onDelete: () => void;
  onExecute: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`mt-1 p-1 rounded transition-colors ${
            rule.enabled
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          }`}
        >
          {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold">{rule.name}</h3>
              {rule.description && (
                <p className="text-sm text-text-muted mt-1">{rule.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${CATEGORY_COLORS[rule.category]}`}>
                {rule.category}
              </span>
              <button
                onClick={onExecute}
                className="p-1.5 rounded hover:bg-white/5 transition-colors text-text-muted hover:text-white"
                title="Execute rule now"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded hover:bg-white/5 transition-colors text-text-muted hover:text-white"
                title="View config"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-text-muted hover:text-red-400"
                title="Delete rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded ${
                rule.enabled
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
              }`}
            >
              {rule.enabled ? "Enabled" : "Disabled"}
            </span>
            <span className="text-text-muted">
              Updated {new Date(rule.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Expanded Config */}
          {expanded && Object.keys(rule.config).length > 0 && (
            <div className="mt-4 p-3 bg-black/20 rounded border border-border-subtle">
              <h4 className="text-xs font-semibold text-text-muted mb-2">Configuration</h4>
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

function AddRuleModal({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onClose,
  onCreate,
}: {
  templates: RuleTemplate[];
  selectedTemplate: RuleTemplate | null;
  onSelectTemplate: (template: RuleTemplate | null) => void;
  onCreate: (template: RuleTemplate, config: Record<string, any>) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedTemplate) {
      setConfig(selectedTemplate.defaultConfig);
    }
  }, [selectedTemplate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;
    onCreate(selectedTemplate, config);
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<BreedingRuleCategory, RuleTemplate[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-portal-card border border-border-subtle rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Add Automation Rule</h2>

          {!selectedTemplate ? (
            <div className="space-y-4">
              {(Object.keys(groupedTemplates) as BreedingRuleCategory[]).map((category) => (
                <div key={category}>
                  <h3
                    className={`text-sm font-semibold mb-2 px-2 py-1 rounded inline-block border ${CATEGORY_COLORS[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-2 mt-2">
                    {groupedTemplates[category].map((template) => (
                      <button
                        key={template.ruleType}
                        onClick={() => onSelectTemplate(template)}
                        className="w-full text-left p-4 bg-portal-bg hover:bg-white/5 border border-border-subtle rounded-lg transition-colors"
                      >
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-text-muted mt-1">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-portal-bg border border-border-subtle rounded-lg">
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-text-muted mt-1">{selectedTemplate.description}</p>
              </div>

              {selectedTemplate.configSchema.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Configuration</h4>
                  {selectedTemplate.configSchema.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      {field.type === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={config[field.key] ?? field.defaultValue}
                          onChange={(e) =>
                            setConfig({ ...config, [field.key]: e.target.checked })
                          }
                          className="rounded"
                        />
                      ) : field.type === "number" ? (
                        <input
                          type="number"
                          value={config[field.key] ?? field.defaultValue}
                          onChange={(e) =>
                            setConfig({ ...config, [field.key]: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-portal-bg border border-border-subtle rounded-lg"
                        />
                      ) : (
                        <input
                          type="text"
                          value={config[field.key] ?? field.defaultValue}
                          onChange={(e) =>
                            setConfig({ ...config, [field.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-portal-bg border border-border-subtle rounded-lg"
                        />
                      )}
                      {field.help && (
                        <p className="text-xs text-text-muted mt-1">{field.help}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectTemplate(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Create Rule
                </Button>
              </div>
            </form>
          )}

          {!selectedTemplate && (
            <div className="flex justify-end pt-4 mt-4 border-t border-border-subtle">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

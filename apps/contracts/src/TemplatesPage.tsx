// apps/contracts/src/TemplatesPage.tsx
// Contract templates management page

import * as React from "react";
import { FileText, Plus, Eye, Edit2, Trash2, Lock, Star, Check } from "lucide-react";
import type { ContractsApi, ContractTemplate } from "./api";

interface Props {
  api: ContractsApi;
}

export default function TemplatesPage({ api }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [templates, setTemplates] = React.useState<ContractTemplate[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = React.useState<ContractTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = React.useState<string>("");
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  // Fetch templates
  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.contracts.templates.list();
      setTemplates(res.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Preview template
  const handlePreview = async (template: ContractTemplate) => {
    setPreviewTemplate(template);
    setLoadingPreview(true);
    try {
      const res = await api.contracts.templates.preview(template.id);
      setPreviewHtml(res.html);
    } catch (err: any) {
      setPreviewHtml(`<p style="color: red;">Failed to load preview: ${err.message}</p>`);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Group templates
  const systemTemplates = templates.filter((t) => t.type === "SYSTEM");
  const customTemplates = templates.filter((t) => t.type === "CUSTOM");

  const categoryLabels: Record<string, string> = {
    SALES_AGREEMENT: "Sales Agreement",
    DEPOSIT_AGREEMENT: "Deposit Agreement",
    CO_OWNERSHIP: "Co-Ownership",
    GUARDIAN_HOME: "Guardian Home",
    STUD_SERVICE: "Stud Service",
    HEALTH_GUARANTEE: "Health Guarantee",
    CUSTOM: "Custom",
  };

  const categoryIcons: Record<string, string> = {
    SALES_AGREEMENT: "📄",
    DEPOSIT_AGREEMENT: "💰",
    CO_OWNERSHIP: "🤝",
    GUARDIAN_HOME: "🏠",
    STUD_SERVICE: "🐕",
    HEALTH_GUARANTEE: "💚",
    CUSTOM: "✏️",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary">
            System templates are available on all plans. Custom templates require Pro tier.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          title="Custom templates require Pro tier"
        >
          <Lock className="w-4 h-4" />
          Create Custom Template
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
        </div>
      ) : (
        <>
          {/* System Templates */}
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              System Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  categoryLabel={categoryLabels[template.category] || template.category}
                  categoryIcon={categoryIcons[template.category] || "📄"}
                  onPreview={() => handlePreview(template)}
                />
              ))}
            </div>
          </div>

          {/* Custom Templates */}
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[var(--brand-orange)]" />
              Custom Templates
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 ml-2">
                Pro Tier
              </span>
            </h2>
            {customTemplates.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(60, 60, 60, 0.5)",
                }}
              >
                <Lock className="w-12 h-12 mx-auto mb-3 text-secondary opacity-40" />
                <p className="text-lg font-medium text-primary">No custom templates</p>
                <p className="text-sm text-secondary mt-1">
                  Upgrade to Pro to create your own contract templates
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    categoryLabel={categoryLabels[template.category] || template.category}
                    categoryIcon={categoryIcons[template.category] || "📄"}
                    onPreview={() => handlePreview(template)}
                    isCustom
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          html={previewHtml}
          loading={loadingPreview}
          onClose={() => {
            setPreviewTemplate(null);
            setPreviewHtml("");
          }}
        />
      )}
    </div>
  );
}

/* ───────── Template Card ───────── */

function TemplateCard({
  template,
  categoryLabel,
  categoryIcon,
  onPreview,
  isCustom,
}: {
  template: ContractTemplate;
  categoryLabel: string;
  categoryIcon: string;
  onPreview: () => void;
  isCustom?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 transition-all hover:border-[var(--brand-orange)]/50"
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(60, 60, 60, 0.5)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{categoryIcon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary truncate">{template.name}</h3>
          <p className="text-sm text-secondary mt-1 line-clamp-2">
            {template.description || "No description"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
            {categoryLabel}
          </span>
          <span className="text-xs text-secondary">v{template.version}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPreview}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-secondary hover:text-primary"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isCustom && (
            <>
              <button
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-secondary hover:text-primary"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-secondary hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Merge fields count */}
      {template.mergeFields && template.mergeFields.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(60, 60, 60, 0.5)" }}>
          <p className="text-xs text-secondary flex items-center gap-1">
            <Check className="w-3 h-3" />
            {template.mergeFields.length} merge fields
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────── Preview Modal ───────── */

function TemplatePreviewModal({
  template,
  html,
  loading,
  onClose,
}: {
  template: ContractTemplate;
  html: string;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(60, 60, 60, 0.5)",
        }}
      >
        <div className="p-6 flex justify-between items-start shrink-0" style={{ borderBottom: "1px solid rgba(60, 60, 60, 0.5)" }}>
          <div>
            <h2 className="text-xl font-semibold text-primary">{template.name}</h2>
            <p className="text-sm text-secondary mt-1">Preview with sample data</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none bg-white p-8 rounded-lg border shadow-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        <div className="p-6 shrink-0 flex justify-end" style={{ borderTop: "1px solid rgba(60, 60, 60, 0.5)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(60, 60, 60, 0.5)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

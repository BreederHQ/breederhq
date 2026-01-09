// apps/contacts/src/components/TemplatePicker.tsx
// Modal for selecting email templates in EmailComposer

import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@bhq/ui";
import { X, Search, FileText, ChevronRight } from "lucide-react";
import { getOverlayRoot, acquireOverlayHost } from "@bhq/ui/overlay";
import { createTemplatePreview } from "@bhq/ui/utils";
import type { EmailTemplate, TemplatesResource } from "@bhq/api";

interface TemplatePickerProps {
  onClose: () => void;
  onSelect: (template: EmailTemplate) => void;
  api: {
    templates: TemplatesResource;
  };
}

export function TemplatePicker({ onClose, onSelect, api }: TemplatePickerProps) {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);

  const overlayRoot = getOverlayRoot();

  // Acquire overlay host for pointer events
  React.useEffect(() => {
    const release = acquireOverlayHost();
    return release;
  }, []);

  // Fetch templates on mount
  React.useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const res = await api.templates.list({ category: "email", isActive: true });
        setTemplates(res.items);
      } catch (e: any) {
        setError(e?.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, [api]);

  // Filter templates by search query
  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subject?.toLowerCase().includes(q)) ||
        t.bodyText.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (selectedTemplate) {
        setSelectedTemplate(null);
      } else {
        onClose();
      }
    }
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  if (!overlayRoot) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-picker-title"
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483646 }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-xl border border-hairline bg-surface shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 id="template-picker-title" className="text-lg font-semibold">
              {selectedTemplate ? "Template Preview" : "Select Template"}
            </h2>
            <div className="text-sm text-secondary mt-0.5">
              {selectedTemplate
                ? "Review the template before using it"
                : "Choose an email template to use"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedTemplate ? (
            // Preview Mode
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to templates
              </button>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                    Template Name
                  </label>
                  <div className="text-sm text-primary font-medium">
                    {selectedTemplate.name}
                  </div>
                </div>

                {selectedTemplate.subject && (
                  <div>
                    <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                      Subject
                    </label>
                    <div className="px-3 py-2 rounded-md bg-surface-strong border border-hairline text-sm">
                      {createTemplatePreview(selectedTemplate.subject)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                    Message Preview
                  </label>
                  <div className="px-3 py-2 rounded-md bg-surface-strong border border-hairline text-sm whitespace-pre-wrap min-h-[150px] max-h-[300px] overflow-y-auto">
                    {createTemplatePreview(selectedTemplate.bodyText)}
                  </div>
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                      Variables Used
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((v) => (
                        <span
                          key={v}
                          className="px-2 py-0.5 rounded-md bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))] text-xs font-mono"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-secondary">
                      These placeholders will be replaced with actual values when you send the email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // List Mode
            <>
              {/* Search */}
              <div className="p-4 border-b border-hairline">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    placeholder="Search templates..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Template List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-sm text-secondary">
                    Loading templates...
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="text-sm text-red-400 mb-2">{error}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="p-8 text-center text-sm text-secondary">
                    {searchQuery
                      ? "No templates match your search"
                      : "No email templates available. Create templates in Marketing > Templates."}
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="w-full px-5 py-4 text-left hover:bg-white/5 transition-colors flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-primary">
                            {template.name}
                          </div>
                          {template.subject && (
                            <div className="text-xs text-secondary mt-0.5 truncate">
                              Subject: {template.subject}
                            </div>
                          )}
                          <div className="text-xs text-secondary mt-1 line-clamp-2">
                            {template.bodyText.substring(0, 150)}
                            {template.bodyText.length > 150 && "..."}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-secondary flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedTemplate && (
            <Button onClick={handleUseTemplate}>
              Use This Template
            </Button>
          )}
        </div>
      </div>
    </div>,
    overlayRoot
  );
}

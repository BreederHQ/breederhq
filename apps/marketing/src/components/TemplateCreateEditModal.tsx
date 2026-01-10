// apps/marketing/src/components/TemplateCreateEditModal.tsx
// Modal for creating and editing email/message templates

import * as React from "react";
import { Overlay, Button, Input } from "@bhq/ui";
import { Plus } from "lucide-react";
import type {
  EmailTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateCategory,
  TemplatesResource,
} from "@bhq/api";
import { TEMPLATE_VARIABLES } from "@bhq/api";
import { createTemplatePreview, insertVariable } from "@bhq/ui/utils";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  email: "Email",
  dm: "Direct Message",
  social: "Social Draft",
};

const CATEGORY_OPTIONS: TemplateCategory[] = ["email", "dm", "social"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  template?: EmailTemplate;
  api: {
    templates: TemplatesResource;
  };
  onSuccess: () => void;
}

export function TemplateCreateEditModal({
  open,
  onOpenChange,
  mode,
  template,
  api,
  onSuccess,
}: Props) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<TemplateCategory>("email");
  const [subject, setSubject] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  const bodyTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Initialize form when modal opens
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && template) {
        setName(template.name);
        setCategory(template.category);
        setSubject(template.subject || "");
        setBodyText(template.bodyText);
      } else {
        setName("");
        setCategory("email");
        setSubject("");
        setBodyText("");
      }
      setError(null);
      setShowPreview(false);
    }
  }, [open, mode, template]);

  const handleInsertVariable = (variableKey: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart || bodyText.length;
    const result = insertVariable(bodyText, cursorPos, variableKey);

    setBodyText(result.text);

    // Set cursor position after insert
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursorPosition, result.cursorPosition);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (category === "email" && !subject.trim()) {
      setError("Subject is required for email templates");
      return;
    }

    if (!bodyText.trim()) {
      setError("Message body is required");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const input: CreateTemplateInput = {
          name: name.trim(),
          category,
          subject: category === "email" ? subject.trim() : undefined,
          bodyText: bodyText.trim(),
        };
        await api.templates.create(input);
      } else if (template) {
        const input: UpdateTemplateInput = {
          name: name.trim(),
          subject: category === "email" ? subject.trim() : null,
          bodyText: bodyText.trim(),
        };
        await api.templates.update(template.id, input);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save template";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay open={open} onClose={() => onOpenChange(false)} width={640}>
      <div>
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Create Template" : "Edit Template"}
          </h2>
          <p className="text-sm text-secondary mt-0.5">
            {mode === "create"
              ? "Create a reusable template for emails and messages"
              : "Update your template"}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Template Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Inquiry Response"
                autoFocus
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                disabled={mode === "edit"}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              {mode === "edit" && (
                <p className="text-xs text-secondary mt-1">Category cannot be changed</p>
              )}
            </div>

            {/* Subject (email only) */}
            {category === "email" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Subject Line <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Thank you for your interest in {{animal_name}}"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            )}

            {/* Variable Insert Toolbar */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Insert Variable
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleInsertVariable(v.key)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-hairline bg-surface-strong hover:bg-[hsl(var(--brand-orange))]/10 hover:border-[hsl(var(--brand-orange))]/30 hover:text-[hsl(var(--brand-orange))] transition-colors"
                    title={v.description}
                  >
                    <Plus className="h-3 w-3" />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">
                  Message Body <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-[hsl(var(--brand-orange))] hover:underline"
                >
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {showPreview ? (
                <div className="px-3 py-2 rounded-md bg-surface-strong border border-hairline text-sm whitespace-pre-wrap min-h-[200px] max-h-[300px] overflow-y-auto">
                  {createTemplatePreview(bodyText) || (
                    <span className="text-secondary italic">No content to preview</span>
                  )}
                </div>
              ) : (
                <textarea
                  ref={bodyTextareaRef}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Write your message here. Use {{contact_name}} for personalization..."
                  rows={10}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

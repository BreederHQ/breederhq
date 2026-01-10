// apps/contacts/src/components/EmailComposer.tsx
// Email composer modal for sending emails to contacts/organizations

import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@bhq/ui";
import { X, Send, Paperclip, FileText, Package } from "lucide-react";
import { getOverlayRoot, acquireOverlayHost } from "@bhq/ui/overlay";
import { applyTemplateVariables } from "@bhq/ui/utils";
import type { SendEmailInput, PartyEmail, EmailTemplate, TemplatesResource, TemplateVariableContext, DocumentBundle, DocumentBundlesResource } from "@bhq/api";
import { TemplatePicker } from "./TemplatePicker";
import { BundlePicker } from "./BundlePicker";

interface EmailComposerProps {
  partyId: number;
  partyName: string;
  partyEmail: string;
  onClose: () => void;
  onSent?: (email: PartyEmail) => void;
  api: {
    partyCrm: {
      emails: {
        send: (input: SendEmailInput) => Promise<PartyEmail>;
      };
    };
    templates?: TemplatesResource;
    documentBundles?: DocumentBundlesResource;
  };
  // Pre-fill options
  initialSubject?: string;
  initialBody?: string;
  // Variable context for template substitution
  variableContext?: Partial<TemplateVariableContext>;
}

export function EmailComposer({
  partyId,
  partyName,
  partyEmail,
  onClose,
  onSent,
  api,
  initialSubject = "",
  initialBody = "",
  variableContext = {},
}: EmailComposerProps) {
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState(initialBody);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = React.useState(false);
  const [showBundlePicker, setShowBundlePicker] = React.useState(false);
  const [selectedBundle, setSelectedBundle] = React.useState<DocumentBundle | null>(null);

  const overlayRoot = getOverlayRoot();

  // Build variable context from props and defaults
  const fullVariableContext: TemplateVariableContext = React.useMemo(() => {
    // Extract first name from party name (take first word)
    const firstName = partyName?.split(" ")[0] || "";

    return {
      contactName: partyName,
      firstName: firstName,
      ...variableContext,
    };
  }, [partyName, variableContext]);

  // Acquire overlay host to enable pointer events on the overlay root
  React.useEffect(() => {
    const release = acquireOverlayHost();
    return release;
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const email = await api.partyCrm.emails.send({
        partyId,
        to: partyEmail,
        subject: subject.trim(),
        body: body.trim(),
        bodyText: body.trim(),
        bodyHtml: `<p>${body.trim().replace(/\n/g, "</p><p>")}</p>`,
        category: "transactional",
        bundleId: selectedBundle?.id,
      });
      onSent?.(email);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
    // Escape to close (but not if template or bundle picker is open)
    if (e.key === "Escape" && !showTemplatePicker && !showBundlePicker) {
      onClose();
    }
  };

  const handleBundleSelect = (bundle: DocumentBundle) => {
    setSelectedBundle(bundle);
    setShowBundlePicker(false);
  };

  const handleRemoveBundle = () => {
    setSelectedBundle(null);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    // Apply variable substitution to both subject and body
    const substitutedSubject = template.subject
      ? applyTemplateVariables(template.subject, fullVariableContext)
      : "";
    const substitutedBody = applyTemplateVariables(template.bodyText, fullVariableContext);

    setSubject(substitutedSubject);
    setBody(substitutedBody);
    setShowTemplatePicker(false);
  };

  if (!overlayRoot) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-composer-title"
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483646 }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-xl border border-hairline bg-surface shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 id="email-composer-title" className="text-lg font-semibold">
              New Email
            </h2>
            <div className="text-sm text-secondary mt-0.5">
              To: {partyName} &lt;{partyEmail}&gt;
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
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject((e.target as HTMLInputElement).value)}
              placeholder="Enter subject..."
              autoFocus
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          {/* Body */}
          <div className="flex-1">
            <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
              className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>
        </div>

        {/* Selected Bundle Display */}
        {selectedBundle && (
          <div className="px-5 py-3 border-t border-hairline bg-surface-strong">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
                <span className="text-sm text-primary">{selectedBundle.name}</span>
                <span className="text-xs text-secondary">
                  ({selectedBundle.documentCount} document{selectedBundle.documentCount !== 1 ? "s" : ""})
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveBundle}
                className="p-1 rounded text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove bundle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            {api.documentBundles && (
              <button
                type="button"
                onClick={() => setShowBundlePicker(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors text-sm"
                title="Attach document bundle"
              >
                <Package className="h-4 w-4" />
                <span>{selectedBundle ? "Change Bundle" : "Attach Bundle"}</span>
              </button>
            )}
            {api.templates && (
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors text-sm"
                title="Use template"
              >
                <FileText className="h-4 w-4" />
                <span>Use Template</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}>
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && api.templates && (
        <TemplatePicker
          onClose={() => setShowTemplatePicker(false)}
          onSelect={handleTemplateSelect}
          api={{ templates: api.templates }}
        />
      )}

      {/* Bundle Picker Modal */}
      {showBundlePicker && api.documentBundles && (
        <BundlePicker
          onClose={() => setShowBundlePicker(false)}
          onSelect={handleBundleSelect}
          api={{ documentBundles: api.documentBundles }}
        />
      )}
    </div>,
    overlayRoot
  );
}

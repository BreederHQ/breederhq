// apps/contacts/src/components/QuickDMComposer.tsx
// Quick DM composer modal for sending direct messages from header icon

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@bhq/ui";
import { X, Send, MessageSquare } from "lucide-react";
import { getOverlayRoot, acquireOverlayHost } from "@bhq/ui/overlay";

interface QuickDMComposerProps {
  partyId: number;
  partyName: string;
  onClose: () => void;
  onSent?: () => void;
  api: {
    messages: {
      threads: {
        create: (input: { recipientPartyId: number; initialMessage: string }) => Promise<{ ok?: boolean; thread: any }>;
      };
    };
  };
}

export function QuickDMComposer({
  partyId,
  partyName,
  onClose,
  onSent,
  api,
}: QuickDMComposerProps) {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const overlayRoot = getOverlayRoot();

  // Acquire overlay host to enable pointer events
  React.useEffect(() => {
    const release = acquireOverlayHost();
    return release;
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await api.messages.threads.create({
        recipientPartyId: partyId,
        initialMessage: message.trim(),
      });
      onSent?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
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
    // Escape to close
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!overlayRoot) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dm-composer-title"
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483646 }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] rounded-xl border border-hairline bg-surface shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h2 id="dm-composer-title" className="text-lg font-semibold">
              Message {partyName}
            </h2>
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

          {/* Message */}
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={5}
              autoFocus
              className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    overlayRoot
  );
}

// apps/portal/src/pages/PortalMessagesPage.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";
import { mockMessages, type PortalMessage } from "../mock";

/* ───────────────── Message Row ───────────────── */

function MessageRow({ message }: { message: PortalMessage }) {
  return (
    <div
      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
        message.read
          ? "border-hairline bg-surface/50 hover:bg-surface"
          : "border-[hsl(var(--brand-orange))]/30 bg-[hsl(var(--brand-orange))]/5 hover:bg-[hsl(var(--brand-orange))]/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!message.read && (
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))]" />
            )}
            <span className="font-medium text-sm text-primary">{message.from}</span>
            <span className="text-xs text-secondary">{message.date}</span>
          </div>
          <div className="font-medium text-primary mt-1">{message.subject}</div>
          <p className="text-sm text-secondary mt-1 truncate">{message.preview}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyMessages() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        📬
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No messages yet</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When your breeder sends you a message, it will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalMessagesPage() {
  const unreadCount = mockMessages.filter((m) => !m.read).length;

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockMessages.length === 0 ? (
          <EmptyMessages />
        ) : (
          <div className="space-y-3">
            {mockMessages.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

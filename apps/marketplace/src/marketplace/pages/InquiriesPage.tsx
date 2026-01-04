// apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
// Full messaging UI with conversation list and thread view

import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { useConversations, useConversation, useSendMessage } from "../../messages/hooks";
import { seedDemoConversations } from "../../messages/demoData";
import { ConversationList, ThreadView } from "../../messages/components";
import { isMessagingBackendAvailable } from "../../messages/adapter";


/**
 * Inquiries page - full messaging experience.
 * Left: conversation list. Right: thread view.
 */
export function InquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState("");
  const demoMode = isDemoMode();
  const backendAvailable = isMessagingBackendAvailable();

  // Get selected conversation from URL
  const selectedId = searchParams.get("c") || null;

  // Seed demo data on first load in demo mode
  React.useEffect(() => {
    if (demoMode) {
      seedDemoConversations();
    }
  }, [demoMode]);

  // Fetch conversations
  const { conversations, loading: loadingConversations } = useConversations();

  // Fetch selected conversation and messages
  const {
    conversation,
    messages,
    loading: loadingThread,
  } = useConversation(selectedId);

  // Send message hook
  const { sendMessage, sending } = useSendMessage();

  // Handle conversation selection
  const handleSelect = React.useCallback(
    (id: string) => {
      setSearchParams({ c: id }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle send message
  const handleSendMessage = React.useCallback(
    async (content: string) => {
      if (!selectedId) return;
      await sendMessage(selectedId, content);
    },
    [selectedId, sendMessage]
  );

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // If not in demo mode and no backend, show offline state
  if (!demoMode && !backendAvailable) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Inquiries
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Message breeders and service providers.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Messaging is coming soon
          </h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Direct messaging with breeders will be available soon. In the meantime, you can send inquiries from listing pages.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/breeders"
              className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Browse breeders
            </Link>
            <button
              type="button"
              onClick={handleEnableDemo}
              className="text-sm text-text-tertiary hover:text-white transition-colors"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.header)-theme(spacing.16))] -mx-6 -mt-8 flex">
      {/* Left sidebar - conversation list */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loadingConversations}
        />
      </div>

      {/* Right panel - thread view */}
      <div className="flex-1 min-w-0">
        <ThreadView
          conversation={conversation}
          messages={messages}
          loading={loadingThread}
          onSendMessage={handleSendMessage}
          sending={sending}
        />
      </div>
    </div>
  );
}

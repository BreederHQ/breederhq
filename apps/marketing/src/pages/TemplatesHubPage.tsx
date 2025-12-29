import * as React from "react";
import { PageHeader, Tabs, SectionCard, Badge, Button } from "@bhq/ui";

/* ───────────────── Template List Item (Placeholder) ───────────────── */

interface TemplateItemProps {
  name: string;
  category: string;
  lastEdited: string;
}

function TemplateItem({ name, category, lastEdited }: TemplateItemProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-primary">{name}</div>
        <div className="mt-0.5 text-xs text-secondary">{category}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-secondary">{lastEdited}</span>
        <Button variant="ghost" size="sm">Edit</Button>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function TemplatesHubPage() {
  const [activeTab, setActiveTab] = React.useState("all");

  const tabItems = [
    { value: "all", label: "All" },
    { value: "email", label: "Email" },
    { value: "dm", label: "Direct Messages" },
    { value: "social", label: "Social Drafts" },
  ];

  // Placeholder templates to show the structure
  const placeholderTemplates: TemplateItemProps[] = [
    { name: "New Inquiry Response", category: "Direct Messages", lastEdited: "Draft" },
    { name: "Puppy Application Follow-up", category: "Email", lastEdited: "Draft" },
    { name: "Litter Announcement", category: "Social Drafts", lastEdited: "Draft" },
  ];

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/marketing");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBackClick}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Badge variant="neutral" className="text-xs">ACTIVE</Badge>
        </div>
        <PageHeader
          title="Email and Message Templates"
          subtitle="Create and manage reusable templates for emails, direct messages, and social posts"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={tabItems}
        variant="underline-orange"
        size="sm"
      />

      {/* Content */}
      <SectionCard
        title="Your Templates"
        right={
          <Button size="sm" disabled>
            + New Template
          </Button>
        }
      >
        <div className="space-y-2">
          {placeholderTemplates.map((template, idx) => (
            <TemplateItem key={idx} {...template} />
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6 rounded-lg border border-dashed border-hairline bg-surface-strong/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-primary mb-1">Template Editor Coming Soon</div>
              <p className="text-xs text-secondary">
                The full template editor is in development. Soon you will be able to create, edit, and organize templates for all your messaging needs.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

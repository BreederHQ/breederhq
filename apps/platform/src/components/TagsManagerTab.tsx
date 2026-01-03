// apps/platform/src/components/TagsManagerTab.tsx
import React from "react";
import { Card, Button, Input } from "@bhq/ui";
import { api } from "../api";

type TagModule = "CONTACT" | "ORGANIZATION" | "ANIMAL" | "WAITLIST_ENTRY" | "OFFSPRING_GROUP" | "OFFSPRING";

type Tag = {
  id: number;
  name: string;
  module: TagModule;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

const MODULE_LABELS: Record<TagModule, string> = {
  CONTACT: "Contacts",
  ORGANIZATION: "Organizations",
  ANIMAL: "Animals",
  WAITLIST_ENTRY: "Waitlist Entries",
  OFFSPRING_GROUP: "Offspring Groups",
  OFFSPRING: "Offspring",
};

const MODULE_ORDER: TagModule[] = [
  "CONTACT",
  "ORGANIZATION",
  "ANIMAL",
  "WAITLIST_ENTRY",
  "OFFSPRING_GROUP",
  "OFFSPRING",
];

export function TagsManagerTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedModules, setCollapsedModules] = React.useState<Set<TagModule>>(new Set());

  // Fetch all tags
  const fetchTags = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: API currently only supports fetching by type="contact"
      // This is a known limitation - we fetch what we can and note the gap
      const response = await api.tags.list("contact");
      const items = response.items || [];
      setTags(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const q = searchQuery.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [tags, searchQuery]);

  // Group tags by module
  const tagsByModule = React.useMemo(() => {
    const groups: Record<TagModule, Tag[]> = {
      CONTACT: [],
      ORGANIZATION: [],
      ANIMAL: [],
      WAITLIST_ENTRY: [],
      OFFSPRING_GROUP: [],
      OFFSPRING: [],
    };

    filteredTags.forEach((tag) => {
      if (groups[tag.module]) {
        groups[tag.module].push(tag);
      }
    });

    return groups;
  }, [filteredTags]);

  const toggleModuleCollapse = (module: TagModule) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Tags Manager</h3>
            <p className="text-sm text-secondary">
              View tags used across modules (read-only)
            </p>
          </div>
        </div>

        {/* Search control */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search tags by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="text-secondary">Loading tags...</div>
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="p-8 text-center space-y-4">
          <div className="text-red-400">Error: {error}</div>
          <Button onClick={fetchTags} size="sm">
            Retry
          </Button>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTags.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-secondary">
            {searchQuery.trim() ? "No tags match your search." : "No tags found."}
          </div>
        </Card>
      )}

      {/* Tags grouped by module */}
      {!loading && !error && filteredTags.length > 0 && (
        <div className="space-y-3">
          {MODULE_ORDER.map((module) => {
            const moduleTags = tagsByModule[module] || [];
            const isCollapsed = collapsedModules.has(module);

            // Always render module sections, even if empty (future-proofing)
            return (
              <Card key={module} className="overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModuleCollapse(module)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-surface hover:bg-surface-hover transition-colors border-b border-hairline"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{MODULE_LABELS[module]}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-surface-dimmed text-secondary">
                      {moduleTags.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Module content */}
                {!isCollapsed && (
                  <div className="p-4">
                    {moduleTags.length === 0 ? (
                      <div className="text-sm text-secondary py-4 text-center">
                        No {MODULE_LABELS[module].toLowerCase()} tags yet
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-secondary border-b border-hairline">
                            <th className="pb-2 font-medium w-8"></th>
                            <th className="pb-2 font-medium">Name</th>
                            <th className="pb-2 font-medium">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {moduleTags.map((tag) => (
                            <tr key={tag.id} className="border-b border-hairline last:border-0">
                              <td className="py-2">
                                <div
                                  className="w-3 h-3 rounded-full border border-hairline"
                                  style={{
                                    backgroundColor: tag.color || "#888",
                                  }}
                                  title={tag.color || "No color set"}
                                />
                              </td>
                              <td className="py-2 font-medium">{tag.name}</td>
                              <td className="py-2 text-sm text-secondary">
                                {new Date(tag.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

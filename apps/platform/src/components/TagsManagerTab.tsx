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

type TagWithUsage = Tag & {
  usageCount: number;
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

type FilterMode = "active" | "archived" | "all";

export function TagsManagerTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [tags, setTags] = React.useState<TagWithUsage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("active");
  const [collapsedModules, setCollapsedModules] = React.useState<Set<TagModule>>(new Set());

  // Fetch all tags on mount
  React.useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        // Fetch all tags without module filter to get everything
        const response = await api.tags.list({ limit: 1000 });
        const items = response.items || [];

        // For now, usage count is set to 0 (will be populated from assignments API in future)
        // Note: API returns { items: Tag[], total: number, page: number, limit: number }
        const tagsWithUsage: TagWithUsage[] = items.map((tag: Tag) => ({
          ...tag,
          usageCount: 0, // TODO: Fetch from assignments when available
        }));

        setTags(tagsWithUsage);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Filter tags based on search and filter mode
  const filteredTags = React.useMemo(() => {
    let filtered = tags;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((tag) => tag.name.toLowerCase().includes(q));
    }

    // Archive filter (placeholder - currently no archived field in API response)
    // For now, show all tags regardless of filterMode
    // TODO: Filter by archived status when API supports it

    return filtered;
  }, [tags, searchQuery, filterMode]);

  // Group tags by module
  const tagsByModule = React.useMemo(() => {
    const groups: Record<TagModule, TagWithUsage[]> = {
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
              View and manage tags used across modules (read-only for now)
            </p>
          </div>
        </div>

        {/* Search and filter controls */}
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

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filterMode === "active" ? "default" : "outline"}
              onClick={() => setFilterMode("active")}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={filterMode === "archived" ? "default" : "outline"}
              onClick={() => setFilterMode("archived")}
            >
              Archived
            </Button>
            <Button
              size="sm"
              variant={filterMode === "all" ? "default" : "outline"}
              onClick={() => setFilterMode("all")}
            >
              All
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="text-secondary">Loading tags...</div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && filteredTags.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-secondary">
            {searchQuery.trim() ? "No tags match your search." : "No tags found."}
          </div>
        </Card>
      )}

      {/* Tags grouped by module */}
      {!loading && filteredTags.length > 0 && (
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
                            <th className="pb-2 font-medium">Usage</th>
                            <th className="pb-2 font-medium">Created</th>
                            <th className="pb-2 font-medium">Status</th>
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
                                {tag.usageCount > 0 ? `${tag.usageCount} items` : "—"}
                              </td>
                              <td className="py-2 text-sm text-secondary">
                                {new Date(tag.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2 text-sm text-secondary">
                                Active
                                {/* TODO: Show archived badge when API supports it */}
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

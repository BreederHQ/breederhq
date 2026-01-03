// apps/platform/src/components/TagsManagerTab.tsx
import React from "react";
import { Card, Button, Input } from "@bhq/ui";
import { api } from "../api";
import { TagCreateEditModal } from "./tags/TagCreateEditModal";
import { TagRowActions } from "./tags/TagRowActions";
import { TagDeleteConfirm } from "./tags/TagDeleteConfirm";

type TagModule = "CONTACT" | "ORGANIZATION" | "ANIMAL" | "WAITLIST_ENTRY" | "OFFSPRING_GROUP" | "OFFSPRING";
type ArchiveFilter = "active" | "archived" | "all";

type Tag = {
  id: number;
  name: string;
  module: TagModule;
  color: string | null;
  isArchived: boolean;
  archivedAt: string | null;
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
  const [archiveFilter, setArchiveFilter] = React.useState<ArchiveFilter>("active");
  const [collapsedModules, setCollapsedModules] = React.useState<Set<TagModule>>(new Set());

  // Usage counts from stats endpoint
  const [usageCounts, setUsageCounts] = React.useState<Map<number, number>>(new Map());

  // Modal states
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<Tag | null>(null);

  // Fetch all tags and usage stats
  const fetchTags = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch tags and stats in parallel (always include archived for filtering)
      const [tagsResponse, statsResponse] = await Promise.all([
        api.tags.list({ limit: 1000, includeArchived: true }),
        api.tags.stats({ includeArchived: true }),
      ]);
      const items = tagsResponse.items || [];
      setTags(items);

      // Build usage counts map
      const counts = new Map<number, number>();
      for (const stat of statsResponse.items || []) {
        counts.set(stat.tagId, stat.usageCount);
      }
      setUsageCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tags");
      setTags([]);
      setUsageCounts(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Filter tags based on search and archive filter
  const filteredTags = React.useMemo(() => {
    let result = tags;

    // Apply archive filter
    if (archiveFilter === "active") {
      result = result.filter((tag) => !tag.isArchived);
    } else if (archiveFilter === "archived") {
      result = result.filter((tag) => tag.isArchived);
    }
    // "all" shows everything

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tag) => tag.name.toLowerCase().includes(q));
    }

    return result;
  }, [tags, searchQuery, archiveFilter]);

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

  // Mutation handlers
  const handleCreateTag = async (data: { name: string; module: TagModule; color: string | null }) => {
    await api.tags.create(data);
    await fetchTags();
  };

  const handleEditTag = async (data: { name: string; module: TagModule; color: string | null }) => {
    if (!selectedTag) return;
    // Module is immutable, only send name and color
    await api.tags.update(selectedTag.id, { name: data.name, color: data.color });
    await fetchTags();
  };

  const handleArchiveTag = async (tag: Tag) => {
    await api.tags.update(tag.id, { isArchived: true });
    await fetchTags();
  };

  const handleUnarchiveTag = async (tag: Tag) => {
    await api.tags.update(tag.id, { isArchived: false });
    await fetchTags();
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setEditModalOpen(true);
  };

  const openDeleteModal = (tag: Tag) => {
    setSelectedTag(tag);
    setDeleteModalOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    await api.tags.delete(selectedTag.id);
    await fetchTags();
  };

  // Helper to get usage count for a tag
  const getUsageCount = (tagId: number): number => {
    return usageCounts.get(tagId) ?? 0;
  };

  // Check if registry is truly empty (no tags at all)
  const isRegistryEmpty = tags.length === 0;

  // Check if current filter yields no results
  const isFilterEmpty = filteredTags.length === 0 && !isRegistryEmpty;

  return (
    <div className="space-y-4">
      {/* Header row: Title + Filter + Search + New Tag */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Tag Manager</h3>

        <div className="flex items-center gap-3">
          {/* Archive filter buttons */}
          <div className="flex rounded-md border border-hairline overflow-hidden">
            {(["active", "archived", "all"] as ArchiveFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setArchiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  archiveFilter === filter
                    ? "bg-brand text-white"
                    : "bg-surface hover:bg-surface-hover text-secondary"
                }`}
              >
                {filter === "active" ? "Active" : filter === "archived" ? "Archived" : "All"}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="w-64">
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            New Tag
          </Button>
        </div>
      </div>

      {/* Helper text for archive filter */}
      {archiveFilter === "archived" && (
        <p className="text-xs text-secondary">
          Archived tags cannot be assigned unless unarchived.
        </p>
      )}

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

      {/* Registry empty state - intentional first-time experience */}
      {!loading && !error && isRegistryEmpty && (
        <div className="py-16 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <svg
              className="w-12 h-12 mx-auto text-secondary opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h4 className="text-lg font-medium">No tags yet</h4>
            <p className="text-sm text-secondary">
              Tags help you organize animals, contacts, and offspring across BreederHQ.
              You can apply tags from any detail page.
            </p>
            <Button onClick={() => setCreateModalOpen(true)} size="sm">
              Create your first tag
            </Button>
          </div>
        </div>
      )}

      {/* Filter empty state - has tags but none match current filter */}
      {!loading && !error && isFilterEmpty && (
        <Card className="p-8 text-center">
          <div className="text-secondary">
            {searchQuery.trim()
              ? "No tags match your search."
              : archiveFilter === "archived"
                ? "No archived tags."
                : archiveFilter === "active"
                  ? "No active tags."
                  : "No tags found."}
          </div>
        </Card>
      )}

      {/* Tags grouped by module */}
      {!loading && !error && filteredTags.length > 0 && (
        <div className="space-y-3">
          {MODULE_ORDER.map((module) => {
            const moduleTags = tagsByModule[module] || [];
            const isCollapsed = collapsedModules.has(module);

            // Only render module sections that have tags in current filter
            if (moduleTags.length === 0) return null;

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
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-secondary border-b border-hairline">
                          <th className="pb-2 font-medium w-8"></th>
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Usage</th>
                          <th className="pb-2 font-medium">Created</th>
                          <th className="pb-2 font-medium w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {moduleTags.map((tag) => {
                          const usage = getUsageCount(tag.id);
                          return (
                            <tr
                              key={tag.id}
                              className={`border-b border-hairline last:border-0 ${
                                tag.isArchived ? "opacity-60" : ""
                              }`}
                            >
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
                              <td className="py-2">
                                {tag.isArchived ? (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                                    Archived
                                  </span>
                                ) : (
                                  <span className="text-sm text-secondary">Active</span>
                                )}
                              </td>
                              <td className="py-2 text-sm text-secondary">
                                {usage}
                              </td>
                              <td className="py-2 text-sm text-secondary">
                                {new Date(tag.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2 text-right">
                                <TagRowActions
                                  tag={tag}
                                  usageCount={usage}
                                  onEdit={() => openEditModal(tag)}
                                  onDelete={() => openDeleteModal(tag)}
                                  onArchive={() => handleArchiveTag(tag)}
                                  onUnarchive={() => handleUnarchiveTag(tag)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TagCreateEditModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        mode="create"
        onSubmit={handleCreateTag}
      />

      <TagCreateEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        mode="edit"
        tag={selectedTag || undefined}
        onSubmit={handleEditTag}
      />

      <TagDeleteConfirm
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        tag={selectedTag}
        onConfirm={handleDeleteTag}
      />
    </div>
  );
}

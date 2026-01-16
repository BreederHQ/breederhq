// apps/marketplace/src/provider/components/ServiceTagSelector.tsx
// Reusable tag selector for service listings

import React, { useState, useEffect } from "react";
import { getServiceTags, createServiceTag, type ServiceTag } from "../../api/client";

interface ServiceTagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  maxTags?: number;
}

export function ServiceTagSelector({
  selectedTagIds,
  onChange,
  maxTags = 5
}: ServiceTagSelectorProps) {
  const [allTags, setAllTags] = useState<ServiceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true);
        const response = await getServiceTags({ limit: 100 });
        setAllTags(response.items);
      } catch (err) {
        console.error("Failed to load service tags:", err);
        setError(err instanceof Error ? err.message : "Failed to load tags");
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, []);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!searchQuery.trim()) {
      // Show suggested tags first when no search
      return allTags.sort((a, b) => {
        if (a.suggested && !b.suggested) return -1;
        if (!a.suggested && b.suggested) return 1;
        return b.usageCount - a.usageCount; // Then by popularity
      });
    }
    const query = searchQuery.toLowerCase();
    return allTags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [allTags, searchQuery]);

  const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id));

  const handleToggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      if (selectedTagIds.length >= maxTags) {
        setError(`Maximum ${maxTags} tags allowed`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const name = searchQuery.trim();
    if (!name) return;

    // Check if tag already exists
    const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      handleToggleTag(existing.id);
      setSearchQuery("");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const newTag = await createServiceTag(name);
      setAllTags((prev) => [...prev, newTag]);
      onChange([...selectedTagIds, newTag.id]);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading tags...</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search/Create Input */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or create tags..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery.trim() && (
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={creating}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : `+ Create "${searchQuery}"`}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              {tag.name}
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
          <div className="text-xs text-gray-500 self-center">
            {selectedTagIds.length}/{maxTags}
          </div>
        </div>
      )}

      {/* Available Tags */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">
          {searchQuery ? "Matching tags:" : "Suggested tags:"}
        </p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {filteredTags.length === 0 ? (
            <p className="text-xs text-gray-500">No matching tags found</p>
          ) : (
            filteredTags
              .filter((tag) => !selectedTagIds.includes(tag.id))
              .map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  disabled={selectedTagIds.length >= maxTags}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {tag.name}
                  {tag.suggested && (
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {tag.usageCount > 0 && (
                    <span className="text-[10px] text-gray-500">
                      {tag.usageCount}
                    </span>
                  )}
                </button>
              ))
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Select up to {maxTags} tags to help buyers discover your service. Popular tags are shown first.
      </p>
    </div>
  );
}

export default ServiceTagSelector;

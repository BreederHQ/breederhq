// apps/contacts/src/components/NotesTab.tsx
// Notes scratch-pad tab for contacts/organizations

import * as React from "react";
import { SectionCard, Button, Input } from "@bhq/ui";
import { Pin, Trash2, Plus, Save, X } from "lucide-react";
import type { PartyNote, CreatePartyNoteInput } from "@bhq/api";

interface NotesTabProps {
  partyId: number;
  api: {
    partyCrm: {
      notes: {
        list: (partyId: number) => Promise<{ items: PartyNote[]; total: number }>;
        create: (input: CreatePartyNoteInput) => Promise<PartyNote>;
        update: (partyId: number, noteId: number | string, input: { content?: string; pinned?: boolean }) => Promise<PartyNote>;
        delete: (partyId: number, noteId: number | string) => Promise<{ success: true }>;
        pin: (partyId: number, noteId: number | string, pinned: boolean) => Promise<PartyNote>;
      };
    };
  };
}

export function NotesTab({ partyId, api }: NotesTabProps) {
  const [notes, setNotes] = React.useState<PartyNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // New note state
  const [isAdding, setIsAdding] = React.useState(false);
  const [newContent, setNewContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Edit state
  const [editingId, setEditingId] = React.useState<number | string | null>(null);
  const [editContent, setEditContent] = React.useState("");

  const loadNotes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.partyCrm.notes.list(partyId);
      // Sort: pinned first, then by date desc
      const sorted = [...res.items].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setNotes(sorted);
    } catch (e: any) {
      setError(e?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [api, partyId]);

  React.useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const created = await api.partyCrm.notes.create({
        partyId,
        content: newContent.trim(),
        pinned: false,
      });
      setNotes((prev) => [created, ...prev]);
      setNewContent("");
      setIsAdding(false);
    } catch (e: any) {
      setError(e?.message || "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: number | string) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await api.partyCrm.notes.update(partyId, noteId, { content: editContent.trim() });
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingId(null);
      setEditContent("");
    } catch (e: any) {
      setError(e?.message || "Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: number | string) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.partyCrm.notes.delete(partyId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete note");
    }
  };

  const handleTogglePin = async (note: PartyNote) => {
    try {
      const updated = await api.partyCrm.notes.pin(partyId, note.id, !note.pinned);
      setNotes((prev) => {
        const updated_list = prev.map((n) => (n.id === note.id ? updated : n));
        // Re-sort: pinned first
        return updated_list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    } catch (e: any) {
      setError(e?.message || "Failed to pin note");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <span className="text-lg opacity-70">📝</span>
            <span>Notes</span>
          </span>
        }
        right={
          !isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Note
            </Button>
          )
        }
      >
        {error && (
          <div className="mb-3 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Add new note form */}
        {isAdding && (
          <div className="mb-4 p-3 rounded-lg border border-hairline bg-surface-strong">
            <textarea
              autoFocus
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write a note..."
              rows={4}
              className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewContent("");
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving || !newContent.trim()}>
                {saving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-sm text-secondary mb-2">No notes yet</div>
            <div className="text-xs text-secondary">
              Add notes to keep track of important details about this{" "}
              {partyId ? "contact" : "organization"}.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border transition-colors ${
                  note.pinned
                    ? "border-[hsl(var(--brand-orange))]/40 bg-[hsl(var(--brand-orange))]/5"
                    : "border-hairline bg-surface"
                }`}
              >
                {editingId === note.id ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        disabled={saving || !editContent.trim()}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm whitespace-pre-wrap flex-1">{note.content}</div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note)}
                          className={`p-1.5 rounded-md transition-colors ${
                            note.pinned
                              ? "text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10"
                              : "text-secondary hover:text-primary hover:bg-white/5"
                          }`}
                          title={note.pinned ? "Unpin" : "Pin to top"}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-secondary flex items-center gap-2">
                      <span>{formatDate(note.createdAt)}</span>
                      {note.createdByUserName && (
                        <>
                          <span className="text-hairline">|</span>
                          <span>{note.createdByUserName}</span>
                        </>
                      )}
                      {note.pinned && (
                        <>
                          <span className="text-hairline">|</span>
                          <span className="text-[hsl(var(--brand-orange))]">Pinned</span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

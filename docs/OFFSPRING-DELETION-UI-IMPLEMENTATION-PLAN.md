# Offspring Deletion UI - Implementation Plan

**Date:** January 15, 2026
**Purpose:** Design and implement safe, intentional offspring deletion with archive-first approach
**Status:** 🎯 Ready for Implementation

---

## 🎯 User Requirements

From user feedback:
> "we need to let them if they've drilled all the way down into a specific offspring and been intentional about wanting to delete them but they need to understand what it is they are about to do - maybe encourage archive first and then a double confirmation prompt to delete (like those - you must type this crazy phrase into this box to confirm your intention to remove this offspring record)."

**Key Requirements:**
1. ✅ Allow deletion for accidental creation scenarios
2. ✅ Require user to drill down into specific offspring (intentional navigation)
3. ✅ Warn users extensively (5x warnings mentioned)
4. ✅ Encourage archive first before deletion
5. ✅ Double confirmation with phrase typing
6. ✅ Make users understand the permanence of deletion
7. ✅ Allow destructive data removal when truly needed

---

## 🔍 Current State Analysis

### What Exists

**Backend API:**
- ✅ DELETE `/api/v1/offspring/individuals/:id` endpoint implemented
- ✅ 10 comprehensive blocker checks before allowing deletion
- ✅ Hard delete (permanent removal) for "fresh" offspring only
- ✅ Archive endpoint for offspring groups (not individuals)

**Frontend:**
- ❌ No delete button in offspring detail view
- ❌ No confirmation dialogs
- ❌ No archive functionality for individuals
- ❌ No unlink functionality for offspring groups

### What's Missing

1. **Delete button** in offspring detail view
2. **Archive functionality** for individual offspring (soft delete)
3. **Multi-step confirmation flow** with warnings
4. **Phrase confirmation** input for final step
5. **Blocker explanation UI** when deletion is not allowed
6. **Unlink functionality** for offspring groups

---

## 🎨 Proposed UX Flow

### Flow 1: Delete Fresh Offspring (Success Path)

```
User views offspring detail page
    ↓
Scrolls to bottom, clicks "Delete Offspring" (red button in danger zone)
    ↓
[STEP 1] Initial Warning Modal
    "⚠️ Delete This Offspring?"
    "This will permanently remove [Name/Collar] from your records."

    "Consider archiving instead:"
    [Archive Offspring] [Continue to Delete]
    ↓
User clicks [Continue to Delete]
    ↓
[STEP 2] Educational Warning Modal
    "⚠️ Are You Sure?"

    "Deleting this offspring will:
     • Permanently remove all photos and notes
     • Remove from this offspring group
     • Cannot be undone

    This offspring has no buyers, contracts, or payments yet.
    Once it does, deletion will no longer be possible."

    [Cancel] [Yes, Delete]
    ↓
User clicks [Yes, Delete]
    ↓
[STEP 3] Confirmation Phrase Modal
    "⚠️ Final Confirmation Required"

    "To confirm permanent deletion, type the offspring's collar/name exactly:"

    Collar: "BLUE-01"

    [Type here: ____________]

    [Cancel] [Delete Permanently]
    ↓
User types "BLUE-01" exactly
    ↓
Button enables, user clicks [Delete Permanently]
    ↓
API call: DELETE /api/v1/offspring/individuals/:id
    ↓
Success: Redirect to offspring group page with toast:
    "✅ Offspring BLUE-01 has been permanently deleted"
```

### Flow 2: Delete Blocked (Has Business Data)

```
User views offspring detail page
    ↓
Scrolls to bottom, clicks "Delete Offspring"
    ↓
[STEP 1] Initial Warning Modal appears
    ↓
User clicks [Continue to Delete]
    ↓
API check returns 409 (has blockers)
    ↓
[ERROR MODAL] Cannot Delete
    "❌ Cannot Delete This Offspring"

    "This offspring has permanent business records and cannot be deleted:"

    ✓ Has assigned buyer (John Smith)
    ✓ Has signed contract (Contract #12345)
    ✓ Has received payments ($250.00 deposit)

    "Regulatory and lineage tracking requirements prevent deletion
    of offspring with business activity."

    "You can archive this offspring to hide it from active views."

    [Archive Instead] [Close]
```

### Flow 3: Archive First (Recommended Path)

```
User views offspring detail page
    ↓
Scrolls to bottom, clicks "Delete Offspring"
    ↓
[STEP 1] Initial Warning Modal
    ↓
User clicks [Archive Offspring] (recommended option)
    ↓
[ARCHIVE MODAL]
    "📦 Archive This Offspring?"

    "Archiving will:
     • Hide offspring from active views
     • Preserve all data and history
     • Can be restored anytime
     • Recommended over deletion

    Reason for archiving (optional):
    [Text area: ________________]

    [Cancel] [Archive]
    ↓
User clicks [Archive]
    ↓
API call: POST /api/v1/offspring/individuals/:id/archive
    ↓
Success: Offspring detail updates with archived badge:
    "📦 This offspring is archived"
    [Restore] [Delete Permanently]
```

---

## 🛠️ Implementation Components

### 1. Backend API Changes

#### A. Add Archive Endpoint for Individual Offspring

**File:** `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\offspring.ts`

**New Endpoint:** `POST /api/v1/offspring/individuals/:id/archive`

```typescript
// Archive individual offspring (soft delete)
router.post('/individuals/:id/archive', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.body;
  const { reason } = req.body; // Optional archive reason

  // Validate ownership
  const offspring = await prisma.offspring.findFirst({
    where: { id: Number(id), tenantId },
  });

  if (!offspring) {
    return res.status(404).json({ error: 'offspring_not_found' });
  }

  // Archive (soft delete)
  const archived = await prisma.offspring.update({
    where: { id: Number(id) },
    data: {
      archivedAt: new Date(),
      archiveReason: reason || null,
    },
  });

  return res.json({ ok: true, archived });
});
```

#### B. Add Restore Endpoint for Individual Offspring

**New Endpoint:** `POST /api/v1/offspring/individuals/:id/restore`

```typescript
// Restore archived offspring
router.post('/individuals/:id/restore', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.body;

  const restored = await prisma.offspring.update({
    where: { id: Number(id), tenantId },
    data: {
      archivedAt: null,
      archiveReason: null,
    },
  });

  return res.json({ ok: true, restored });
});
```

#### C. Update Schema for Archive Fields

**File:** `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma`

```prisma
model Offspring {
  id            Int       @id @default(autoincrement())
  // ... existing fields ...

  archivedAt    DateTime? // Soft delete timestamp
  archiveReason String?   // Optional reason for archiving

  // ... rest of model ...
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_offspring_archive_fields
```

---

### 2. Frontend API Methods

**File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\api.ts`

Add new methods to the `offspring.individuals` namespace:

```typescript
individuals: {
  // ... existing methods ...

  // Archive individual offspring
  archive: (id: number, reason?: string, opts?: TenantInit): Promise<{ ok: true }> =>
    raw.post<{ ok: true }>(`/offspring/individuals/${id}/archive`, { reason }, opts),

  // Restore archived offspring
  restore: (id: number, opts?: TenantInit): Promise<{ ok: true }> =>
    raw.post<{ ok: true }>(`/offspring/individuals/${id}/restore`, {}, opts),

  // Existing remove method (already defined at line 742-743)
  remove: (id: number, opts?: TenantInit): Promise<{ ok: true }> =>
    raw.del<{ ok: true }>(`/offspring/individuals/${id}`, opts),
},
```

---

### 3. Frontend UI Components

#### A. Delete Button in Offspring Detail View

**File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\pages\OffspringPage.tsx`

**Location:** Add to the bottom of the offspring detail scaffold (around line 3400+)

```tsx
// Add to the offspring detail panel, below all form fields
{!readonly && (
  <div className="mt-8 pt-6 border-t border-border-subtle">
    <h4 className="text-sm font-medium text-text-secondary mb-4">Danger Zone</h4>

    {offspring.archivedAt ? (
      // Show restore button if archived
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Archive className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-300 mb-1">
              This offspring is archived
            </p>
            <p className="text-xs text-text-tertiary mb-3">
              Archived on {formatDate(offspring.archivedAt)}
              {offspring.archiveReason && ` • Reason: ${offspring.archiveReason}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors"
              >
                Restore Offspring
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      // Show archive/delete buttons if not archived
      <div className="flex gap-3">
        <button
          onClick={handleArchiveClick}
          className="px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-text-secondary hover:text-white text-sm rounded-lg transition-colors"
        >
          Archive Offspring
        </button>
        <button
          onClick={handleDeleteClick}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm rounded-lg transition-colors"
        >
          Delete Offspring
        </button>
      </div>
    )}
  </div>
)}
```

#### B. Multi-Step Deletion Modal Component

**New File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\components\OffspringDeleteModal.tsx`

```tsx
import { useState } from "react";
import { AlertTriangle, Archive, X } from "lucide-react";

interface OffspringDeleteModalProps {
  offspring: {
    id: number;
    name?: string;
    collar?: string;
  };
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export function OffspringDeleteModal({
  offspring,
  onArchive,
  onDelete,
  onCancel,
}: OffspringDeleteModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = offspring.collar || offspring.name || `Offspring #${offspring.id}`;
  const isConfirmationValid = confirmationText === displayName;

  const handleArchive = async () => {
    setLoading(true);
    try {
      await onArchive();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        {/* Step 1: Initial Warning */}
        {step === 1 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Delete This Offspring?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This will permanently remove <span className="font-medium text-white">{displayName}</span> from your records.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-2">
                      Consider archiving instead
                    </p>
                    <p className="text-xs text-text-tertiary mb-3">
                      Archiving preserves all data but hides the offspring from active views. You can restore it anytime.
                    </p>
                    <button
                      onClick={handleArchive}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? "Archiving..." : "Archive Offspring"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Continue to Delete
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Educational Warning */}
        {step === 2 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Are You Sure?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-red-300 mb-3">
                  Deleting this offspring will:
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Permanently remove all photos and notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Remove from this offspring group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Cannot be undone or restored</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-amber-300">
                  This offspring has no buyers, contracts, or payments yet. Once it does, deletion will no longer be possible.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirmation Phrase */}
        {step === 3 && (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Final Confirmation Required
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Type the offspring identifier to confirm deletion.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-text-secondary mb-4">
                  To confirm permanent deletion, type the offspring's {offspring.collar ? "collar" : "name"} exactly:
                </p>
                <div className="bg-portal-card border border-border-subtle rounded-lg p-3 mb-4">
                  <p className="text-xs text-text-tertiary mb-1">
                    {offspring.collar ? "Collar" : "Name"}:
                  </p>
                  <p className="text-lg font-mono font-semibold text-white">
                    {displayName}
                  </p>
                </div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-4 py-2 bg-portal-card border border-border-default rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  autoFocus
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-red-400 mt-2">
                    Text does not match. Please type exactly: {displayName}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!isConfirmationValid || loading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

#### C. Blocked Deletion Error Modal

**New File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\components\OffspringDeleteBlockedModal.tsx`

```tsx
import { AlertCircle, X } from "lucide-react";

interface Blockers {
  hasBuyer: boolean;
  isPlaced: boolean;
  hasFinancialState: boolean;
  hasPayments: boolean;
  hasContract: boolean;
  isPromoted: boolean;
  isDeceased: boolean;
  hasHealthEvents: boolean;
  hasDocuments: boolean;
  hasInvoices: boolean;
}

interface OffspringDeleteBlockedModalProps {
  blockers: Blockers;
  onArchive: () => Promise<void>;
  onClose: () => void;
}

export function OffspringDeleteBlockedModal({
  blockers,
  onArchive,
  onClose,
}: OffspringDeleteBlockedModalProps) {
  const activeBlockers = Object.entries(blockers)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const blockerMessages: Record<string, string> = {
    hasBuyer: "Has assigned buyer",
    isPlaced: "Has been placed/delivered",
    hasFinancialState: "Has financial transactions",
    hasPayments: "Has received payments",
    hasContract: "Has signed contract",
    isPromoted: "Promoted to full animal record",
    isDeceased: "Marked as deceased (historical record)",
    hasHealthEvents: "Has health records",
    hasDocuments: "Has attached documents",
    hasInvoices: "Has associated invoices",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Cannot Delete This Offspring
              </h3>
              <p className="text-sm text-text-secondary">
                This offspring has permanent business records and cannot be deleted.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-300 mb-3">
              Active blockers ({activeBlockers.length}):
            </p>
            <ul className="space-y-2">
              {activeBlockers.map((blocker) => (
                <li key={blocker} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-red-400 mt-0.5">✓</span>
                  <span>{blockerMessages[blocker]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-xs text-text-secondary">
              Regulatory and lineage tracking requirements prevent deletion of offspring with business activity.
              Once an offspring has buyers, contracts, or payments, it becomes part of the permanent breeding record.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={onArchive}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-sm font-medium rounded-lg transition-colors"
            >
              Archive Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### D. Archive Modal Component

**New File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\components\OffspringArchiveModal.tsx`

```tsx
import { useState } from "react";
import { Archive, X } from "lucide-react";

interface OffspringArchiveModalProps {
  offspring: {
    id: number;
    name?: string;
    collar?: string;
  };
  onArchive: (reason?: string) => Promise<void>;
  onCancel: () => void;
}

export function OffspringArchiveModal({
  offspring,
  onArchive,
  onCancel,
}: OffspringArchiveModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = offspring.collar || offspring.name || `Offspring #${offspring.id}`;

  const handleArchive = async () => {
    setLoading(true);
    try {
      await onArchive(reason || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-portal-surface border border-border-default rounded-lg shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <Archive className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Archive This Offspring?
              </h3>
              <p className="text-sm text-text-secondary">
                Archive <span className="font-medium text-white">{displayName}</span> to hide from active views.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-text-tertiary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-300 mb-3">
              Archiving will:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Hide offspring from active views and lists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Preserve all data, photos, and history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Can be restored anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Recommended over deletion</span>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Reason for archiving (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Accidental creation, duplicate record, etc."
              rows={3}
              className="w-full px-4 py-2 bg-portal-card border border-border-default rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-portal-card hover:bg-portal-card-hover border border-border-subtle text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Archiving..." : "Archive Offspring"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Integration into Offspring Page

**File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\offspring\src\pages\OffspringPage.tsx`

Add state and handlers:

```tsx
// Add imports
import { OffspringDeleteModal } from "../components/OffspringDeleteModal";
import { OffspringDeleteBlockedModal } from "../components/OffspringDeleteBlockedModal";
import { OffspringArchiveModal } from "../components/OffspringArchiveModal";

// Add state
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showArchiveModal, setShowArchiveModal] = useState(false);
const [showBlockedModal, setShowBlockedModal] = useState(false);
const [deleteBlockers, setDeleteBlockers] = useState<any>(null);

// Add handlers
const handleDeleteClick = () => {
  setShowDeleteModal(true);
};

const handleArchiveClick = () => {
  setShowArchiveModal(true);
};

const handleArchive = async (reason?: string) => {
  try {
    await api.offspring.individuals.archive(offspring.id, reason, { tenantId });
    setShowArchiveModal(false);
    setShowDeleteModal(false);
    // Refresh offspring data
    await refetchOffspring();
    // Show success toast
    showToast("Offspring archived successfully", "success");
  } catch (err: any) {
    showToast(`Failed to archive: ${err.message}`, "error");
  }
};

const handleRestore = async () => {
  try {
    await api.offspring.individuals.restore(offspring.id, { tenantId });
    await refetchOffspring();
    showToast("Offspring restored successfully", "success");
  } catch (err: any) {
    showToast(`Failed to restore: ${err.message}`, "error");
  }
};

const handleDelete = async () => {
  try {
    await api.offspring.individuals.remove(offspring.id, { tenantId });
    setShowDeleteModal(false);
    // Navigate back to group
    navigate(`/offspring/${offspring.groupId}`);
    showToast("Offspring deleted permanently", "success");
  } catch (err: any) {
    if (err.status === 409 && err.data?.blockers) {
      // Show blocked modal
      setDeleteBlockers(err.data.blockers);
      setShowDeleteModal(false);
      setShowBlockedModal(true);
    } else {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  }
};
```

Add modals to render:

```tsx
{/* Add at end of component, before closing tag */}
{showDeleteModal && (
  <OffspringDeleteModal
    offspring={offspring}
    onArchive={handleArchive}
    onDelete={handleDelete}
    onCancel={() => setShowDeleteModal(false)}
  />
)}

{showArchiveModal && (
  <OffspringArchiveModal
    offspring={offspring}
    onArchive={handleArchive}
    onCancel={() => setShowArchiveModal(false)}
  />
)}

{showBlockedModal && deleteBlockers && (
  <OffspringDeleteBlockedModal
    blockers={deleteBlockers}
    onArchive={() => {
      setShowBlockedModal(false);
      setShowArchiveModal(true);
    }}
    onClose={() => setShowBlockedModal(false)}
  />
)}
```

---

## 📋 Testing Checklist

### Manual Testing

- [ ] Navigate to individual offspring detail page
- [ ] Click "Delete Offspring" button
- [ ] Verify Step 1 modal appears with archive suggestion
- [ ] Click "Archive Offspring" → verify archive modal appears
- [ ] Archive offspring with reason → verify success
- [ ] Verify archived badge appears
- [ ] Click "Restore" → verify restoration works
- [ ] Click "Delete Permanently" from archived state
- [ ] Verify Step 2 educational warning appears
- [ ] Click "Yes, Delete" → verify Step 3 phrase confirmation appears
- [ ] Type incorrect text → verify button remains disabled
- [ ] Type correct collar/name → verify button enables
- [ ] Click "Delete Permanently" → verify deletion succeeds
- [ ] Verify redirect to offspring group page
- [ ] Verify success toast appears

### Blocked Deletion Testing

- [ ] Create offspring with assigned buyer
- [ ] Try to delete → verify blocked modal appears
- [ ] Verify specific blockers listed
- [ ] Click "Archive Instead" → verify archive modal appears
- [ ] Complete archiving → verify success

### Edge Cases

- [ ] Offspring with no collar (uses name)
- [ ] Offspring with no name or collar (uses ID)
- [ ] Network errors during deletion
- [ ] Multiple rapid delete clicks (loading state)
- [ ] Cancel at each step of flow
- [ ] Back button navigation through steps

---

## 🎯 Success Criteria

- [ ] Breeders can delete accidental offspring records
- [ ] Archive is presented as first/recommended option
- [ ] Users see 3 distinct warning steps before deletion
- [ ] Final step requires typing exact collar/name
- [ ] Blocked deletions show clear explanations
- [ ] Archive functionality works for individuals
- [ ] Restore functionality works for archived offspring
- [ ] All edge cases handled gracefully
- [ ] Success/error feedback provided via toasts

---

## 📊 Implementation Effort

| Task | Effort | Priority |
|------|--------|----------|
| Backend: Add archive/restore endpoints | 1 hour | HIGH |
| Backend: Schema migration for archive fields | 30 min | HIGH |
| Frontend: API method additions | 15 min | HIGH |
| Frontend: Delete button in detail view | 30 min | HIGH |
| Frontend: OffspringDeleteModal component | 2 hours | HIGH |
| Frontend: OffspringDeleteBlockedModal component | 1 hour | HIGH |
| Frontend: OffspringArchiveModal component | 1 hour | HIGH |
| Frontend: Integration and handlers | 1 hour | HIGH |
| Testing: Manual test cases | 2 hours | HIGH |
| Testing: E2E tests | 2 hours | MEDIUM |
| Documentation updates | 30 min | LOW |
| **Total** | **~12 hours** | - |

---

## 🚀 Deployment Checklist

- [ ] Run database migration for archive fields
- [ ] Deploy backend API changes
- [ ] Deploy frontend changes
- [ ] Test in staging environment
- [ ] Document new functionality for users
- [ ] Update breeder onboarding guide
- [ ] Monitor for errors in first week

---

**Status:** 🎯 Ready for Implementation
**Next Step:** Start with backend archive/restore endpoints and schema migration
**Owner:** Development Team
**Date:** January 15, 2026

// File: packages/ui/src/components/BreedSelect/CustomBreedDialog.tsx
import * as React from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import { BreedSelect } from "./BreedSelect";
import type { BreedHit } from "../../utils";

type Species = "DOG" | "CAT" | "HORSE";

function toUiSpecies(s: Species): "Dog" | "Cat" | "Horse" {
  return s === "DOG" ? "Dog" : s === "CAT" ? "Cat" : "Horse";
}

function safeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

type IngredientRow = {
  id: string;
  pick: BreedHit | null;      // canonical breed
  percent: number | "";       // 0..100 or empty while editing
};

export type CustomBreedDialogProps = {
  open: boolean;
  onClose: () => void;
  api: {
    breeds: {
      /** tenant-scoped now; organizationId ignored */
      customCreate: (payload: { species: Species; name: string; organizationId?: number }) => Promise<any>;
      /** optional – will be called if provided and recipe validates */
      putRecipe?: (customBreedId: number, body: {
        ingredients: Array<{ canonicalBreedId: number; percentage?: number | null }>
      }) => Promise<any>;
    };
  };
  /** @deprecated tenant owns breeds; kept for backward compat, ignored */
  organizationId?: number;
  species: Species;
  initialName?: string;
  onCreated?: (created: { id: number; name: string; species: Species }) => void;

  /** Optional org/tenant scope passed through to BreedSelect if your selector supports it */
  orgId?: number | null;
};

export function CustomBreedDialog({
  open,
  onClose,
  api,
  species,
  initialName = "",
  onCreated,
  orgId,
}: CustomBreedDialogProps) {
  const [name, setName] = React.useState(initialName);
  const [rows, setRows] = React.useState<IngredientRow[]>([{ id: safeId(), pick: null, percent: "" }]);
  const [working, setWorking] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(initialName);
    setRows([{ id: safeId(), pick: null, percent: "" }]);
    setErr(null);
    setWorking(false);
  }, [open, initialName]);

  const uiSpecies = toUiSpecies(species);
  const total = rows.reduce((sum, r) => sum + (typeof r.percent === "number" ? r.percent : 0), 0);
  const hasEmpty = rows.some(r => r.pick == null || r.percent === "");
  const hasDupes = React.useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.pick) continue;
      const key = String((r.pick as any)?.canonicalBreedId ?? (r.pick as any)?.id ?? (r.pick as any)?.name).toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }, [rows]);

  const recipeValid = rows.length > 0 && !hasEmpty && !hasDupes && total === 100;
  const nameOk = name.trim().length > 1;

  function clampPercent(v: any): number | "" {
    if (v === "" || v == null) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  async function handleSave() {
    if (!nameOk || working) return;
    setWorking(true);
    setErr(null);
    try {
      // 1) Create the custom breed (tenant-scoped)
      const created = await api.breeds.customCreate({
        species,
        name: name.trim(),
      });

      // 2) Post recipe if valid & endpoint exists
      if (recipeValid && typeof api.breeds.putRecipe === "function") {
        const ingredients = rows
          .map(r => ({
            canonicalBreedId: (r.pick as any)?.canonicalBreedId ?? null,
            percentage: typeof r.percent === "number" ? r.percent : null,
          }))
          .filter(x => Number.isFinite(x.canonicalBreedId) && x.canonicalBreedId !== null) as Array<{
            canonicalBreedId: number; percentage: number | null;
          }>;

        if (ingredients.length) {
          try {
            await api.breeds.putRecipe!(created.id, { ingredients });
          } catch {
            // Non-fatal if recipe endpoint isn't ready
          }
        }
      }

      onCreated?.({ id: created.id, name: created.name, species: created.species as Species });
      onClose();
    } catch (e: any) {
      const msg =
        e?.data?.error === "duplicate_breed"
          ? "A custom breed with this name already exists."
          : e?.message || "Failed to create custom breed";
      setErr(msg);
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  // Self-contained overlay (backdrop + centered card).
  return (
    <div className="fixed inset-0 z-[1200] pointer-events-none" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={() => !working && onClose()}
      />

      {/* Card */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 sm:pt-24">
        <div className="pointer-events-auto relative z-10 w-[640px] max-w-[95vw] rounded-xl border border-hairline bg-surface shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <div className="text-base font-semibold">Create custom breed</div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={working}>✕</Button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <div className="text-sm text-secondary">Species: {uiSpecies}</div>

            <div>
              <div className="text-xs text-secondary mb-1">Custom breed name *</div>
              <Input
                value={name}
                onChange={(e) => setName((e.currentTarget as HTMLInputElement).value)}
                placeholder="Australian Mountain Doodle"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Recipe (optional)</div>
              <div className="text-xs text-secondary">
                Add one or more canonical breeds and assign percentages. Total must equal 100%.
              </div>

              {rows.map((row) => (
                <div key={row.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <BreedSelect
                      orgId={orgId ?? undefined as any}
                      species={uiSpecies}
                      value={row.pick as any}
                      onChange={(hit: BreedHit | null) =>
                        setRows((list) => list.map((r) => (r.id === row.id ? { ...r, pick: hit } : r)))
                      }
                      placeholder="Search canonical breed…"
                    />
                  </div>

                  {/* % of mix on the SAME row; hint moved INSIDE the field as placeholder */}
                  <div className="w-24">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={row.percent}
                      placeholder="% of mix"
                      onChange={(e) => {
                        const next = clampPercent((e.currentTarget as HTMLInputElement).value);
                        setRows((list) => list.map((r) => (r.id === row.id ? { ...r, percent: next } : r)));
                      }}
                    />
                  </div>

                  {/* Trash can icon button for remove */}
                  <Button
                    variant="ghost"
                    onClick={() => setRows((list) => list.filter((r) => r.id !== row.id))}
                    disabled={rows.length <= 1 || working}
                    title="Remove row"
                    aria-label="Remove row"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </Button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRows((list) => [...list, { id: safeId(), pick: null, percent: "" }])}
                  disabled={working}
                >
                  + Add breed
                </Button>
                <div className="text-sm">
                  Total:&nbsp;
                  <span className={total === 100 ? "text-green-600" : "text-red-600"}>{total}%</span>
                </div>
              </div>

              {hasDupes && <div className="text-xs text-red-600">Duplicate breeds in the recipe.</div>}
              {hasEmpty && <div className="text-xs text-red-600">Fill all rows (breed and %).</div>}
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-hairline flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={working}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={
                working ||
                !nameOk ||
                // if any row has a pick, enforce full recipe validity; otherwise allow empty recipe
                (rows.some(r => r.pick) && !recipeValid)
              }
            >
              {working ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

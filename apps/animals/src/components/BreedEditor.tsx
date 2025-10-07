// apps/animals/src/components/BreedEditor.tsx
import * as React from "react";
import { createPortal } from "react-dom";

/* ───────────── overlay host ───────────── */
function getOverlayRoot(): HTMLElement {
    let el = document.getElementById("bhq-top-layer") as HTMLElement | null;
    if (!el) {
        el = document.createElement("div");
        el.id = "bhq-top-layer";
        Object.assign(el.style, {
            position: "fixed",
            inset: "0",
            zIndex: "2147483647",
            pointerEvents: "none",
        });
        document.body.appendChild(el);
    }
    return el;
}
function setOverlayHostInteractive(enabled: boolean) {
    const el = getOverlayRoot();
    el.style.pointerEvents = enabled ? "auto" : "none";
}

/* ───────────── types ───────────── */
type SpeciesUI = "Dog" | "Cat" | "Horse";
type SpeciesAPI = "DOG" | "CAT" | "HORSE";

type BreedSnapshot = {
    animalId: number | string;
    species: SpeciesUI;
    primaryBreedId: string | number | null;
    primaryBreedName: string | null;
    canonicalMix: { breedId: string | number; name: string; percentage: number }[];
    customMix: { id: string; name: string; percentage: number }[];
};

type BreedOption = { id: string; name: string; kind: "canonical" | "custom" };
type MixRow = { opt: BreedOption | null; percentage: number };

type Api = {
    breeds: {
        search: (p: { species: SpeciesAPI; q?: string; limit?: number }) => Promise<any[]>;
    };
    animals: {
        getBreeds: (animalId: string | number) => Promise<BreedSnapshot>;
        putBreeds: (
            animalId: string | number,
            body: {
                species: SpeciesAPI;
                primaryBreedId: string | number | null;
                canonical: { breedId: string | number; percentage: number }[];
                custom: { id: string; percentage: number }[];
            }
        ) => Promise<BreedSnapshot>;
    };
};

function toAPI(s: SpeciesUI): SpeciesAPI {
    return s.toUpperCase() as SpeciesAPI;
}

/* ───────────── Combobox ───────────── */
function Combobox(props: {
    value: BreedOption | null;
    onChange: (opt: BreedOption | null) => void;
    load: (q: string) => Promise<BreedOption[]>;
    placeholder?: string;
    disabled?: boolean;
}) {
    const { value, onChange, placeholder = "Start typing (2+ letters) or click ▾", disabled } = props;
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [options, setOptions] = React.useState<BreedOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hi, setHi] = React.useState(-1);
    const [menuPos, setMenuPos] = React.useState<{ left: number; top: number; width: number } | null>(null);
    const [errorText, setErrorText] = React.useState<string | null>(null);
    const shown = query !== "" ? query : (value?.name ?? "");

    React.useEffect(() => {
        if (!open) return;
        let alive = true;
        setLoading(true);
        setErrorText(null);
        props
            .load(query)
            .then((rows) => {
                if (!alive) return;
                const safe = Array.isArray(rows) ? rows : [];
                setOptions(safe);
                setErrorText(null);
            })
            .catch(() => {
                if (!alive) return;
                setOptions([]);
                setErrorText("Server error. Try typing to search.");
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
                setHi(-1);
            });
        return () => {
            alive = false;
        };
    }, [open, query, props]);

    React.useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const recalc = React.useCallback(() => {
        if (!wrapRef.current) return;
        const r = wrapRef.current.getBoundingClientRect();
        setMenuPos({ left: r.left, top: r.bottom + 8, width: r.width });
    }, []);
    React.useEffect(() => {
        if (!open) return;
        recalc();
        const onWin = () => recalc();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, true);
        return () => {
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin, true);
        };
    }, [open, recalc]);

    React.useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    function choose(idx: number) {
        const opt = options[idx];
        if (!opt) return;
        onChange(opt);
        setOpen(false);
        setQuery("");
    }

    const menu =
        open && menuPos
            ? createPortal(
                <div
                    role="listbox"
                    className="rounded-md border border-hairline bg-surface shadow-2xl overflow-hidden"
                    style={{
                        position: "fixed",
                        left: Math.max(8, Math.min(menuPos.left!, window.innerWidth - menuPos.width! - 8)),
                        top: Math.min(menuPos.top!, window.innerHeight - 56),
                        width: menuPos.width!,
                        zIndex: 2147483647,
                        pointerEvents: "auto",
                    }}
                >
                    <div className="py-1" style={{ maxHeight: 400, overflow: "auto" }}>
                        {loading && <div className="px-4 py-3 text-base text-secondary">Loading…</div>}
                        {!loading && errorText && <div className="px-4 py-3 text-base text-red-500">{errorText}</div>}
                        {!loading && !errorText && options.length === 0 && (
                            <div className="px-4 py-3 text-base text-secondary">Start typing at least 2 letters.</div>
                        )}
                        {!loading &&
                            !errorText &&
                            options.map((opt, idx) => (
                                <button
                                    key={`${opt.kind}:${opt.id}`}
                                    className={
                                        "w-full text-left text-base px-4 py-3 flex items-center justify-between hover:bg-surface-strong " +
                                        (hi === idx ? "bg-surface-strong" : "")
                                    }
                                    onMouseEnter={() => setHi(idx)}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        choose(idx);
                                    }}
                                >
                                    <span className="text-primary">{opt.name}</span>
                                    {opt.kind === "custom" && (
                                        <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-surface-strong border border-hairline">
                                            Custom
                                        </span>
                                    )}
                                </button>
                            ))}
                    </div>
                </div>,
                getOverlayRoot()
            )
            : null;

    return (
        <div className="relative" ref={wrapRef}>
            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    disabled={disabled}
                    className="h-12 w-full rounded-md bg-surface border border-hairline px-4 text-base text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--hairline))]"
                    placeholder={placeholder}
                    value={shown}
                    onChange={(e) => {
                        const next = e.target.value;
                        setQuery(next);
                        if (!open && next.trim().length >= 2) {
                            setOpen(true);
                            setTimeout(() => inputRef.current?.focus(), 0);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (!open) {
                            if (e.key === "ArrowDown" || e.key === "Enter") {
                                e.preventDefault();
                                setOpen(true);
                                setTimeout(() => inputRef.current?.focus(), 0);
                            }
                            return;
                        }
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHi((h) => Math.min(h + 1, options.length - 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHi((h) => Math.max(h - 1, 0));
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (hi >= 0) choose(hi);
                        } else if (e.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                />
                <button
                    type="button"
                    className="shrink-0 h-12 w-12 grid place-items-center rounded-md border border-hairline hover:bg-surface-strong text-primary"
                    onClick={() => {
                        setOpen((o) => {
                            const next = !o;
                            if (next) setTimeout(() => inputRef.current?.focus(), 0);
                            return next;
                        });
                    }}
                    disabled={disabled}
                    aria-label="Toggle"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="pointer-events-none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            {menu}
        </div>
    );
}

/* ───────────── Summary field + overlay editor ───────────── */
export function BreedField(props: {
    api: Api;
    animalId: string | number;
    speciesUi: SpeciesUI;
    /** Called after a successful save so the parent can refresh UI */
    onChanged?: (primaryName: string | null, snapshot: BreedSnapshot) => void;
}) {
    const { api, animalId, speciesUi } = props;

    const [snapshot, setSnapshot] = React.useState<BreedSnapshot | null>(null);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // 🔹 PREFETCH the canonical snapshot as soon as the field mounts or animalId changes.
    React.useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        api.animals
            .getBreeds(animalId)
            .then((s) => {
                if (!alive) return;
                setSnapshot(s);
            })
            .catch((_e) => {
                if (!alive) return;
                // keep summary as "Unset" if this fails; editor still has Retry
                setError(null);
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [api.animals, animalId]);

    const summary = React.useMemo(() => {
        const s = snapshot;
        if (!s) return "Unset";
        const parts = [
            ...(s.canonicalMix || []).map((x) => `${x.name} ${x.percentage}%`),
            ...(s.customMix || []).map((x) => `${x.name} ${x.percentage}%`),
        ];
        if (parts.length === 0 && s.primaryBreedName) return s.primaryBreedName;
        if (parts.length === 0) return "Unset";
        return parts.join(" · ");
    }, [snapshot]);

    async function openEditor() {
        // Open immediately; if we already have a snapshot, use it. Otherwise fetch once.
        setOpen(true);
        if (snapshot) {
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const s = await api.animals.getBreeds(animalId);
            setSnapshot(s);
        } catch (e: any) {
            setError(e?.message || "Failed to load breed data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-1">
            <div className="text-xs text-secondary">Breed</div>
            <div className="flex items-center gap-2">
                <div className="text-sm text-primary">
                    {summary}
                </div>
                <button
                    type="button"
                    onClick={openEditor}
                    className="text-xs px-2 py-1 rounded border border-hairline hover:bg-surface-strong"
                >
                    Edit
                </button>
            </div>

            {open && (
                <BreedEditorOverlay
                    api={api}
                    // pass a real number or null (no "new")
                    animalId={Number.isFinite(Number(animalId)) && Number(animalId) > 0 ? Number(animalId) : null}
                    speciesUi={speciesUi}
                    loading={loading}
                    error={error}
                    initial={snapshot}
                    onClose={() => setOpen(false)}
                    onSaved={(res) => {
                        setSnapshot(res);
                        setOpen(false);
                        // Notify parent so it can update table/drawer immediately
                        props.onChanged?.(res.primaryBreedName ?? null, res);
                    }}
                    onRetry={openEditor}
                />
            )}
        </div>
    );
}

/* ───────────── Form control: Pure picker + Advanced (Mixed) ───────────── */
export function BreedFormControl(props: {
    api: Api;
    speciesUi: SpeciesUI;
    /** When editing, pass the animal id so we can open Advanced with the server snapshot; omit during Create */
    animalId?: string | number | null;
    /** Current display name in the form (optional) */
    valueName?: string | null;
    /** Called when a pure breed is selected in the combobox */
    onPureSelected: (sel: { canonicalBreedId?: string; customBreedId?: string; name: string }) => void;
    /** Called after the Advanced editor saves; returns the server snapshot */
    onMixedSaved: (snapshot: BreedSnapshot) => void;
}) {
    const { api, speciesUi, animalId } = props;
    const SPECIES = toAPI(speciesUi);

    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [snapshot, setSnapshot] = React.useState<BreedSnapshot | null>(null);

    // loader used by the combobox (pure)
    const loadOptions = React.useCallback(
        async (q: string) => {
            const typed = (q ?? "").trim();
            const result = await api.breeds.search({
                species: SPECIES,
                q: typed.length >= 2 ? typed : undefined,
                limit: 200,
            });
            return (result || [])
                .map((b: any) => {
                    const id = b?.id ?? b?.breedId ?? b?.code ?? b?.uuid ?? b?._id ?? b?.value ?? null;
                    const name = b?.name ?? b?.displayName ?? b?.label ?? b?.breed ?? b?.title ?? "";
                    return id && name ? { id: String(id), name: String(name), kind: "canonical" as const } : null;
                })
                .filter(Boolean) as BreedOption[];
        },
        [SPECIES, api.breeds]
    );

    // Pure selection handler -> inform parent; clear any mixed snapshot
    const handlePurePick = React.useCallback(
        (opt: BreedOption | null) => {
            if (!opt) return;
            if (opt.kind === "canonical") {
                props.onPureSelected({ canonicalBreedId: String(opt.id), name: opt.name });
            } else {
                props.onPureSelected({ customBreedId: String(opt.id), name: opt.name });
            }
            // If a user picks pure after they had done mixed, discard mixed
            setSnapshot(null);
        },
        [props]
    );

    // Open Advanced (Mixed) editor
    // Open Advanced (Mixed) editor
    async function openAdvanced() {
        setOpen(true);
        setLoading(true);
        setError(null);

        try {
            const idNum = Number(animalId);
            const hasValidId = Number.isFinite(idNum) && idNum > 0;

            if (hasValidId) {
                // Editing: fetch snapshot from server
                const s = await api.animals.getBreeds(idNum);
                setSnapshot(s);
            } else {
                // Creating...
                const name = props.valueName ? String(props.valueName) : "";
                const s: BreedSnapshot = {
                    animalId: "new",
                    species: speciesUi,
                    primaryBreedId: null,
                    primaryBreedName: name || null,
                    canonicalMix: name ? [{ breedId: "unknown", name, percentage: 100 }] : [],
                    customMix: [],
                };
                setSnapshot(s);
            }
        } catch (e: any) {
            setError(e?.message || "Failed to load breed data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-1">
            <div className="text-xs text-secondary">Breed</div>
            <div className="flex items-center gap-2">
                <div className="min-w-0 grow">
                    <Combobox
                        value={props.valueName ? { id: "current", name: props.valueName, kind: "canonical" } : null}
                        onChange={handlePurePick}
                        load={loadOptions}
                        placeholder="Type to search or add"
                    />
                </div>

                <button
                    type="button"
                    className="shrink-0 text-xs px-2 py-1 rounded border border-hairline hover:bg-surface-strong"
                    onClick={openAdvanced}
                    title="Open advanced mixed-breed editor"
                >
                    Manage
                </button>
            </div>

            {open && (
                <BreedEditorOverlay
                    api={api}
                    animalId={animalId ?? "new"}
                    speciesUi={speciesUi}
                    loading={loading}
                    error={error}
                    initial={snapshot}
                    onClose={() => setOpen(false)}
                    onSaved={(res) => {
                        setSnapshot(res);
                        setOpen(false);
                        // Tell the parent; parent will store snapshot and use it on save
                        props.onMixedSaved(res);
                    }}
                    onRetry={openAdvanced}
                />
            )}

            <div className="text-[11px] text-secondary">
                Search official and custom breeds. For mixes, tap Advanced.
            </div>
        </div>
    );
}


/* ───────────── Modal overlay that hydrates from the fetched snapshot ───────────── */
function BreedEditorOverlay(props: {
  api: Api;
  animalId: number | "new" | null;
  speciesUi: SpeciesUI;
  loading: boolean;
  error: string | null;
  initial: BreedSnapshot | null;
  onSaved: (snapshot: BreedSnapshot) => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const { api, animalId, speciesUi } = props;
  const SPECIES = toAPI(speciesUi);

  type BreedOption = { id: string; name: string; kind: "canonical" | "custom" };
  type MixRow = { opt: BreedOption | null; percentage: number };

  const [mode, setMode] = React.useState<"PURE" | "MIXED">("PURE");
  const [pureOpt, setPureOpt] = React.useState<BreedOption | null>(null);
  const [rows, setRows] = React.useState<MixRow[]>([]);

  // derive UI state from the snapshot we loaded (or synthesized)
  React.useEffect(() => {
    const s = props.initial;
    if (!s) {
      setMode("PURE");
      setPureOpt(null);
      setRows([]);
      return;
    }

    const cMix = s.canonicalMix ?? [];
    const uMix = s.customMix ?? [];
    const totalItems = cMix.length + uMix.length;

    const nextMode: "PURE" | "MIXED" = totalItems > 1 ? "MIXED" : "PURE";
    setMode(nextMode);

    // figure out a “pure” selected option if applicable
    let derivedPure: BreedOption | null = null;
    let primaryId = s.primaryBreedId ?? null;
    let primaryName = s.primaryBreedName ?? null;

    if (primaryId && !primaryName) {
      const hitCanonical = cMix.find(x => String(x.breedId) === String(primaryId));
      const hitCustom = uMix.find(x => String(x.id) === String(primaryId));
      primaryName = (hitCanonical as any)?.name ?? (hitCustom as any)?.name ?? null;
    }

    if (primaryId && primaryName) {
      const isCanonical = cMix.some(x => String(x.breedId) === String(primaryId));
      derivedPure = {
        id: String(primaryId),
        name: String(primaryName),
        kind: isCanonical ? "canonical" : "custom",
      };
    } else if (totalItems === 1) {
      const one: any = cMix[0] ?? uMix[0];
      derivedPure =
        "breedId" in one
          ? { id: String(one.breedId), name: String(one.name), kind: "canonical" }
          : { id: String(one.id), name: String(one.name), kind: "custom" };
    } else {
      derivedPure = null;
    }
    setPureOpt(derivedPure);

    // rows for MIXED mode
    const cRows: MixRow[] = cMix.map(x => ({
      opt: { id: String(x.breedId), name: String(x.name), kind: "canonical" },
      percentage: Number(x.percentage) || 0,
    }));
    const uRows: MixRow[] = uMix.map(x => ({
      opt: { id: String(x.id), name: String(x.name), kind: "custom" },
      percentage: Number(x.percentage) || 0,
    }));
    const merged = [...cRows, ...uRows];

    setRows(nextMode === "MIXED" ? (merged.length ? merged : [{ opt: null, percentage: 0 }]) : merged);
  }, [props.initial]);

  React.useEffect(() => {
    if (mode === "MIXED" && rows.length === 0) {
      setRows([{ opt: null, percentage: 0 }]);
    }
  }, [mode, rows.length]);

  // combobox loader
  const loadOptions = React.useCallback(
    async (q: string): Promise<BreedOption[]> => {
      const typed = (q ?? "").trim();
      const result = await api.breeds.search({
        species: SPECIES,
        q: typed.length >= 2 ? typed : undefined,
        limit: 200,
      });
      const list: BreedOption[] = (result || [])
        .map((b: any) => {
          const id = b?.id ?? b?.breedId ?? b?.code ?? b?.uuid ?? b?._id ?? b?.value ?? null;
          const name = b?.name ?? b?.displayName ?? b?.label ?? b?.breed ?? b?.title ?? "";
          return id && name ? { id: String(id), name: String(name), kind: "canonical" as const } : null;
        })
        .filter(Boolean) as BreedOption[];

      if (typed.length >= 2) {
        const ql = typed.toLowerCase();
        list.sort((a, b) => {
          const an = a.name.toLowerCase();
          const bn = b.name.toLowerCase();
          const ar = an.startsWith(ql) ? 0 : an.includes(ql) ? 1 : 2;
          const br = bn.startsWith(ql) ? 0 : bn.includes(ql) ? 1 : 2;
          if (ar !== br) return ar - br;
          return an.localeCompare(bn);
        });
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list;
    },
    [SPECIES, api.breeds]
  );

  // helpers
  const totalPct = rows.reduce((a, r) => a + (Number(r.percentage) || 0), 0);
  const hasDupes = React.useMemo(() => {
    const keys = rows.filter(r => r.opt).map(r => `${r.opt!.kind}:${r.opt!.id}`);
    return new Set(keys).size !== keys.length;
  }, [rows]);

  const addRow = () => setRows(r => [...r, { opt: null, percentage: 0 }]);
  const setRowOpt = (i: number, opt: BreedOption | null) =>
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], opt };
      return n;
    });
  const setRowPct = (i: number, pct: number) =>
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], percentage: Math.max(0, Math.min(100, Math.round(Number(pct) || 0))) };
      return n;
    });
  const removeRow = (i: number) =>
    setRows(r => {
      const n = [...r];
      n.splice(i, 1);
      return n;
    });

  async function handleSave() {
    if (!props.initial) return;

    const hasRealId = Number.isFinite(Number(animalId)) && Number(animalId) > 0;

    if (mode === "PURE") {
      if (!pureOpt) return;

      if (!hasRealId) {
        // Create-flow: return a local snapshot
        const snap: BreedSnapshot =
          pureOpt.kind === "canonical"
            ? {
                animalId: "new",
                species: speciesUi,
                primaryBreedId: pureOpt.id,
                primaryBreedName: pureOpt.name,
                canonicalMix: [{ breedId: pureOpt.id, name: pureOpt.name, percentage: 100 }],
                customMix: [],
              }
            : {
                animalId: "new",
                species: speciesUi,
                primaryBreedId: null,
                primaryBreedName: pureOpt.name,
                canonicalMix: [],
                customMix: [{ id: pureOpt.id, name: pureOpt.name, percentage: 100 }],
              };
        props.onSaved(snap);
        return;
      }

      const body =
        pureOpt.kind === "canonical"
          ? { species: SPECIES, primaryBreedId: pureOpt.id, canonical: [{ breedId: pureOpt.id, percentage: 100 }], custom: [] }
          : { species: SPECIES, primaryBreedId: null, canonical: [], custom: [{ id: pureOpt.id, percentage: 100 }] };

      const res = await api.animals.putBreeds(animalId!, body);
      props.onSaved(res);
      return;
    }

    // MIXED
    if (rows.length === 0 || hasDupes || totalPct > 100 || rows.some(r => !r.opt)) return;

    const primary = rows[0].opt!;
    const canonical = rows
      .filter(r => r.opt?.kind === "canonical")
      .map(r => ({ breedId: r.opt!.id, percentage: Number(r.percentage) || 0 }));
    const custom = rows
      .filter(r => r.opt?.kind === "custom")
      .map(r => ({ id: r.opt!.id, percentage: Number(r.percentage) || 0 }));

    if (!hasRealId) {
      // Create-flow: return a local snapshot; caller will PUT after create
      const primaryBreedId = primary.kind === "canonical" ? primary.id : null;
      const primaryName = rows[0]?.opt?.name ?? null;
      const snap: BreedSnapshot = {
        animalId: "new",
        species: speciesUi,
        primaryBreedId,
        primaryBreedName: primaryName,
        canonicalMix: canonical.map(c => ({
          ...c,
          name: rows.find(r => r.opt?.id === c.breedId)?.opt?.name || "",
        })),
        customMix: custom.map(u => ({
          ...u,
          name: rows.find(r => r.opt?.id === u.id)?.opt?.name || "",
        })),
      };
      props.onSaved(snap);
      return;
    }

    const res = await api.animals.putBreeds(animalId!, {
      species: SPECIES,
      primaryBreedId: primary.kind === "canonical" ? primary.id : null,
      canonical,
      custom,
    });
    props.onSaved(res);
  }

  // overlay UI
  const overlay = (
    <div
      className="fixed inset-0 z-[2147483647]"
      style={{ pointerEvents: "auto" }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
        <div
          className="pointer-events-auto rounded-2xl border border-hairline bg-surface
            bg-gradient-to-b from-[hsl(var(--glass))/65] to-[hsl(var(--glass-strong))/85]
            shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ marginTop: "10vh", width: "clamp(480px, 88vw, 540px)", maxHeight: "min(86vh, 760px)" }}
          data-bhq="breed-editor"
        >
          <div className="sticky top-0 z-10 px-6 py-4 bg-surface bg-gradient-to-b from-[hsl(var(--glass))/35] to-[hsl(var(--glass-strong))/55]">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-primary">Edit Breed</div>
              <div className="flex-1" />
              <span className="text-xs text-secondary mr-2">Species: {speciesUi}</span>
              <button
                className="text-sm px-3 py-1.5 rounded-md border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
                onClick={props.onClose}
              >
                Close
              </button>
            </div>
            <div className="mt-3 border-t border-hairline pt-4 flex items-center gap-2">
              <button
                className={
                  "px-4 h-9 rounded-md text-sm border border-hairline " +
                  (mode === "PURE" ? "bg-[hsl(var(--brand-orange))] text-black" : "text-primary hover:bg-surface-strong")
                }
                onClick={() => setMode("PURE")}
                disabled={!props.initial}
                title={!props.initial ? "Loading…" : ""}
              >
                Pure
              </button>
              <button
                className={
                  "px-4 h-9 rounded-md text-sm border border-hairline " +
                  (mode === "MIXED" ? "bg-[hsl(var(--brand-orange))] text-black" : "text-primary hover:bg-surface-strong")
                }
                onClick={() => setMode("MIXED")}
                disabled={!props.initial}
                title={!props.initial ? "Loading…" : ""}
              >
                Mixed
              </button>
            </div>
          </div>

          <div className="px-6 py-5 overflow-auto" style={{ maxHeight: "calc(86vh - 116px)", minHeight: 240 }}>
            {props.loading && <div className="text-sm text-secondary">Loading…</div>}

            {!props.loading && props.error && (
              <div className="space-y-3">
                <div className="text-sm text-red-500">{props.error}</div>
                <button
                  className="text-sm px-4 py-2 rounded-md border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
                  onClick={props.onRetry}
                >
                  Retry
                </button>
              </div>
            )}

            {!props.loading && !props.error && !props.initial && (
              <div className="text-sm text-secondary">No data.</div>
            )}

            {!props.loading && !props.error && props.initial && (
              <>
                {mode === "PURE" && (
                  <div className="space-y-2">
                    <div className="text-xs text-secondary">Breed</div>
                    <Combobox value={pureOpt} onChange={setPureOpt} load={loadOptions} />
                  </div>
                )}

                {mode === "MIXED" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-secondary">Breeds and percentages</div>
                      <div className="text-xs text-secondary">
                        Total:{" "}
                        <span className={totalPct > 100 ? "text-red-500" : "text-primary"}>{totalPct}%</span>
                        {hasDupes && <span className="ml-2 text-red-500">Duplicates not allowed</span>}
                      </div>
                    </div>

                    {rows.map((row, i) => (
                      <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) 72px 40px" }}>
                        <div className="min-w-0">
                          <Combobox value={row.opt} onChange={opt => setRowOpt(i, opt)} load={loadOptions} />
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            aria-label="Percent of mix"
                            title="Enter this breed’s percentage (0–100)."
                            placeholder="0–100"
                            className="w-[72px] h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary"
                            value={row.percentage}
                            onChange={e => setRowPct(i, Number(e.target.value))}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-secondary">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          aria-label="Remove"
                          title="Remove"
                          className="w-10 h-10 grid place-items-center rounded-md border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {rows.length > 0 && rows[0].opt && (
                      <div>
                        <button
                          type="button"
                          className="text-sm px-4 py-2 rounded-md border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
                          onClick={() => addRow()}
                          disabled={totalPct >= 100}
                        >
                          Add another breed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-surface border-t border-hairline">
            <button
              className="text-sm px-4 py-2 rounded-md border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              className="text-sm px-4 py-2 rounded-md bg-[hsl(var(--brand-orange))] text-black hover:opacity-90"
              onClick={handleSave}
              disabled={
                !!props.loading ||
                !props.initial ||
                (mode === "MIXED" && (totalPct > 100 || rows.length === 0 || rows.some(r => !r.opt) || hasDupes)) ||
                (mode === "PURE" && !pureOpt)
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  React.useEffect(() => {
    setOverlayHostInteractive(true);
    document.body.classList.add("bhq-blur");
    return () => {
      setOverlayHostInteractive(false);
      document.body.classList.remove("bhq-blur");
    };
  }, []);

  return createPortal(overlay, getOverlayRoot());
}

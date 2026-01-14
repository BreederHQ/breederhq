// apps/platform/src/components/WhelpingCollarsSettingsTab.tsx
// Settings tab for managing whelping collar colors and patterns

import React from "react";
import { Button, Card, SectionCard, ColorPicker, Badge } from "@bhq/ui";
import type {
  CollarSettingsConfig,
  CollarColorOption,
  CollarPattern,
} from "@bhq/api";
import {
  DEFAULT_COLLAR_SETTINGS,
  DEFAULT_COLLAR_COLORS,
  COLLAR_PATTERNS,
} from "@bhq/api";
import {
  fetchCollarSettings,
  saveCollarSettings,
  generateCollarColorId,
  clearCollarSettingsCache,
} from "@bhq/ui/utils/collarSettings";
import { resolveTenantId } from "@bhq/ui/utils/tenant";

// ============================================================================
// Types
// ============================================================================

export type WhelpingCollarsSettingsHandle = {
  save: () => Promise<void>;
};

type Props = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
};

// ============================================================================
// Helpers
// ============================================================================

async function resolveTenantIdSafe(): Promise<string | null> {
  try {
    const raw = await resolveTenantId();
    const trimmed = (raw == null ? "" : String(raw)).trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

function getPatternLabel(pattern: CollarPattern): string {
  return COLLAR_PATTERNS.find((p) => p.value === pattern)?.label ?? pattern;
}

function patternRequiresSecondColor(pattern: CollarPattern): boolean {
  return COLLAR_PATTERNS.find((p) => p.value === pattern)?.requiresSecondColor ?? false;
}

// ============================================================================
// Sub-components
// ============================================================================

function PatternBadge({ pattern }: { pattern: CollarPattern }) {
  if (pattern === "solid") return null;
  return (
    <Badge variant="neutral" className="text-xs">
      {getPatternLabel(pattern)}
    </Badge>
  );
}

function CollarSwatchPreview({ color }: { color: CollarColorOption }) {
  const { hex, hex2, pattern } = color;

  // Render pattern preview
  if (pattern === "striped" && hex2) {
    return (
      <div
        className="w-8 h-8 rounded-md border border-hairline shadow-inner flex-shrink-0 overflow-hidden"
        title={`${hex} / ${hex2}`}
        style={{
          background: `repeating-linear-gradient(45deg, ${hex}, ${hex} 3px, ${hex2} 3px, ${hex2} 6px)`,
        }}
      />
    );
  }
  if (pattern === "polka_dot" && hex2) {
    return (
      <div
        className="w-8 h-8 rounded-md border border-hairline shadow-inner flex-shrink-0 overflow-hidden"
        title={`${hex} / ${hex2}`}
        style={{
          backgroundColor: hex,
          backgroundImage: `radial-gradient(${hex2} 2px, transparent 2px)`,
          backgroundSize: "6px 6px",
        }}
      />
    );
  }
  if (pattern === "plaid" && hex2) {
    return (
      <div
        className="w-8 h-8 rounded-md border border-hairline shadow-inner flex-shrink-0 overflow-hidden"
        title={`${hex} / ${hex2}`}
        style={{
          backgroundColor: hex,
          backgroundImage: `
            linear-gradient(90deg, ${hex2}40 1px, transparent 1px),
            linear-gradient(${hex2}40 1px, transparent 1px)
          `,
          backgroundSize: "4px 4px",
        }}
      />
    );
  }
  if (pattern === "camo" && hex2) {
    // Simple camo approximation
    return (
      <div
        className="w-8 h-8 rounded-md border border-hairline shadow-inner flex-shrink-0 overflow-hidden relative"
        title={`${hex} / ${hex2}`}
        style={{ backgroundColor: hex }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 40% at 20% 30%, ${hex2} 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 70% 60%, ${hex2} 0%, transparent 50%),
              radial-gradient(ellipse 40% 60% at 40% 80%, ${hex2} 0%, transparent 50%)
            `,
          }}
        />
      </div>
    );
  }

  // Solid color
  return (
    <div
      className="w-8 h-8 rounded-md border border-hairline shadow-inner flex-shrink-0"
      style={{ backgroundColor: hex }}
      title={hex}
    />
  );
}

function CollarColorRow({
  color,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  color: CollarColorOption;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md border ${
        color.enabled ? "border-hairline bg-surface" : "border-hairline/50 bg-surface/50 opacity-60"
      }`}
    >
      {/* Color swatch */}
      <CollarSwatchPreview color={color} />

      {/* Label and pattern */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{color.label}</span>
          <PatternBadge pattern={color.pattern} />
          {color.isDefault && (
            <span className="text-xs text-secondary">(default)</span>
          )}
        </div>
        <div className="text-xs text-secondary font-mono">
          {color.hex}
          {color.hex2 && ` / ${color.hex2}`}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Move up/down */}
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Enable/disable toggle */}
        <button
          onClick={onToggle}
          className={`p-1 ${color.enabled ? "text-green-500" : "text-secondary"} hover:opacity-80`}
          title={color.enabled ? "Disable" : "Enable"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {color.enabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            )}
          </svg>
        </button>

        {/* Edit (custom only) */}
        {!color.isDefault && (
          <button onClick={onEdit} className="p-1 text-secondary hover:text-primary" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

        {/* Delete (custom only) */}
        {!color.isDefault && (
          <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-300" title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const WhelpingCollarsSettingsTab = React.forwardRef<
  WhelpingCollarsSettingsHandle,
  Props
>(function WhelpingCollarsSettingsTabImpl({ onDirty }, ref) {
  // State
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [initial, setInitial] = React.useState<CollarSettingsConfig>(DEFAULT_COLLAR_SETTINGS);
  const [form, setForm] = React.useState<CollarSettingsConfig>(DEFAULT_COLLAR_SETTINGS);

  // Add/edit color modal state
  const [showAddColor, setShowAddColor] = React.useState(false);
  const [editingColor, setEditingColor] = React.useState<CollarColorOption | null>(null);
  const [newColorLabel, setNewColorLabel] = React.useState("");
  const [newColorHex, setNewColorHex] = React.useState("#3b82f6");
  const [newColorHex2, setNewColorHex2] = React.useState("#ffffff");
  const [newColorPattern, setNewColorPattern] = React.useState<CollarPattern>("solid");

  // Dirty tracking
  const isDirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );
  React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

  // Load config on mount
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const tenantId = await resolveTenantIdSafe();
        if (!tenantId) throw new Error("Missing tenant id");
        const config = await fetchCollarSettings(tenantId);
        if (!ignore) {
          setInitial(config);
          setForm(config);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load collar settings");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Save handler
  async function saveAll() {
    setError("");
    try {
      const tenantId = await resolveTenantIdSafe();
      if (!tenantId) throw new Error("Missing tenant id");
      const saved = await saveCollarSettings(form, tenantId);
      setInitial(saved);
      setForm(saved);
      clearCollarSettingsCache();
      onDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save collar settings");
    }
  }

  React.useImperativeHandle(ref, () => ({
    async save() {
      await saveAll();
    },
  }));

  // Color management handlers
  function toggleColor(id: string) {
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    }));
  }

  function moveColor(id: string, direction: "up" | "down") {
    setForm((f) => {
      const colors = [...f.colors];
      const idx = colors.findIndex((c) => c.id === id);
      if (idx < 0) return f;

      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= colors.length) return f;

      [colors[idx], colors[newIdx]] = [colors[newIdx], colors[idx]];
      colors.forEach((c, i) => {
        c.sortOrder = i;
      });

      return { ...f, colors };
    });
  }

  function deleteColor(id: string) {
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((c) => c.id !== id),
    }));
  }

  function openAddColor() {
    setEditingColor(null);
    setNewColorLabel("");
    setNewColorHex("#3b82f6");
    setNewColorHex2("#ffffff");
    setNewColorPattern("solid");
    setShowAddColor(true);
  }

  function openEditColor(color: CollarColorOption) {
    setEditingColor(color);
    setNewColorLabel(color.label);
    setNewColorHex(color.hex);
    setNewColorHex2(color.hex2 || "#ffffff");
    setNewColorPattern(color.pattern);
    setShowAddColor(true);
  }

  function handleSaveColor() {
    if (!newColorLabel.trim()) return;

    const needsSecondColor = patternRequiresSecondColor(newColorPattern);

    if (editingColor) {
      setForm((f) => ({
        ...f,
        colors: f.colors.map((c) =>
          c.id === editingColor.id
            ? {
                ...c,
                label: newColorLabel.trim(),
                hex: newColorHex,
                hex2: needsSecondColor ? newColorHex2 : undefined,
                pattern: newColorPattern,
              }
            : c
        ),
      }));
    } else {
      const newColor: CollarColorOption = {
        id: generateCollarColorId(),
        label: newColorLabel.trim(),
        hex: newColorHex,
        hex2: needsSecondColor ? newColorHex2 : undefined,
        pattern: newColorPattern,
        isDefault: false,
        sortOrder: form.colors.length,
        enabled: true,
      };
      setForm((f) => ({
        ...f,
        colors: [...f.colors, newColor],
      }));
    }

    setShowAddColor(false);
    setEditingColor(null);
  }

  function resetToDefaults() {
    if (!window.confirm("Reset all collar colors to defaults? Custom colors will be removed.")) {
      return;
    }
    setForm(DEFAULT_COLLAR_SETTINGS);
  }

  const sortedColors = [...form.colors].sort((a, b) => a.sortOrder - b.sortOrder);
  const needsSecondColor = patternRequiresSecondColor(newColorPattern);

  if (loading) {
    return (
      <SectionCard
        title="Identification Collar Colors"
        subtitle="Configure collar color options for the Offspring module"
      >
        <div className="text-sm text-secondary">Loading...</div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <div className="text-sm font-medium text-blue-300 mb-2">Identification Collar Colors</div>
        <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
          <li>Configure collar colors for identifying offspring in litters (dogs, cats, rabbits, goats, sheep, pigs)</li>
          <li>Not applicable for horses, cattle, or chickens (typically single births or eggs)</li>
          <li>Default colors match standard whelping collar sets available from retailers</li>
          <li>Add custom colors with patterns (striped, polka dot, camo, plaid) for patterned collars</li>
          <li>Disabled colors won&apos;t appear in dropdowns but are preserved</li>
        </ul>
      </Card>

      {/* Color List */}
      <SectionCard
        title="Collar Colors"
        subtitle="Manage available collar colors for your breeding program"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={openAddColor}>
              Add Custom Color
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {sortedColors.map((color, idx) => (
            <CollarColorRow
              key={color.id}
              color={color}
              onToggle={() => toggleColor(color.id)}
              onEdit={() => openEditColor(color)}
              onDelete={() => deleteColor(color.id)}
              onMoveUp={() => moveColor(color.id, "up")}
              onMoveDown={() => moveColor(color.id, "down")}
              isFirst={idx === 0}
              isLast={idx === sortedColors.length - 1}
            />
          ))}
        </div>
      </SectionCard>

      {/* Add/Edit Color Modal */}
      {showAddColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="text-lg font-medium">
              {editingColor ? "Edit Color" : "Add Custom Color"}
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium mb-1">Color Name</label>
              <input
                type="text"
                value={newColorLabel}
                onChange={(e) => setNewColorLabel(e.target.value)}
                placeholder="e.g., Red/White Striped"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                className="w-full px-3 py-2 text-sm rounded-md border border-hairline bg-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
              />
            </div>

            {/* Pattern Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Pattern</label>
              <select
                value={newColorPattern}
                onChange={(e) => setNewColorPattern(e.target.value as CollarPattern)}
                className="w-full px-3 py-2 text-sm rounded-md border border-hairline bg-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
              >
                {COLLAR_PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Color Picker */}
            <ColorPicker
              label={needsSecondColor ? "Primary Color" : "Color"}
              value={newColorHex}
              onChange={setNewColorHex}
            />

            {/* Secondary Color Picker (for patterns) */}
            {needsSecondColor && (
              <ColorPicker
                label="Secondary Color"
                value={newColorHex2}
                onChange={setNewColorHex2}
              />
            )}

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-surface/50">
              <CollarSwatchPreview
                color={{
                  id: "preview",
                  label: newColorLabel || "Preview",
                  hex: newColorHex,
                  hex2: needsSecondColor ? newColorHex2 : undefined,
                  pattern: newColorPattern,
                  isDefault: false,
                  sortOrder: 0,
                  enabled: true,
                }}
              />
              <div>
                <div className="text-sm font-medium">{newColorLabel || "Color Name"}</div>
                <div className="text-xs text-secondary">
                  {newColorHex}
                  {needsSecondColor && ` / ${newColorHex2}`}
                  {newColorPattern !== "solid" && ` - ${getPatternLabel(newColorPattern)}`}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddColor(false);
                  setEditingColor(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveColor} disabled={!newColorLabel.trim()}>
                {editingColor ? "Save Changes" : "Add Color"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
});

export { WhelpingCollarsSettingsTab };
export default WhelpingCollarsSettingsTab;

// apps/platform/src/components/OffspringTab.tsx
// Settings tab for Offspring module configuration (whelping collars, etc.)

import React from "react";
import WhelpingCollarsSettingsTab from "./WhelpingCollarsSettingsTab";

// ============================================================================
// Types
// ============================================================================

export type OffspringHandle = {
  save: () => Promise<void>;
  goto: (sub: OffspringSubTab) => void;
};

type Props = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
};

type OffspringSubTab = "collars";

const OFFSPRING_SUBTABS: Array<{ key: OffspringSubTab; label: string }> = [
  { key: "collars", label: "Whelping Collars" },
  // Future: add more subtabs here (e.g., "defaults", "workflows")
];

// ============================================================================
// Main Component
// ============================================================================

const OffspringTab = React.forwardRef<OffspringHandle, Props>(
  function OffspringTabImpl({ onDirty }, ref) {
    const [activeSub, setActiveSub] = React.useState<OffspringSubTab>("collars");
    const collarsRef = React.useRef<{ save: () => Promise<void> }>(null);

    // Expose handle for parent to call save and navigate
    React.useImperativeHandle(ref, () => ({
      async save() {
        if (activeSub === "collars") {
          await collarsRef.current?.save();
        }
      },
      goto(sub: OffspringSubTab) {
        setActiveSub(sub);
      },
    }));

    // Sub-tab navigation
    const Tabs = (
      <div className="flex border-b border-hairline mb-4">
        {OFFSPRING_SUBTABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSub(t.key)}
            className={[
              "px-3 py-2 text-sm",
              activeSub === t.key
                ? "border-b-2 border-[hsl(var(--brand-orange))] text-primary"
                : "text-secondary",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    return (
      <div className="space-y-4">
        {Tabs}
        {activeSub === "collars" && (
          <WhelpingCollarsSettingsTab
            ref={collarsRef}
            dirty={false}
            onDirty={onDirty}
          />
        )}
      </div>
    );
  }
);

export { OffspringTab };
export default OffspringTab;

// packages/ui/src/components/Drawer/DetailsScaffold.tsx
import * as React from "react";
import { DrawerHeader } from "./DrawerParts";
import { Button } from "../Button";
import { Tabs } from "../Tabs";
import { CollapsibleTabs, CustomizeTabsModal, type CollapsibleTab, type TabPreferences } from "../Tabs/CollapsibleTabs";
import { Check } from "lucide-react";

type Tab = { key: string; label: React.ReactNode; badge?: React.ReactNode; hasAlert?: boolean };

export function DetailsScaffold({
  title,
  subtitle,
  mode,
  onEdit,
  onCancel,
  onSave,
  saving,
  tabs,
  activeTab,
  onTabChange,
  rightActions,
  tabsRightContent,
  children,
  onClose,
  hasPendingChanges,
  hideCloseButton,
  showFooterClose,
  justSaved,
  // Collapsible tabs props
  tabPreferences,
  onTabPreferencesChange,
  defaultPinnedTabs,
  useCollapsibleTabs = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  mode: "view" | "edit";
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  rightActions?: React.ReactNode;
  /** Content to render on the right side of the tabs row (e.g., overflow menu) */
  tabsRightContent?: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
  hasPendingChanges?: boolean;
  hideCloseButton?: boolean;
  /** Show a Close button in the footer instead of/in addition to header X */
  showFooterClose?: boolean;
  /** Show a brief "Saved" indicator */
  justSaved?: boolean;
  /** User's saved tab preferences (for collapsible tabs) */
  tabPreferences?: TabPreferences | null;
  /** Callback when tab preferences change (for collapsible tabs) */
  onTabPreferencesChange?: (prefs: TabPreferences) => void;
  /** Default pinned tabs if no preferences saved (for collapsible tabs) */
  defaultPinnedTabs?: string[];
  /** Enable collapsible tabs with overflow menu */
  useCollapsibleTabs?: boolean;
}) {
  const [customizeModalOpen, setCustomizeModalOpen] = React.useState(false);
  // When in edit mode without pending changes, Close should exit edit mode
  // When in edit mode with pending changes, Close should trigger the unsaved changes flow
  // When in view mode, Close should close the drawer
  const handleClose = React.useCallback(() => {
    if (mode === "edit" && !hasPendingChanges && onCancel) {
      onCancel(); // Exit edit mode
    } else {
      onClose?.(); // Close drawer (may prompt for unsaved changes)
    }
  }, [mode, hasPendingChanges, onCancel, onClose]);

  return (
    <>
      <DrawerHeader
        title={title}
        subtitle={subtitle}
        onClose={handleClose}
        hasPendingChanges={hasPendingChanges}
        hideCloseButton={hideCloseButton}
        actions={
          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="flex items-center gap-1 text-xs text-green-400 animate-in fade-in duration-200">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {rightActions /* should render <Button size="sm" variant="outline">Archive</Button> */}
            {mode === "view" ? (
              onEdit && <Button size="sm" variant="primary" onClick={onEdit}>Edit</Button>
            ) : (
              <>
                {hasPendingChanges && (
                  <>
                    <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button size="sm" variant="primary" onClick={onSave} disabled={!!saving}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        }
      />

      {/* thin divider under header */}
      <div className="hairline/90" />

      {/* Shared Tabs — pills variant with prominent styling */}
      {tabs?.length > 0 && (
        <div className="px-4 pt-3 pb-3 flex items-start justify-between border-b border-white/10">
          {useCollapsibleTabs ? (
            <CollapsibleTabs
              tabs={tabs.map(t => ({
                key: t.key,
                label: t.label,
                badge: t.badge,
                hasAlert: t.hasAlert ?? !!t.badge,
              }))}
              activeTab={activeTab}
              onTabChange={onTabChange}
              preferences={tabPreferences ?? undefined}
              onPreferencesChange={onTabPreferencesChange}
              defaultPinnedTabs={defaultPinnedTabs}
              showCustomize={!!onTabPreferencesChange}
              onCustomize={() => setCustomizeModalOpen(true)}
            />
          ) : (
            <Tabs
              items={tabs.map(t => ({
                value: t.key,
                label: (
                  <span className="uppercase tracking-wide flex items-center gap-1.5">
                    {t.label}
                    {t.badge}
                  </span>
                ),
              }))}
              value={activeTab}
              onValueChange={onTabChange}
              variant="pills"
              size="md"
              showActiveUnderline
              aria-label="Details sections"
            />
          )}
          {tabsRightContent}
        </div>
      )}

      {/* Customize tabs modal */}
      {useCollapsibleTabs && onTabPreferencesChange && (
        <CustomizeTabsModal
          open={customizeModalOpen}
          onClose={() => setCustomizeModalOpen(false)}
          tabs={tabs.map(t => ({
            key: t.key,
            label: t.label,
            badge: t.badge,
            hasAlert: t.hasAlert ?? !!t.badge,
          }))}
          preferences={tabPreferences ?? { pinnedTabs: defaultPinnedTabs || [] }}
          onSave={onTabPreferencesChange}
          defaultPinnedTabs={defaultPinnedTabs}
        />
      )}

      {/* Content area with min-height to prevent layout shifts when switching tabs */}
      <div className="p-4 space-y-4 min-h-[300px]">{children}</div>

      {/* Footer Close button */}
      {showFooterClose && onClose && (
        <div className="sticky bottom-0 p-4 pt-6 bg-gradient-to-t from-[hsl(var(--surface))] via-[hsl(var(--surface)/0.95)] to-transparent">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

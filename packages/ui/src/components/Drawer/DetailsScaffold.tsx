// packages/ui/src/components/Drawer/DetailsScaffold.tsx
import * as React from "react";
import { DrawerHeader } from "./DrawerParts";
import { Button } from "../Button";
import { Tabs } from "../Tabs";

type Tab = { key: string; label: string };

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
}) {
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
            {rightActions /* should render <Button size="sm" variant="outline">Archive</Button> */}
            {mode === "view" ? (
              <Button size="sm" variant="primary" onClick={onEdit}>Edit</Button>
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
        <div className="px-4 pt-3 pb-3 flex items-center justify-between border-b border-white/10">
          <Tabs
            items={tabs.map(t => ({ value: t.key, label: <span className="uppercase tracking-wide">{t.label}</span> }))}
            value={activeTab}
            onValueChange={onTabChange}
            variant="pills"
            size="md"
            showActiveUnderline
            aria-label="Details sections"
          />
          {tabsRightContent}
        </div>
      )}

      <div className="p-4 space-y-4">{children}</div>
    </>
  );
}

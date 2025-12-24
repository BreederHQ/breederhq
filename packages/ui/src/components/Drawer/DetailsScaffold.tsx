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
  children,
  onClose,
  hasPendingChanges,
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
  children: React.ReactNode;
  onClose?: () => void;
  hasPendingChanges?: boolean;
}) {
  return (
    <>
      <DrawerHeader
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        hasPendingChanges={hasPendingChanges}
        actions={
          <div className="flex items-center gap-2">
            {rightActions /* should render <Button size="sm" variant="outline">Archive</Button> */}
            {mode === "view" ? (
              <Button size="sm" variant="primary" onClick={onEdit}>Edit</Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button size="sm" variant="primary" onClick={onSave} disabled={!!saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* thin divider under header */}
      <div className="hairline/90" />

      {/* Shared Tabs — pills variant to match Contacts */}
      {tabs?.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <Tabs
            items={tabs.map(t => ({ value: t.key, label: t.label }))}
            value={activeTab}
            onValueChange={onTabChange}
            variant="pills"
            size="xs"
            showActiveUnderline
            aria-label="Details sections"
          />
        </div>
      )}

      <div className="p-4 space-y-4">{children}</div>
    </>
  );
}

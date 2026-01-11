// packages/ui/src/components/Drawer/DetailsHost.tsx
import * as React from "react";
import { DetailsDrawer } from "./DetailsDrawer";
import { DrawerHeader, DrawerTabs, DrawerActions, useDrawerState } from "./DrawerParts";
import { confirmDialog } from "../../utils/confirmDialog";

type ID = string | number;

export type DetailsConfig<T> = {
  idParam?: string;
  getRowId: (row: T) => ID;
  header: (row: T) => { title: React.ReactNode; subtitle?: React.ReactNode; extra?: React.ReactNode };
  tabs?: Array<{ key: string; label: string }> | ((row: T) => Array<{ key: string; label: string }>);
  width?: number | string;
  fetchRow?: (id: ID) => Promise<T> | T;
  onSave?: (id: ID, draft: Partial<T>) => Promise<void> | void;
  placement?: "right" | "center";
  align?: "center" | "top";
  customChrome?: boolean;

  render: (args: {
    row: T;
    mode: "view" | "edit";
    setMode: (m: "view" | "edit") => void;
    activeTab: string;
    setActiveTab: (k: string) => void;
    setDraft: React.Dispatch<React.SetStateAction<Partial<T>>>;
    /** Call this to trigger config.onSave with the current draft.
     * Host will switch back to "view" and clear draft on success. */
    requestSave: () => Promise<void> | void;
    /** Close handler with pending changes protection */
    close: () => void;
    /** Whether there are unsaved changes */
    hasPendingChanges: boolean;
    /** Briefly true after a successful save */
    justSaved: boolean;
  }) => React.ReactNode;
};

type Ctx<T> = { enabled: boolean; open?: (row: T) => void };
const DetailsCtx = React.createContext<Ctx<any>>({ enabled: false });
export function useTableDetails<T>() { return React.useContext(DetailsCtx) as Ctx<T>; }

export function DetailsHost<T>({
  rows,
  config,
  children,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}: {
  rows: T[];
  config: DetailsConfig<T>;
  children: React.ReactNode;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}) {
  const idParam = config.idParam ?? "id";
  const { openId, setOpenId } = useDrawerState(idParam);

  const [openRow, setOpenRow] = React.useState<T | null>(null);
  const [mode, setMode] = React.useState<"view" | "edit">("view");

  // Helper to resolve tabs - can be array or function
  const resolveTabs = React.useCallback((row: T | null): Array<{ key: string; label: string }> | undefined => {
    if (!config.tabs) return undefined;
    if (typeof config.tabs === "function") {
      return row ? config.tabs(row) : undefined;
    }
    return config.tabs;
  }, [config.tabs]);

  const getDefaultTabKey = React.useCallback((row: T | null): string => {
    const tabs = resolveTabs(row);
    return tabs?.[0]?.key ?? "overview";
  }, [resolveTabs]);

  const [activeTab, setActiveTab] = React.useState(getDefaultTabKey(null));
  const [draft, setDraft] = React.useState<Partial<T>>({});
  const draftRef = React.useRef<Partial<T>>({});
  const setDraftSafe = React.useCallback((next: React.SetStateAction<Partial<T>>) => {
    if (typeof next === "function") {
      const resolved = (next as (p: Partial<T>) => Partial<T>)(draftRef.current);
      draftRef.current = resolved;
      setDraft(resolved);
      return;
    }
    draftRef.current = next;
    setDraft(next);
  }, []);
  React.useEffect(() => { draftRef.current = draft; }, [draft]);

  // Track whether there are pending unsaved changes
  const hasPendingChanges = Object.keys(draft).length > 0;

  // Track brief "just saved" indicator
  const [justSaved, setJustSaved] = React.useState(false);

  const open = React.useCallback((row: T) => {
    const id = config.getRowId(row);
    setOpenId(String(id));
  }, [config, setOpenId]);

  const openIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (openId == null) {
      openIdRef.current = null;
      setOpenRow(null);
      return;
    }
    const idStr = String(openId);
    const local = rows.find(r => String(config.getRowId(r)) === idStr) || null;
    const isNewOpen = openIdRef.current !== idStr;
    openIdRef.current = idStr;

    if (isNewOpen && config.fetchRow) {
      // Only fetch from API when opening a new row, not on rows updates
      // This prevents stale API data from overwriting fresh local data
      setOpenRow(local as any);
      Promise.resolve(config.fetchRow(idStr as any)).then(setOpenRow);
    } else {
      // For existing open row, just use the local data from rows array
      // This ensures updates via onPlanUpdated are reflected immediately
      setOpenRow(local);
    }
    if (isNewOpen) {
      setMode("view");
      setDraftSafe({});
      setActiveTab(getDefaultTabKey(local));
    }
  }, [openId, rows, config, setDraftSafe, getDefaultTabKey]);

  const requestSave = React.useCallback(async () => {
    if (!config.onSave || !openRow) return;
    await config.onSave(config.getRowId(openRow), draftRef.current);
    // Only auto-switch to view mode for built-in chrome
    // Custom chrome components manage their own mode
    if (!config.customChrome) {
      setMode("view");
    }
    setDraftSafe({});
    // Show brief "Saved" indicator
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, [config, openRow]);

  const handleClose = React.useCallback(async () => {
    // If there are pending changes, show confirmation dialog
    if (hasPendingChanges) {
      const confirmed = await confirmDialog({
        title: "Unsaved changes",
        message: "You have unsaved changes. Discard and close?",
        confirmText: "Discard",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!confirmed) return; // User cancelled, keep drawer open
    }
    // Either no pending changes or user confirmed discard
    setOpenId(null);
  }, [hasPendingChanges, setOpenId]);

  const headerInfo = openRow ? config.header(openRow) : { title: "Details" };

  return (
    <DetailsCtx.Provider value={{ enabled: true, open }}>
      {children}

      {openRow && (
        <DetailsDrawer
          title={headerInfo.title}
          onClose={handleClose}
          onBackdropClick={closeOnOutsideClick ? handleClose : undefined}
          onEscapeKey={closeOnEscape ? handleClose : undefined}
          width={config.width ?? 720}
          placement={config.placement ?? "right"}
          align={config.align ?? "center"}
          hasPendingChanges={hasPendingChanges}
          isEditing={mode === "edit"}
        >
          {/* Built-in chrome (default) */}
          {!config.customChrome && (
            <>
              <DrawerHeader
                title={headerInfo.title}
                subtitle={headerInfo.subtitle}
                onClose={handleClose}
                hasPendingChanges={hasPendingChanges}
                actions={config.onSave ? (
                  <DrawerActions
                    mode={mode}
                    onEdit={() => setMode("edit")}
                    onCancel={() => { setMode("view"); setDraftSafe({}); }}
                    onSave={requestSave}
                  />
                ) : undefined}
              />
              {resolveTabs(openRow) && (
                <div className="px-4 pt-3">
                  <DrawerTabs tabs={resolveTabs(openRow)!} active={activeTab} onChange={setActiveTab} />
                </div>
              )}
            </>
          )}

          {config.render({
            row: openRow,
            mode,
            setMode,
            activeTab,
            setActiveTab,
            setDraft: setDraftSafe,
            requestSave,
            close: handleClose,
            hasPendingChanges,
            justSaved,
          })}
        </DetailsDrawer>
      )}
    </DetailsCtx.Provider>
  );
}

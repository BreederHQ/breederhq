// packages/ui/src/components/Drawer/DetailsHost.tsx
import * as React from "react";
import { DetailsDrawer } from "./DetailsDrawer";
import { DrawerHeader, DrawerTabs, DrawerActions, useDrawerState } from "./DrawerParts";

type ID = string | number;

export type DetailsConfig<T> = {
  idParam?: string;
  getRowId: (row: T) => ID;
  header: (row: T) => { title: React.ReactNode; subtitle?: React.ReactNode };
  tabs?: Array<{ key: string; label: string }>;
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
  }) => React.ReactNode;
};

type Ctx<T> = { enabled: boolean; open?: (row: T) => void };
const DetailsCtx = React.createContext<Ctx<any>>({ enabled: false });
export function useTableDetails<T>() { return React.useContext(DetailsCtx) as Ctx<T>; }

export function DetailsHost<T>({
  rows,
  config,
  children,
}: {
  rows: T[];
  config: DetailsConfig<T>;
  children: React.ReactNode;
}) {
  const idParam = config.idParam ?? "id";
  const { openId, setOpenId } = useDrawerState(idParam);

  const [openRow, setOpenRow] = React.useState<T | null>(null);
  const [mode, setMode] = React.useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = React.useState(config.tabs?.[0]?.key ?? "overview");
  const [draft, setDraft] = React.useState<Partial<T>>({});
  const draftRef = React.useRef<Partial<T>>({});
  React.useEffect(() => { draftRef.current = draft; }, [draft]);

  const open = React.useCallback((row: T) => {
    const id = config.getRowId(row);
    setOpenId(String(id));
  }, [config, setOpenId]);

  React.useEffect(() => {
    if (openId == null) { setOpenRow(null); return; }
    const idStr = String(openId);
    const local = rows.find(r => String(config.getRowId(r)) === idStr) || null;

    if (config.fetchRow) {
      // Allow a brief undefined to show a skeleton if you want
      setOpenRow(local as any);
      Promise.resolve(config.fetchRow(idStr as any)).then(setOpenRow);
    } else {
      setOpenRow(local);
    }
    setMode("view");
    setDraft({});
    setActiveTab(config.tabs?.[0]?.key ?? "overview");
  }, [openId, rows, config]);

  const requestSave = React.useCallback(async () => {
    if (!config.onSave || !openRow) return;
    await config.onSave(config.getRowId(openRow), draftRef.current);
    setMode("view");
    setDraft({});
  }, [config, openRow]);

  const headerInfo = openRow ? config.header(openRow) : { title: "Details" };

  return (
    <DetailsCtx.Provider value={{ enabled: true, open }}>
      {children}

      {openRow && (
        <DetailsDrawer
          title={headerInfo.title}
          onClose={() => setOpenId(null)}
          width={config.width ?? 720}
          placement={config.placement ?? "right"}
          align={config.align ?? "center"}
        >
          {/* Built-in chrome (default) */}
          {!config.customChrome && (
            <>
              <DrawerHeader
                title={headerInfo.title}
                subtitle={headerInfo.subtitle}
                actions={config.onSave ? (
                  <DrawerActions
                    mode={mode}
                    onEdit={() => setMode("edit")}
                    onCancel={() => { setMode("view"); setDraft({}); }}
                    onSave={requestSave}
                  />
                ) : undefined}
              />
              {config.tabs && (
                <div className="px-4 pt-3">
                  <DrawerTabs tabs={config.tabs} active={activeTab} onChange={setActiveTab} />
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
            setDraft,
            requestSave,
          })}
        </DetailsDrawer>
      )}
    </DetailsCtx.Provider>
  );
}

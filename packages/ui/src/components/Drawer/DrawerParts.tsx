// packages/ui/src/components/Drawer/DrawerParts.tsx
import * as React from "react";

// tiny helper
const cx = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

export function DrawerHeader({
  title, subtitle, actions, className, onClose, hasPendingChanges, hideCloseButton,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onClose?: () => void;
  hasPendingChanges?: boolean;
  hideCloseButton?: boolean;
}) {
  // NOTE: Do NOT use backdrop-blur here. backdrop-filter creates a "containing block"
  // which breaks native date picker positioning (showPicker() positions at 0,0 instead of near input)
  return (
    <header className={cx("sticky top-0 z-10 bg-surface border-b border-hairline px-4 py-3", className)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold truncate">{title}</div>
            {hasPendingChanges && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                Unsaved changes
              </span>
            )}
          </div>
          {subtitle ? <div className="text-xs text-secondary truncate">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onClose && !hideCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/5 text-secondary hover:text-primary transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5L15 15M5 15L15 5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function DrawerTabs({
  tabs, active, onChange, className,
}: {
  tabs: Array<{ key: string; label: string }>;
  active: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={cx("px-4 pt-2", className)}>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cx(
              "px-3 py-1 rounded-full text-xs border",
              active === t.key
                ? "bg-ink text-ink-contrast border-ink"
                : "bg-transparent text-ink border-hairline hover:bg-white/05"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DrawerSection({
  title, rightSlot, children, className,
}: {
  title: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("px-4 py-3", className)}>
      <div className="flex items-center mb-2">
        <h3 className="text-xs font-semibold tracking-wide text-secondary">{title}</h3>
        <div className="ml-auto">{rightSlot}</div>
      </div>
      <div className="rounded-xl border border-hairline p-3">{children}</div>
    </section>
  );
}

export function KeyValue({ label, children, className }: {
  label: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cx("grid grid-cols-[160px_1fr] gap-3 py-1.5", className)}>
      <div className="text-xs text-secondary">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function DrawerActions({
  mode, onEdit, onCancel, onSave, saving = false,
}: {
  mode: "view" | "edit";
  onEdit?: () => void; onCancel?: () => void; onSave?: () => void;
  saving?: boolean;
}) {
  return mode === "view" ? (
    <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-white/5" onClick={onEdit}>Edit</button>
  ) : (
    <div className="flex items-center gap-2">
      <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-white/5" onClick={onCancel}>Cancel</button>
      <button className="px-3 py-1.5 text-sm rounded-md border bg-ink text-ink-contrast hover:bg-ink/90" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

/** URL param + Escape helper */
export function useDrawerState(param = "id") {
  const [openId, setOpenId] = React.useState<string | null>(() => new URLSearchParams(location.search).get(param));
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  React.useEffect(() => {
    const url = new URL(location.href);
    if (openId) url.searchParams.set(param, openId);
    else url.searchParams.delete(param);
    window.history.replaceState({}, "", url.toString());
  }, [openId, param]);
  return { openId, setOpenId };
}

import * as React from "react";

// tiny helper
const cx = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

export function DrawerHeader({
  title, subtitle, actions, className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-hairline px-4 py-3", className)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold truncate">{title}</div>
          {subtitle ? <div className="text-xs text-secondary truncate">{subtitle}</div> : null}
        </div>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
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
    <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-white/05" onClick={onEdit}>Edit</button>
  ) : (
    <div className="flex items-center gap-2">
      <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-white/05" onClick={onCancel}>Cancel</button>
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

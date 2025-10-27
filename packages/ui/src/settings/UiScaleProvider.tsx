import * as React from "react";

const KEY = "bhq_ui_scale"; // persisted as a number, e.g. 1, 1.25, 1.5
const MIN = 0.75;
const MAX = 2.0;

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, Number.isFinite(n) ? n : 1));
}
function read(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return clamp(raw ? Number(raw) : 1);
  } catch {
    return 1;
  }
}
function write(n: number) {
  try {
    localStorage.setItem(KEY, String(clamp(n)));
  } catch {}
}
function apply(n: number) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--ui-scale", String(clamp(n)));
  }
}

type Ctx = { scale: number; setScale: (n: number) => void };
const UiScaleContext = React.createContext<Ctx>({ scale: 1, setScale: () => {} });

/** Call this as early as possible (e.g., in main.tsx before React mounts) */
export function initUiScaleEarly() {
  apply(read());
}

export const UiScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScaleState] = React.useState<number>(() => read());

  const setScale = React.useCallback((n: number) => {
    const v = clamp(n);
    setScaleState(v);
    write(v);
    apply(v);
  }, []);

  // Apply current value on mount
  React.useEffect(() => {
    apply(scale);
  }, [scale]);

  // Listen for external changes (multi-tab)
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue != null) {
        const v = clamp(Number(e.newValue));
        setScaleState(v);
        apply(v);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <UiScaleContext.Provider value={{ scale, setScale }}>
      {children}
    </UiScaleContext.Provider>
  );
};

export function useUiScale() {
  return React.useContext(UiScaleContext);
}

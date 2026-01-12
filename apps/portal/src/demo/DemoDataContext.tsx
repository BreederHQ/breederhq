// apps/portal/src/demo/DemoDataContext.tsx
import * as React from "react";
import { generateDemoData, isDemoMode, type DemoData } from "./portalDemoData";

interface DemoDataContextValue {
  isDemoMode: boolean;
  demoData: DemoData | null;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const DemoDataContext = React.createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = React.useState(isDemoMode());
  const [demoData, setDemoData] = React.useState<DemoData | null>(null);

  React.useEffect(() => {
    if (demoMode) {
      setDemoData(generateDemoData());
    } else {
      setDemoData(null);
    }
  }, [demoMode]);

  const enableDemoMode = React.useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("demo", "true");
    window.history.pushState({}, "", url.toString());
    setDemoMode(true);
  }, []);

  const disableDemoMode = React.useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    window.history.pushState({}, "", url.toString());
    setDemoMode(false);
  }, []);

  return (
    <DemoDataContext.Provider value={{ isDemoMode: demoMode, demoData, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = React.useContext(DemoDataContext);
  if (!context) {
    throw new Error("useDemoData must be used within DemoDataProvider");
  }
  return context;
}

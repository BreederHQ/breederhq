// apps/animals/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

/** 1) App/theme tokens (your app can set/override CSS vars here) */
import "./theme.css";

/** 2) Shared BHQ UI layers (brings the Contacts look & table header styles) */
import "@bhq/ui/styles/global.css";
import "@bhq/ui/styles/table.css";

/** 3) App-specific overrides LAST (only if needed) */
import "./index.css";

import App from "./App-Animals";

// Mount
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("No #root element found to mount Animals app.");
}
createRoot(rootEl).render(<App />);

// Also export the component for host shells that import this module directly.
export default App;

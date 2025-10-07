// apps/animals/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./theme.css";
import "./index.css";

import App from "./App-Animals";
import { bootstrapAuthAndOrg } from "./bootstrapFetch";

(async () => {
  try {
    await bootstrapAuthAndOrg();
  } catch (e) {
    console.error(e);
    // Optional: render a minimal screen that explains auth/org is not set
    // and how to set localStorage.BHQ_ORG_ID or VITE_DEV_ORG_ID in dev.
  } finally {
    const rootEl = document.getElementById("root");
    if (rootEl) {
      createRoot(rootEl).render(<App />);
    } else {
      console.error("No #root element found to mount Animals app.");
    }
  }
})();

// Also export the component for host shells that import this module directly.
export default App;

// apps/animals/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./theme.css";
import "./index.css";

import App from "./App-Animals";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  // If you’re embedding, make sure the host page has <div id="root"></div>
  console.error("No #root element found to mount Animals app.");
}

// Also export the component for host shells that import this module directly.
export default App;

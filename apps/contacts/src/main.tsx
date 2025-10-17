// apps/contacts/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./theme.css";
import "./index.css";
import AppContacts from "./App-Contacts";

const mount =
  document.getElementById("contacts-root") ||
  document.getElementById("root") ||
  (() => {
    const el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
    return el;
  })();

createRoot(mount).render(<AppContacts />);

// also export for host shells
export default AppContacts;

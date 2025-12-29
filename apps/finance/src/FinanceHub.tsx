// apps/finance/src/FinanceHub.tsx
// Finance hub - router for Finance Home, Invoices, and Expenses pages

import * as React from "react";
import { makeApi } from "./api";
import FinanceNav, { type FinanceView } from "./components/FinanceNav";
import FinanceHome from "./FinanceHome";
import InvoicesPage from "./InvoicesPage";
import ExpensesPage from "./ExpensesPage";

export default function FinanceHub() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);
  const [currentView, setCurrentView] = React.useState<FinanceView>("home");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "finance", label: "Finance" },
        })
      );
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Sub-navigation */}
      <div className="sticky top-0 z-20 bg-background border-b border-hairline px-4 pt-3">
        <FinanceNav view={currentView} onChange={setCurrentView} />
      </div>

      {/* Page Content */}
      {currentView === "home" && <FinanceHome api={api} />}
      {currentView === "invoices" && <InvoicesPage api={api} />}
      {currentView === "expenses" && <ExpensesPage api={api} />}
    </div>
  );
}

// apps/portal/src/App-Portal.tsx
import * as React from "react";
import PortalDashboard from "./pages/PortalDashboard";
import MessagesPage from "@bhq/marketing/pages/MessagesPage";
import PortalTasksPage from "./pages/PortalTasksPage";
import PortalBillingPage from "./pages/PortalBillingPage";
import PortalAgreementsPage from "./pages/PortalAgreementsPage";
import PortalDocumentsPage from "./pages/PortalDocumentsPage";
import PortalOffspringPage from "./pages/PortalOffspringPage";
import PortalWaitlistPage from "./pages/PortalWaitlistPage";
import PortalProfilePage from "./pages/PortalProfilePage";

type ViewRoute =
  | "dashboard"
  | "messages"
  | "tasks"
  | "billing"
  | "agreements"
  | "documents"
  | "offspring"
  | "waitlist"
  | "profile";

function getViewFromPath(pathname: string): ViewRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");

  if (path === "/portal/messages" || path.startsWith("/portal/messages/")) {
    return "messages";
  }
  if (path === "/portal/tasks" || path.startsWith("/portal/tasks/")) {
    return "tasks";
  }
  if (path === "/portal/billing" || path.startsWith("/portal/billing/")) {
    return "billing";
  }
  if (path === "/portal/agreements" || path.startsWith("/portal/agreements/")) {
    return "agreements";
  }
  if (path === "/portal/documents" || path.startsWith("/portal/documents/")) {
    return "documents";
  }
  if (path === "/portal/offspring" || path.startsWith("/portal/offspring/")) {
    return "offspring";
  }
  if (path === "/portal/waitlist" || path.startsWith("/portal/waitlist/")) {
    return "waitlist";
  }
  if (path === "/portal/profile" || path.startsWith("/portal/profile/")) {
    return "profile";
  }
  return "dashboard";
}

export default function AppPortal() {
  const [currentView, setCurrentView] = React.useState<ViewRoute>(() => {
    try {
      return getViewFromPath(window.location.pathname);
    } catch {
      return "dashboard";
    }
  });

  React.useEffect(() => {
    const onPop = () => {
      setCurrentView(getViewFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "portal", label: "Client Portal" },
        })
      );
    }
  }, []);

  switch (currentView) {
    case "messages":
      return <MessagesPage />;
    case "tasks":
      return <PortalTasksPage />;
    case "billing":
      return <PortalBillingPage />;
    case "agreements":
      return <PortalAgreementsPage />;
    case "documents":
      return <PortalDocumentsPage />;
    case "offspring":
      return <PortalOffspringPage />;
    case "waitlist":
      return <PortalWaitlistPage />;
    case "profile":
      return <PortalProfilePage />;
    default:
      return <PortalDashboard />;
  }
}

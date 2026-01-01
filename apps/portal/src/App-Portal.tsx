// apps/portal/src/App-Portal.tsx
import * as React from "react";
import { AuthGate } from "./components/AuthGate";
import PortalDashboard from "./pages/PortalDashboard";
import MessagesPage from "@bhq/marketing/pages/MessagesPage";
import PortalTasksPage from "./pages/PortalTasksPage";
import PortalBillingPage from "./pages/PortalBillingPage";
import PortalAgreementsPage from "./pages/PortalAgreementsPage";
import PortalDocumentsPage from "./pages/PortalDocumentsPage";
import PortalOffspringPage from "./pages/PortalOffspringPage";
import PortalWaitlistPage from "./pages/PortalWaitlistPage";
import PortalProfilePage from "./pages/PortalProfilePage";
import PortalActivatePage from "./pages/PortalActivatePage";
import PortalLoginPage from "./pages/PortalLoginPage";
import PortalNotificationsPage from "./pages/PortalNotificationsPage";

// Public routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/activate", "/logout"];

type ViewRoute =
  | "dashboard"
  | "messages"
  | "tasks"
  | "notifications"
  | "billing"
  | "agreements"
  | "documents"
  | "offspring"
  | "waitlist"
  | "profile"
  | "activate"
  | "login";

function getViewFromPath(pathname: string): ViewRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");

  // Public routes first
  if (path === "/login" || path.startsWith("/login?")) {
    return "login";
  }
  if (path === "/activate" || path.startsWith("/activate?")) {
    return "activate";
  }
  // Protected routes
  if (path === "/portal/messages" || path.startsWith("/portal/messages/")) {
    return "messages";
  }
  if (path === "/portal/tasks" || path.startsWith("/portal/tasks/")) {
    return "tasks";
  }
  if (path === "/portal/notifications" || path.startsWith("/portal/notifications/")) {
    return "notifications";
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

  // Render public routes outside AuthGate
  if (currentView === "login") {
    return <PortalLoginPage />;
  }
  if (currentView === "activate") {
    return <PortalActivatePage />;
  }

  // All other routes require authentication
  return (
    <AuthGate publicPaths={PUBLIC_PATHS}>
      {(() => {
        switch (currentView) {
          case "messages":
            return <MessagesPage />;
          case "tasks":
            return <PortalTasksPage />;
          case "notifications":
            return <PortalNotificationsPage />;
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
      })()}
    </AuthGate>
  );
}

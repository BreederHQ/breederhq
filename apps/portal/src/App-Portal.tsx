// apps/portal/src/App-Portal.tsx
import * as React from "react";
import { AuthGate } from "./components/AuthGate";
import { PortalLayout } from "./components/PortalLayout";
import PortalDashboardPage from "./pages/PortalDashboardPage";
import PortalMessagesPage from "./pages/PortalMessagesPage";
import PortalMessageThreadPage from "./pages/PortalMessageThreadPage";
import PortalTasksPageNew from "./pages/PortalTasksPageNew";
import PortalNotificationsPageNew from "./pages/PortalNotificationsPageNew";
import PortalAgreementsPageNew from "./pages/PortalAgreementsPageNew";
import PortalAgreementDetailPageNew from "./pages/PortalAgreementDetailPageNew";
import PortalDocumentsPageNew from "./pages/PortalDocumentsPageNew";
import PortalOffspringPageNew from "./pages/PortalOffspringPageNew";
import PortalOffspringDetailPageNew from "./pages/PortalOffspringDetailPageNew";
import PortalProfilePageNew from "./pages/PortalProfilePageNew";
import PortalDebugPage from "./pages/PortalDebugPage";
import PortalFinancialsPage from "./pages/PortalFinancialsPage";
import PortalLoginPageNew from "./pages/PortalLoginPageNew";
import PortalForgotPasswordPage from "./pages/PortalForgotPasswordPage";
import PortalActivatePage from "./pages/PortalActivatePage";
import PortalBlockedPage from "./pages/PortalBlockedPage";
import PortalLogoutPage from "./pages/PortalLogoutPage";
import "./design/tokens.css";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/activate", "/blocked", "/logout"];

type ViewRoute =
  | "dashboard"
  | "messages"
  | "message-thread"
  | "tasks"
  | "notifications"
  | "agreements"
  | "agreement-detail"
  | "documents"
  | "financials"
  | "offspring"
  | "offspring-detail"
  | "profile"
  | "debug"
  | "login"
  | "forgot-password"
  | "activate"
  | "blocked"
  | "logout";

function getViewFromPath(pathname: string): ViewRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");

  // Public routes
  if (path === "/login" || path.startsWith("/login?")) return "login";
  if (path === "/forgot-password" || path.startsWith("/forgot-password?")) return "forgot-password";
  if (path === "/activate" || path.startsWith("/activate?")) return "activate";
  if (path === "/blocked") return "blocked";
  if (path === "/logout") return "logout";

  // Protected routes
  if (path.startsWith("/messages/")) return "message-thread";
  if (path === "/messages") return "messages";
  if (path === "/tasks") return "tasks";
  if (path === "/notifications") return "notifications";
  if (path.startsWith("/agreements/")) return "agreement-detail";
  if (path === "/agreements") return "agreements";
  if (path === "/documents") return "documents";
  if (path.startsWith("/financials")) return "financials";
  if (path.startsWith("/offspring/")) return "offspring-detail";
  if (path === "/offspring") return "offspring";
  if (path === "/profile") return "profile";
  if (path === "/debug" || path === "/portal/debug") return "debug";

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
    return <PortalLoginPageNew />;
  }
  if (currentView === "forgot-password") {
    return <PortalForgotPasswordPage />;
  }
  if (currentView === "activate") {
    return <PortalActivatePage />;
  }
  if (currentView === "blocked") {
    return <PortalBlockedPage />;
  }
  if (currentView === "logout") {
    return <PortalLogoutPage />;
  }

  // All other routes require authentication and CLIENT role
  return (
    <AuthGate publicPaths={PUBLIC_PATHS}>
      <PortalLayout currentPath={window.location.pathname}>
        {(() => {
          switch (currentView) {
            case "messages":
              return <PortalMessagesPage />;
            case "message-thread":
              return <PortalMessageThreadPage />;
            case "tasks":
              return <PortalTasksPageNew />;
            case "notifications":
              return <PortalNotificationsPageNew />;
            case "agreements":
              return <PortalAgreementsPageNew />;
            case "agreement-detail":
              return <PortalAgreementDetailPageNew />;
            case "documents":
              return <PortalDocumentsPageNew />;
            case "financials":
              return <PortalFinancialsPage />;
            case "offspring":
              return <PortalOffspringPageNew />;
            case "offspring-detail":
              return <PortalOffspringDetailPageNew />;
            case "profile":
              return <PortalProfilePageNew />;
            case "debug":
              return <PortalDebugPage />;
            default:
              return <PortalDashboardPage />;
          }
        })()}
      </PortalLayout>
    </AuthGate>
  );
}

// apps/client-portal/src/App.tsx
// Client Portal standalone app with /p/:orgSlug/... routing
import * as React from "react";
import { OrgProvider } from "./context/OrgContext";
import { PortalShell } from "./components/PortalShell";
import { AuthGate } from "./components/AuthGate";

// Pages - reuse from @bhq/portal where possible
import PortalDashboard from "@bhq/portal/pages/PortalDashboard";
import PortalTasksPage from "@bhq/portal/pages/PortalTasksPage";
import PortalBillingPage from "@bhq/portal/pages/PortalBillingPage";
import PortalAgreementsPage from "@bhq/portal/pages/PortalAgreementsPage";
import PortalDocumentsPage from "@bhq/portal/pages/PortalDocumentsPage";
import PortalOffspringPage from "@bhq/portal/pages/PortalOffspringPage";
import PortalWaitlistPage from "@bhq/portal/pages/PortalWaitlistPage";
import PortalProfilePage from "@bhq/portal/pages/PortalProfilePage";
import PortalActivatePage from "@bhq/portal/pages/PortalActivatePage";
import PortalLoginPage from "@bhq/portal/pages/PortalLoginPage";
import MessagesPage from "@bhq/marketing/pages/MessagesPage";

// Public routes that don't require authentication
const PUBLIC_PATHS = ["login", "activate"];

type ViewRoute =
  | "dashboard"
  | "messages"
  | "tasks"
  | "billing"
  | "agreements"
  | "documents"
  | "offspring"
  | "waitlist"
  | "profile"
  | "activate"
  | "login"
  | "not_found";

interface RouteInfo {
  orgSlug: string;
  view: ViewRoute;
}

/**
 * Parse URL pathname to extract orgSlug and view.
 * Expected format: /p/:orgSlug/:view?
 */
function parseRoute(pathname: string): RouteInfo | null {
  const path = pathname.toLowerCase().replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);

  // Must start with /p/:orgSlug
  if (segments[0] !== "p" || !segments[1]) {
    return null;
  }

  const orgSlug = segments[1];
  const viewSegment = segments[2] || "dashboard";

  let view: ViewRoute;
  switch (viewSegment) {
    case "login":
      view = "login";
      break;
    case "activate":
      view = "activate";
      break;
    case "messages":
      view = "messages";
      break;
    case "tasks":
      view = "tasks";
      break;
    case "billing":
      view = "billing";
      break;
    case "agreements":
      view = "agreements";
      break;
    case "documents":
      view = "documents";
      break;
    case "offspring":
      view = "offspring";
      break;
    case "waitlist":
      view = "waitlist";
      break;
    case "profile":
      view = "profile";
      break;
    case "dashboard":
    case "":
      view = "dashboard";
      break;
    default:
      view = "not_found";
  }

  return { orgSlug, view };
}

export default function App() {
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo | null>(() => {
    try {
      return parseRoute(window.location.pathname);
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const onPop = () => {
      setRouteInfo(parseRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // No valid route - show error
  if (!routeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
            !
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Invalid Portal URL</h1>
          <p className="text-secondary text-sm">
            Portal URLs should be in the format: /p/your-organization/...
          </p>
        </div>
      </div>
    );
  }

  const { orgSlug, view } = routeInfo;
  const isPublic = PUBLIC_PATHS.includes(view);

  // Public routes render without shell or auth
  if (view === "login") {
    return (
      <OrgProvider orgSlug={orgSlug}>
        <PortalLoginPage />
      </OrgProvider>
    );
  }

  if (view === "activate") {
    return (
      <OrgProvider orgSlug={orgSlug}>
        <PortalActivatePage />
      </OrgProvider>
    );
  }

  // Protected routes require auth and shell
  return (
    <OrgProvider orgSlug={orgSlug}>
      <AuthGate orgSlug={orgSlug}>
        <PortalShell orgSlug={orgSlug}>
          {renderView(view)}
        </PortalShell>
      </AuthGate>
    </OrgProvider>
  );
}

function renderView(view: ViewRoute): React.ReactNode {
  switch (view) {
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
    case "not_found":
      return (
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-primary mb-2">Page Not Found</h1>
            <p className="text-secondary">The page you are looking for does not exist.</p>
          </div>
        </div>
      );
    default:
      return <PortalDashboard />;
  }
}

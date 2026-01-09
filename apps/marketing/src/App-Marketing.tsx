import * as React from "react";
import MarketingHomePage from "./pages/MarketingHomePage";
import MessagesPage from "./pages/MessagesPage";
import TemplatesHubPage from "./pages/TemplatesHubPage";
import AutoRepliesPage from "./pages/AutoRepliesPage";
import BusinessHoursPage from "./pages/BusinessHoursPage";
import CommunicationsHub from "./pages/CommunicationsHub";

type ViewRoute = "home" | "hub" | "messages" | "templates" | "auto-replies" | "business-hours";

function getViewFromPath(pathname: string): ViewRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");

  // Communications Hub is the main unified view
  if (path === "/marketing/hub" || path.startsWith("/marketing/hub/")) {
    return "hub";
  }
  if (path === "/marketing/messages" || path.startsWith("/marketing/messages/")) {
    return "messages";
  }
  if (path === "/marketing/templates" || path.startsWith("/marketing/templates/")) {
    return "templates";
  }
  if (path === "/marketing/auto-replies" || path.startsWith("/marketing/auto-replies/")) {
    return "auto-replies";
  }
  if (path === "/marketing/business-hours" || path.startsWith("/marketing/business-hours/")) {
    return "business-hours";
  }
  return "home";
}

export default function AppMarketing() {
  const [currentView, setCurrentView] = React.useState<ViewRoute>(() => {
    try {
      return getViewFromPath(window.location.pathname);
    } catch {
      return "home";
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
          detail: { key: "marketing", label: "Marketing" },
        })
      );
    }
  }, []);

  switch (currentView) {
    case "hub":
      return <CommunicationsHub />;
    case "messages":
      return <MessagesPage />;
    case "templates":
      return <TemplatesHubPage />;
    case "auto-replies":
      return <AutoRepliesPage />;
    case "business-hours":
      return <BusinessHoursPage />;
    default:
      return <MarketingHomePage />;
  }
}

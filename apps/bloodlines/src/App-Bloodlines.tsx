// apps/bloodlines/src/App-Bloodlines.tsx
// Bloodlines module - titles, competitions, cross-tenant pedigree exploration
import * as React from "react";
import BloodlinesHomePage from "./pages/BloodlinesHomePage";
import TitlesPage from "./pages/TitlesPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import ExplorePage from "./pages/ExplorePage";

type ViewRoute = "home" | "titles" | "competitions" | "connections" | "explore";

function getViewFromPath(pathname: string): ViewRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");

  if (path === "/bloodlines/titles" || path.startsWith("/bloodlines/titles/")) {
    return "titles";
  }
  if (path === "/bloodlines/competitions" || path.startsWith("/bloodlines/competitions/")) {
    return "competitions";
  }
  if (path === "/bloodlines/connections" || path.startsWith("/bloodlines/connections/")) {
    return "connections";
  }
  if (path === "/bloodlines/explore" || path.startsWith("/bloodlines/explore/")) {
    return "explore";
  }
  return "home";
}

export default function AppBloodlines() {
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
          detail: { key: "bloodlines", label: "Bloodlines" },
        })
      );
    }
  }, []);

  switch (currentView) {
    case "titles":
      return <TitlesPage />;
    case "competitions":
      return <CompetitionsPage />;
    case "connections":
      return <ConnectionsPage />;
    case "explore":
      return <ExplorePage />;
    default:
      return <BloodlinesHomePage />;
  }
}

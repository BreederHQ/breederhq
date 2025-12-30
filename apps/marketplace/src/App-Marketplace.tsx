// apps/marketplace/src/App-Marketplace.tsx
import * as React from "react";
import { ProgramsIndexPage } from "./pages/ProgramsIndexPage";
import { ProgramPage } from "./pages/ProgramPage";
import { OffspringGroupDetailPage } from "./pages/OffspringGroupDetailPage";
import { AnimalDetailPage } from "./pages/AnimalDetailPage";
import {
  normalizeSlug,
  buildProgramPath,
  buildOffspringGroupPath,
  buildAnimalPath,
} from "./utils/slug";

type Route =
  | { type: "home" }
  | { type: "program"; programSlug: string }
  | { type: "offspring-group"; programSlug: string; listingSlug: string }
  | { type: "animal"; programSlug: string; urlSlug: string };

type ParsedRoute = {
  route: Route;
  canonicalPath: string | null; // null means current path is canonical
};

function parseRoute(pathname: string): ParsedRoute {
  // /marketplace/programs/:programSlug/offspring-groups/:listingSlug
  const offspringMatch = pathname.match(/^\/marketplace\/programs\/([^/]+)\/offspring-groups\/([^/]+)\/?$/);
  if (offspringMatch) {
    const rawProgram = offspringMatch[1];
    const rawListing = offspringMatch[2];
    const programSlug = normalizeSlug(rawProgram) || rawProgram;
    const listingSlug = normalizeSlug(rawListing) || rawListing;
    const canonical = buildOffspringGroupPath(programSlug, listingSlug);
    const needsRedirect = pathname !== canonical;
    return {
      route: { type: "offspring-group", programSlug, listingSlug },
      canonicalPath: needsRedirect ? canonical : null,
    };
  }

  // /marketplace/programs/:programSlug/animals/:urlSlug
  const animalMatch = pathname.match(/^\/marketplace\/programs\/([^/]+)\/animals\/([^/]+)\/?$/);
  if (animalMatch) {
    const rawProgram = animalMatch[1];
    const rawAnimal = animalMatch[2];
    const programSlug = normalizeSlug(rawProgram) || rawProgram;
    const urlSlug = normalizeSlug(rawAnimal) || rawAnimal;
    const canonical = buildAnimalPath(programSlug, urlSlug);
    const needsRedirect = pathname !== canonical;
    return {
      route: { type: "animal", programSlug, urlSlug },
      canonicalPath: needsRedirect ? canonical : null,
    };
  }

  // /marketplace/programs/:programSlug
  const programMatch = pathname.match(/^\/marketplace\/programs\/([^/]+)\/?$/);
  if (programMatch) {
    const rawSlug = programMatch[1];
    const programSlug = normalizeSlug(rawSlug) || rawSlug;
    const canonical = buildProgramPath(programSlug);
    const needsRedirect = pathname !== canonical;
    return {
      route: { type: "program", programSlug },
      canonicalPath: needsRedirect ? canonical : null,
    };
  }

  // Default: home
  return { route: { type: "home" }, canonicalPath: null };
}

export default function AppMarketplace() {
  const [route, setRoute] = React.useState<Route>(() => {
    const { route, canonicalPath } = parseRoute(window.location.pathname);
    // Perform canonical redirect on initial load if needed
    if (canonicalPath) {
      window.history.replaceState(null, "", canonicalPath);
    }
    return route;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "marketplace", label: "Marketplace" },
        })
      );
    }
  }, []);

  React.useEffect(() => {
    const onPopState = () => {
      const { route, canonicalPath } = parseRoute(window.location.pathname);
      if (canonicalPath) {
        window.history.replaceState(null, "", canonicalPath);
      }
      setRoute(route);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = React.useCallback((path: string) => {
    const { route, canonicalPath } = parseRoute(path);
    const finalPath = canonicalPath || path;
    window.history.pushState(null, "", finalPath);
    setRoute(route);
  }, []);

  switch (route.type) {
    case "program":
      return <ProgramPage programSlug={route.programSlug} onNavigate={handleNavigate} />;
    case "offspring-group":
      return (
        <OffspringGroupDetailPage
          programSlug={route.programSlug}
          listingSlug={route.listingSlug}
          onNavigate={handleNavigate}
        />
      );
    case "animal":
      return (
        <AnimalDetailPage
          programSlug={route.programSlug}
          urlSlug={route.urlSlug}
          onNavigate={handleNavigate}
        />
      );
    default:
      return <ProgramsIndexPage onNavigate={handleNavigate} />;
  }
}

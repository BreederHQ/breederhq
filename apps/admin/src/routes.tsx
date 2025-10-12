import type { ReactNode } from "react";

export type Route = { path: string; label: string; element: ReactNode };

// Add more pages later if needed.
export const organizationsRoutes = (page: { OrganizationsPage: ReactNode }): Route[] => [
  { path: "/admin", label: "Admin", element: page.OrganizationsPage },
];

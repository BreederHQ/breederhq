// apps/portal/src/pages/PortalLoginPage.tsx
// Login page for the Client Portal. Uses shared LoginPage from @bhq/ui.

import * as React from "react";
import { LoginPage } from "@bhq/ui";

export default function PortalLoginPage() {
  // Get returnUrl from query params
  const returnUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    // Validate returnUrl is a relative path (security: prevent open redirect)
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/";
  }, []);

  return <LoginPage returnUrl={returnUrl} />;
}

// apps/marketplace/src/pages/MarketplaceAuthPage.tsx
// Login page for marketplace access. Uses shared LoginPage from @bhq/ui.

import * as React from "react";
import { LoginPage } from "@bhq/ui";

interface Props {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  onSuccess: () => void;
}

export function MarketplaceAuthPage({ onSuccess }: Props) {
  return <LoginPage onSuccess={onSuccess} />;
}

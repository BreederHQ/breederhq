// apps/marketplace/src/components/ErrorState.tsx
import * as React from "react";
import { Button } from "@bhq/ui";

type ErrorStateProps = {
  type: "not-found" | "gate-disabled" | "error";
  message?: string;
  onBack?: () => void;
};

export function ErrorState({ type, message, onBack }: ErrorStateProps) {
  const configs = {
    "not-found": {
      icon: "🔍",
      title: "Not Found",
      description: message || "The page you're looking for doesn't exist or has been removed.",
    },
    "gate-disabled": {
      icon: "🚧",
      title: "Marketplace Not Enabled",
      description: message || "The marketplace is not currently enabled for this program.",
    },
    "error": {
      icon: "⚠️",
      title: "Something Went Wrong",
      description: message || "An error occurred while loading this page.",
    },
  };

  const config = configs[type];

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h1 className="text-2xl font-semibold text-primary mb-2">{config.title}</h1>
        <p className="text-secondary text-sm mb-6">{config.description}</p>
        {onBack && (
          <Button variant="soft" onClick={onBack}>
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
}

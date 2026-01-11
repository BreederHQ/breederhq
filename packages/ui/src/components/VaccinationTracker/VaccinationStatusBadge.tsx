// packages/ui/src/components/VaccinationTracker/VaccinationStatusBadge.tsx
import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { VaccinationStatus } from "@bhq/api";

export interface VaccinationStatusBadgeProps {
  status: VaccinationStatus;
  statusText?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  showText?: boolean;
}

const statusConfig: Record<
  VaccinationStatus,
  {
    icon: React.ElementType;
    label: string;
    bgClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  current: {
    icon: CheckCircle2,
    label: "Current",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    iconClass: "text-green-500",
  },
  due_soon: {
    icon: AlertTriangle,
    label: "Due Soon",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-300",
    iconClass: "text-amber-500",
  },
  expired: {
    icon: XCircle,
    label: "Expired",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-700 dark:text-red-300",
    iconClass: "text-red-500",
  },
  not_recorded: {
    icon: Clock,
    label: "Not Recorded",
    bgClass: "bg-gray-100 dark:bg-gray-800/50",
    textClass: "text-gray-600 dark:text-gray-400",
    iconClass: "text-gray-400",
  },
};

export function VaccinationStatusBadge({
  status,
  statusText,
  size = "sm",
  showIcon = true,
  showText = true,
}: VaccinationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs gap-1"
      : "px-2.5 py-1 text-sm gap-1.5";

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgClass} ${config.textClass} ${sizeClasses}`}
    >
      {showIcon && <Icon className={`${iconSize} ${config.iconClass}`} />}
      {showText && <span>{statusText || config.label}</span>}
    </span>
  );
}

/**
 * Standalone icon component for use in lists/tables
 */
export function VaccinationStatusIcon({
  status,
  size = "sm",
  className = "",
}: {
  status: VaccinationStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <Icon
      className={`${sizeClasses[size]} ${config.iconClass} ${className}`}
      aria-label={config.label}
    />
  );
}

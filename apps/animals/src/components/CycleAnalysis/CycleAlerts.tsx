import * as React from "react";
import { Button } from "@bhq/ui";
import type { NextCycleProjection, OvulationPattern } from "./types";

type CycleAlertsProps = {
  projection: NextCycleProjection;
  ovulationPattern: OvulationPattern;
  hasActiveBreedingPlan?: boolean;
  onStartBreedingPlan?: () => void;
  onDismissAlert?: (alertId: string) => void;
};

type Alert = {
  id: string;
  type: "info" | "warning" | "action";
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function CycleAlerts({
  projection,
  ovulationPattern,
  hasActiveBreedingPlan = false,
  onStartBreedingPlan,
  onDismissAlert,
}: CycleAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set());

  const alerts: Alert[] = [];

  // Calculate days until key events
  const daysToHeat = projection ? daysUntil(projection.projectedHeatStart) : null;
  const daysToTesting = projection ? daysUntil(projection.recommendedTestingStart) : null;

  // Alert: Testing starts soon
  if (daysToTesting !== null && daysToTesting >= 0 && daysToTesting <= 7) {
    alerts.push({
      id: "testing-soon",
      type: "warning",
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: daysToTesting === 0 ? "Start testing today" : `Start testing in ${daysToTesting} day${daysToTesting !== 1 ? "s" : ""}`,
      description: "Begin progesterone testing to catch the rise before ovulation.",
    });
  }

  // Alert: Heat expected soon
  if (daysToHeat !== null && daysToHeat >= 0 && daysToHeat <= 14 && (daysToTesting === null || daysToTesting > 7)) {
    alerts.push({
      id: "heat-soon",
      type: "info",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: `Heat expected in ${daysToHeat} day${daysToHeat !== 1 ? "s" : ""}`,
      description: "Watch for signs of estrus: swelling, discharge, behavior changes.",
    });
  }

  // Alert: No breeding plan but heat is coming
  if (!hasActiveBreedingPlan && daysToHeat !== null && daysToHeat <= 30 && daysToHeat >= 0 && onStartBreedingPlan) {
    alerts.push({
      id: "no-breeding-plan",
      type: "action",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Ready to breed this cycle?",
      description: "Start a breeding plan to track matings, testing, and projected due dates.",
      action: {
        label: "Start Breeding Plan",
        onClick: onStartBreedingPlan,
      },
    });
  }

  // Alert: Insufficient pattern data
  if (ovulationPattern.classification === "Insufficient Data" && ovulationPattern.sampleSize >= 1) {
    alerts.push({
      id: "need-more-data",
      type: "info",
      icon: (
        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Build your pattern data",
      description: "Confirm ovulation via progesterone testing on your next breeding cycle to unlock personalized predictions.",
    });
  }

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismissAlert?.(alertId);
  };

  const alertStyles = {
    info: "border-zinc-600/50 bg-zinc-800/30",
    warning: "border-blue-500/30 bg-blue-900/20",
    action: "border-emerald-500/30 bg-emerald-900/20",
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-3 rounded-lg border ${alertStyles[alert.type]}`}
        >
          <div className="flex-shrink-0 mt-0.5">{alert.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-primary">{alert.title}</div>
            <div className="text-sm text-secondary mt-0.5">{alert.description}</div>
            {alert.action && (
              <Button
                variant="soft"
                size="xs"
                className="mt-2"
                onClick={alert.action.onClick}
              >
                {alert.action.label}
              </Button>
            )}
          </div>
          <button
            onClick={() => handleDismiss(alert.id)}
            className="flex-shrink-0 text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

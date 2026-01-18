// packages/ui/src/components/Tooltip.tsx
// Styled tooltip using Radix UI

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { getFlyoutRoot } from "../overlay/core";

export interface TooltipProps {
  /** The content to show in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Side of the trigger to show tooltip */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment relative to trigger */
  align?: "start" | "center" | "end";
  /** Delay in ms before showing (default 200) */
  delayDuration?: number;
  /** Skip delay when moving between tooltips */
  skipDelayDuration?: number;
  /** Whether tooltip is open (controlled) */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  skipDelayDuration = 300,
  open,
  onOpenChange,
}: TooltipProps) {
  // Get flyout root for portaling (ensures tooltip appears above all overlays)
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setContainer(getFlyoutRoot());
  }, []);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={4}
            className="z-[9999] px-3 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg border border-amber-500/60 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-zinc-800" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Export Provider for wrapping entire app (optional, for shared delay state)
export const TooltipProvider = TooltipPrimitive.Provider;

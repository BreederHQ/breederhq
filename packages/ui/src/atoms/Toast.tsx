// packages/ui/src/atoms/Toast.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Check, AlertCircle, Info } from "lucide-react";
import { getFlyoutRoot } from "../overlay";

export type ToastKind = "success" | "error" | "info";
export type ToastItem = { id: number; kind: ToastKind; msg: string };

let pushToastRef: ((kind: ToastKind, msg: string, duration?: number) => void) | null = null;

const TOAST_STYLES: Record<ToastKind, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-white/20 bg-white/5 text-primary",
};

const TOAST_ICONS: Record<ToastKind, React.ReactNode> = {
  success: <Check className="h-4 w-4 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
};

export function ToastViewport() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    pushToastRef = (kind, msg, duration = 3000) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, kind, msg }]);
      // Auto-dismiss
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    return () => {
      pushToastRef = null;
    };
  }, []);

  // Portal toasts to flyout root so they appear above all overlays
  const toastContent = (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
      {items.map((t) => (
        <div
          key={t.id}
          className={`bhq-toast flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 ${TOAST_STYLES[t.kind]}`}
        >
          {TOAST_ICONS[t.kind]}
          {t.msg}
        </div>
      ))}
    </div>
  );

  // Only render if we have items to show (avoids unnecessary portal)
  if (items.length === 0) return null;

  // Use portal to render above all overlays
  if (typeof document !== "undefined") {
    return createPortal(toastContent, getFlyoutRoot());
  }

  return toastContent;
}

export type ToastFn = (msg: string, opts?: { duration?: number }) => void;

export const toast: { success: ToastFn; error: ToastFn; info: ToastFn } = {
  success: (msg, opts) => pushToastRef?.("success", msg, opts?.duration),
  error:   (msg, opts) => pushToastRef?.("error", msg, opts?.duration ?? 5000),
  info:    (msg, opts) => pushToastRef?.("info", msg, opts?.duration),
};

export function useToast() {
  return { toast };
}

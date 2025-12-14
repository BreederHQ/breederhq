// packages/ui/src/atoms/Toast.tsx
import * as React from "react";

export type ToastKind = "success" | "error" | "info";
export type ToastItem = { id: number; kind: ToastKind; msg: string };

let pushToastRef: ((kind: ToastKind, msg: string) => void) | null = null;

export function ToastViewport() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    pushToastRef = (kind, msg) => {
      setItems((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), kind, msg },
      ]);
    };
    return () => {
      pushToastRef = null;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999]">
      {items.map((t) => (
        <div
          key={t.id}
          className="bhq-toast rounded-md border border-hairline bg-surface px-3 py-2 text-sm shadow-md"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export type ToastFn = (msg: string, opts?: { duration?: number }) => void;

export const toast: { success: ToastFn; error: ToastFn; info: ToastFn } = {
  success: (msg) => pushToastRef?.("success", msg),
  error:   (msg) => pushToastRef?.("error", msg),
  info:    (msg) => pushToastRef?.("info", msg),
};

export function useToast() {
  return { toast };
}

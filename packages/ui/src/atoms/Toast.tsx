// packages/ui/src/atoms/Toast.tsx
import * as React from "react";

export type ToastFn = (msg: string, opts?: { duration?: number }) => void;

export const toast: { success: ToastFn; error: ToastFn; info: ToastFn } =
  (window as any).bhqToast || {
    success: (msg) => console.log("[toast:success]", msg),
    error:   (msg) => console.error("[toast:error]", msg),
    info:    (msg) => console.log("[toast:info]", msg),
  };

export function ToastViewport() {
  return null;
}

export function useToast() {
  return { toast };
}

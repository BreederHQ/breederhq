import * as React from "react";

type ToastFn = (msg: string, opts?: { duration?: number }) => void;

export const toast: { success: ToastFn; error: ToastFn; info: ToastFn } =
  (window as any).bhqToast || {
    success: (msg) => console.log("[toast:success]", msg),
    error:   (msg) => console.error("[toast:error]", msg),
    info:    (msg) => console.log("[toast:info]", msg),
  };

/**
 * Minimal viewport host. Replace with your real provider later if needed.
 * Mount once near the app root, for example in NavShell.
 */
export function ToastViewport() {
  return null;
}

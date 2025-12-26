import * as React from "react";
import { createRoot } from "react-dom/client";
import { getOverlayRoot } from "../overlay";
import { Button } from "../components/Button";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
}

export function confirmDialog(opts: ConfirmDialogOptions): Promise<boolean> {
  const { title, message, confirmText, cancelText, variant } = {
    title: opts.title ?? "Confirm",
    message: opts.message,
    confirmText: opts.confirmText ?? "Confirm",
    cancelText: opts.cancelText ?? "Cancel",
    variant: opts.variant ?? "default",
  };

  const rootEl = getOverlayRoot();
  const host = document.createElement("div");
  host.style.pointerEvents = "auto";
  rootEl.appendChild(host);

  return new Promise((resolve) => {
    const close = (ok: boolean) => {
      resolve(ok);
      try {
        r.unmount();
      } catch {}
      host.remove();
    };

    const r = createRoot(host);
    r.render(
      <div className="fixed inset-0 z-[2147483647]">
        <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[420px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-base font-semibold mb-2">{title}</div>
            <div className="text-sm text-secondary mb-4 whitespace-pre-line">{message}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                {cancelText}
              </Button>
              <Button
                onClick={() => close(true)}
                className={variant === "danger" ? "bg-red-600 hover:bg-red-500 text-white" : undefined}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

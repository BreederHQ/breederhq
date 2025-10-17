// packages/ui/src/hooks/useOverlayInteractivity.ts
import * as React from "react";

/**
 * Close when a pointer starts outside of `containerRef`.
 * - Uses pointerdown (not click) to avoid racing the button onClick.
 * - Works through shadow DOM thanks to composedPath().
 */
export function useOverlayInteractivity({
  when,
  containerRef,
  onOutside,
  onEscape,
}: {
  when: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onOutside: () => void;
  onEscape?: () => void;
}) {
  React.useEffect(() => {
    if (!when) return;

    const onPointerDown = (e: Event) => {
      const container = containerRef.current;
      if (!container) return;
      // Prefer composedPath to handle portals/shadow trees
      const path = (e as any).composedPath?.() as EventTarget[] | undefined;
      const inside = path ? path.includes(container) : container.contains(e.target as Node);
      if (!inside) onOutside();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.() ?? onOutside();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true); // capture
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [when, containerRef, onOutside, onEscape]);
}

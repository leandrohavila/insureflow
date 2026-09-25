"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.tabIndex !== -1,
      );

    const initial = focusable();
    (initial.find((element) => element.tagName === "SELECT" || element.tagName === "INPUT") ??
      initial[0])?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) onCloseRef.current();
    }

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[#000C24]/70"
        aria-label="Fechar painel"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[min(85dvh,40rem)] flex-col rounded-t-2xl bg-white text-[#000C24] shadow-[0_-12px_40px_rgba(0,12,36,.28)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="shrink-0 px-4 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#E6E8EC]" aria-hidden />
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-[#000C24]"
              aria-label="Fechar"
              onClick={() => onCloseRef.current()}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

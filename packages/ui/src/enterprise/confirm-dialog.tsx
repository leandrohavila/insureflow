"use client";

import * as React from "react";
import { useState } from "react";

import { cn } from "../lib/cn";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "./modal";

const btnBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 outline-none disabled:pointer-events-none disabled:opacity-50";

export type ConfirmDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual weight of the confirm action */
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

export function ConfirmDialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [internalOpen, setInternalOpen] = useState(Boolean(defaultOpen));
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent showCloseButton={false} className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description ? (
            <ModalDescription>{description}</ModalDescription>
          ) : null}
        </ModalHeader>
        <ModalFooter className="gap-2 border-t-0 bg-transparent p-0 pt-2 sm:mt-0">
          <ModalClose
            className={cn(btnBase, "border border-border bg-background hover:bg-muted")}
            onClick={() => {
              onCancel?.();
            }}
          >
            {cancelLabel}
          </ModalClose>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className={cn(
              btnBase,
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

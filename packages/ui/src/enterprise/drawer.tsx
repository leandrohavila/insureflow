"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "../lib/cn";

export function DrawerRoot({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="if-drawer" {...props} />;
}

export function DrawerTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="if-drawer-trigger" {...props} />;
}

export function DrawerClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="if-drawer-close" {...props} />;
}

export function DrawerPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="if-drawer-portal" {...props} />;
}

export function DrawerOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="if-drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <SheetPrimitive.Popup
        data-slot="if-drawer-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover text-sm text-popover-foreground shadow-if-lg ring-1 ring-border transition duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-xl data-[side=bottom]:border-t",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[90vh] data-[side=top]:rounded-b-xl data-[side=top]:border-b",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-full data-[side=left]:border-r data-[side=left]:sm:max-w-md",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-full data-[side=right]:border-l data-[side=right]:sm:max-w-md",
          "data-[side=left]:data-ending-style:-translate-x-4 data-[side=left]:data-starting-style:-translate-x-4",
          "data-[side=right]:data-ending-style:translate-x-4 data-[side=right]:data-starting-style:translate-x-4",
          "data-[side=bottom]:data-ending-style:translate-y-4 data-[side=bottom]:data-starting-style:translate-y-4",
          "data-[side=top]:data-ending-style:-translate-y-4 data-[side=top]:data-starting-style:-translate-y-4",
          className,
        )}
        {...props}
      >
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="if-drawer-close-btn"
            className={cn(
              "absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 outline-none",
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Fechar</span>
          </SheetPrimitive.Close>
        ) : null}
        {children}
      </SheetPrimitive.Popup>
    </DrawerPortal>
  );
}

export function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="if-drawer-header"
      className={cn("flex flex-col gap-1 border-b border-border px-5 pb-4 pt-4", className)}
      {...props}
    />
  );
}

export function DrawerTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="if-drawer-title"
      className={cn("pr-8 text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="if-drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="if-drawer-footer"
      className={cn(
        "mt-auto flex flex-col gap-2 border-t border-border bg-muted/30 p-4",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="if-drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}
      {...props}
    />
  );
}

export function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: SheetPrimitive.Root.Props) {
  return (
    <DrawerRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {children}
    </DrawerRoot>
  );
}

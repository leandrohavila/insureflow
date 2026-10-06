"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { trackPortalEvent, type PortalEventName } from "@/lib/tracking";

type TrackProps = {
  event: PortalEventName;
  eventLabel?: string;
  propertySlug?: string;
  children: ReactNode;
  className?: string;
};

export function TrackedLink({
  event,
  eventLabel,
  propertySlug,
  href,
  children,
  className,
  onClick,
  ...props
}: TrackProps & Omit<ComponentProps<typeof Link>, "href" | "className" | "children"> & { href: string }) {
  return (
    <Link
      href={href}
      className={className}
      {...props}
      data-portal-event={event}
      onClick={(clickEvent) => {
        onClick?.(clickEvent);
        trackPortalEvent({
          event,
          label: eventLabel,
          href,
          propertySlug,
        });
      }}
    >
      {children}
    </Link>
  );
}

export function TrackedAnchor({
  event,
  eventLabel,
  propertySlug,
  href,
  children,
  className,
  onClick,
  ...props
}: TrackProps & Omit<ComponentProps<"a">, "href" | "className" | "children"> & { href: string }) {
  return (
    <a
      href={href}
      className={className}
      {...props}
      data-portal-event={event}
      onClick={(clickEvent) => {
        onClick?.(clickEvent);
        trackPortalEvent({
          event,
          label: eventLabel,
          href,
          propertySlug,
        });
      }}
    >
      {children}
    </a>
  );
}

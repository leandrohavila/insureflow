"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function BrandLogo({
  src,
  name,
  plate = false,
  className,
}: {
  src: string | null | undefined;
  name: string;
  plate?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() || "";

  if (!trimmed || failed) {
    return (
      <span className={cn("truncate text-sm font-semibold tracking-[0.08em] uppercase text-white", className)}>
        {name}
      </span>
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={trimmed}
      alt={name}
      width={180}
      height={36}
      className="brand-logo"
      decoding="async"
      fetchPriority="high"
      onError={() => setFailed(true)}
    />
  );

  if (!plate) return image;

  return <span className="inline-flex h-9 max-w-[11rem] items-center rounded-md bg-white px-2">{image}</span>;
}

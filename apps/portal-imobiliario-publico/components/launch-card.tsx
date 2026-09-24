"use client";

import Link from "next/link";
import { useState } from "react";

import { formatPrice } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function LaunchCard({ property }: { property: PublicProperty }) {
  const images = property.images.length
    ? property.images
    : property.coverImage
      ? [{ ...property.coverImage, sortOrder: 0, isCover: true }]
      : [];
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      <div className="bg-muted">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.alt ?? property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-56 items-center justify-center text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
          <p className="absolute bottom-4 right-4 rounded-lg bg-navy-deep/90 px-5 py-3 text-2xl font-semibold text-gold md:text-3xl">
            A partir de {formatPrice(property.price)}
          </p>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-card p-3">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border"
                aria-label={`Foto ${index + 1} de ${property.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Lançamento</p>
          <h3 className="text-2xl font-semibold tracking-tight text-navy md:text-4xl">{property.title}</h3>
          {property.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-navy/80">{property.description}</p>
          )}
        </div>
        <Link
          href={`/imoveis/${property.slug}`}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-navy px-8 text-base font-semibold text-white transition-colors hover:bg-navy-deep"
        >
          Conheça
        </Link>
      </div>
    </article>
  );
}

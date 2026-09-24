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
    <article className="grid overflow-hidden rounded-3xl bg-white shadow-lg lg:grid-cols-2">
      <div className="bg-stone-200">
        <div className="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[22rem]">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.alt ?? property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-56 items-center justify-center text-sm text-stone-500">
              Sem foto
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-white"
                aria-label={`Foto ${index + 1} de ${property.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a2f]">Lançamento</p>
        <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{property.title}</h3>
        {property.description && (
          <p className="line-clamp-5 text-sm leading-relaxed text-stone-600">{property.description}</p>
        )}
        <p className="text-lg font-semibold text-[#123524]">A partir de {formatPrice(property.price)}</p>
        <Link
          href={`/imoveis/${property.slug}`}
          className="mt-auto inline-flex h-11 w-fit items-center rounded-lg bg-[#123524] px-5 text-sm font-semibold text-white"
        >
          Conheça
        </Link>
      </div>
    </article>
  );
}

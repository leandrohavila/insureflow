"use client";

import { useState } from "react";

import type { PropertyImage } from "@/types/property";

function orderedImages(images: PropertyImage[]) {
  return [...images].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

export function PropertyGallery({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const gallery = orderedImages(images);
  const [active, setActive] = useState(0);
  const current = gallery[active] ?? gallery[0];

  if (!current) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Sem foto
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.url}
          alt={current.alt ?? title}
          width={1200}
          height={750}
          className="h-full w-full object-cover"
          decoding="async"
          fetchPriority={active === 0 ? "high" : "low"}
          loading={active === 0 ? "eager" : "lazy"}
        />
        {gallery.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#000C24]"
              onClick={() => setActive((index) => (index === 0 ? gallery.length - 1 : index - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#000C24]"
              onClick={() => setActive((index) => (index + 1) % gallery.length)}
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>
      {gallery.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {gallery.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                className={`block aspect-[4/3] w-full overflow-hidden rounded-md ${
                  index === active ? "ring-2 ring-[#C09048]" : ""
                }`}
                onClick={() => setActive(index)}
                aria-label={`Foto ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  width={240}
                  height={180}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

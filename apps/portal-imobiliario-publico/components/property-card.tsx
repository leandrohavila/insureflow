import Link from "next/link";

import { formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function PropertyCard({ property }: { property: PublicProperty }) {
  const cover = resolveCover(property);
  const specs = [
    property.bedrooms != null ? `${property.bedrooms} quartos` : null,
    property.bathrooms != null ? `${property.bathrooms} banheiros` : null,
    property.parkingSpots != null ? `${property.parkingSpots} vagas` : null,
    property.areaM2 != null ? `${property.areaM2} m²` : null,
  ].filter(Boolean);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-stone-200">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt ?? property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone-500">Sem foto</div>
        )}
        <p className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-[#123524]">
          {formatPrice(property.price)}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm text-stone-500">
          {[property.neighborhood, property.city].filter(Boolean).join(" · ")}
        </p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">{property.title}</h3>
        <p className="text-xs uppercase tracking-wide text-stone-500">
          {typeLabel(property.type)} · {purposeLabel(property.purpose)}
        </p>
        <p className="text-sm text-stone-600">{specs.join(" · ")}</p>
        <p className="text-xs text-stone-400">Cód. {property.slug}</p>
        <Link
          href={`/imoveis/${property.slug}`}
          className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-[#123524] text-sm font-medium text-white"
        >
          Ver Imóvel
        </Link>
      </div>
    </article>
  );
}

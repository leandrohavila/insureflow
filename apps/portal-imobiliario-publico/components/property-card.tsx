import Link from "next/link";

import { formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PublicProperty;
  priority?: boolean;
}) {
  const cover = resolveCover(property);
  const specs = [
    property.bedrooms != null ? `${property.bedrooms} quartos` : null,
    property.bathrooms != null ? `${property.bathrooms} banheiros` : null,
    property.parkingSpots != null ? `${property.parkingSpots} vagas` : null,
    property.areaM2 != null ? `${property.areaM2} m²` : null,
  ].filter(Boolean);
  const place = [property.neighborhood, property.city].filter(Boolean).join(" · ");
  const price = formatPrice(property.price);

  return (
    <article className="h-full min-w-0">
      <Link
        href={`/imoveis/${property.slug}`}
        className="flex h-full min-w-0 overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white shadow-sm sm:flex-col"
      >
        <div className="relative w-[7.5rem] shrink-0 self-stretch bg-[#E6E8EC] sm:aspect-[16/10] sm:w-full">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? property.title}
              width={640}
              height={400}
              className="absolute inset-0 h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-medium text-[#10294B]">
              Sem foto
            </div>
          )}
          <p className="absolute bottom-2 left-2 hidden rounded-full bg-white px-2.5 py-1 text-lg font-bold text-[#000C24] sm:inline-flex">
            {price}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
          <p className="text-lg font-bold leading-none text-[#000C24] sm:hidden">{price}</p>
          <p className="truncate text-sm font-semibold text-[#000C24]">{place}</p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#000C24] sm:text-base">
            {property.title}
          </h3>
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[#10294B]">
            {typeLabel(property.type)} · {purposeLabel(property.purpose)}
          </p>
          {specs.length > 0 && <p className="truncate text-xs text-[#10294B]">{specs.join(" · ")}</p>}
          <p className="truncate text-xs text-[#3d4d66]">Cód. {property.publicCode || property.slug}</p>
          <span className="mt-auto inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C09048] text-sm font-semibold text-[#000C24]">
            Ver imóvel
          </span>
        </div>
      </Link>
    </article>
  );
}

import Link from "next/link";
import { ArrowRight, Bath, BedDouble, Building2, Car, MapPin, Maximize2 } from "lucide-react";

import { formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function PropertyCardSkeleton() {
  return (
    <div
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_32px_-14px_rgba(0,12,36,.22)]"
      aria-hidden
    >
      <div className="aspect-[4/3] w-full bg-[#E6E8EC] motion-safe:animate-pulse" />
      <div className="flex flex-col p-5">
        <div className="h-6 w-2/5 rounded-md bg-[#EEF0F3]" />
        <div className="mt-3 h-5 w-3/5 rounded-md bg-[#EEF0F3]" />
        <div className="mt-1.5 h-11 w-4/5 rounded-md bg-[#EEF0F3]" />
        <div className="mt-1 h-4 w-1/2 rounded-md bg-[#EEF0F3]" />
        <div className="mt-4 h-[4.25rem] border-t border-[#EEF0F3] pt-4">
          <div className="h-5 w-3/4 rounded-md bg-[#EEF0F3]" />
        </div>
        <div className="pt-5">
          <div className="h-12 w-full rounded-xl bg-[#EEF0F3]" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PublicProperty;
  priority?: boolean;
}) {
  const cover = resolveCover(property);
  const rooms = [
    property.bedrooms != null ? { icon: BedDouble, value: property.bedrooms, label: "quartos" } : null,
    property.bathrooms != null ? { icon: Bath, value: property.bathrooms, label: "banheiros" } : null,
    property.parkingSpots != null ? { icon: Car, value: property.parkingSpots, label: "vagas" } : null,
  ].filter((spec) => spec != null);
  const place = [property.neighborhood, property.city].filter(Boolean).join(" • ");
  const price = formatPrice(property.price);

  return (
    <article className="h-full min-w-0">
      <Link
        href={`/imoveis/${property.slug}`}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_32px_-14px_rgba(0,12,36,.22)] transition-[box-shadow,translate] duration-[400ms] ease-out hover:shadow-[0_28px_56px_-18px_rgba(0,12,36,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C09048] focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1.5 motion-reduce:transition-none"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#E6E8EC]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? property.title}
              width={640}
              height={480}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[400ms] ease-out motion-safe:group-hover:scale-[1.06] motion-reduce:transition-none"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#EEF0F3] to-[#E1E5EB] text-xs font-medium text-[#3d4d66]">
              <Building2 className="size-8 text-[#10294B]/40" aria-hidden />
              Sem foto
            </div>
          )}
          {cover && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#000C24]/40 to-transparent" />
          )}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {property.featured === true && (
              <span className="rounded-full bg-[#DEAE5D] px-3 py-1 text-xs font-bold text-[#000C24] shadow-md">
                Destaque
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#000C24] shadow-md">
              {purposeLabel(property.purpose)}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <p className="text-2xl font-extrabold leading-none tracking-tight text-[#000C24]">{price}</p>
          {place && (
            <p className="mt-3 flex min-w-0 items-start gap-1.5 text-sm font-medium leading-5 text-[#10294B]">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#8a6a2f]" aria-hidden />
              <span className="min-w-0 break-words">{place}</span>
            </p>
          )}
          <h3 className="mt-1.5 line-clamp-3 break-words text-base font-semibold leading-snug text-[#000C24]">
            {property.title}
          </h3>
          <p className="mt-1 break-words text-xs font-medium uppercase tracking-wide text-[#3d4d66]">
            {typeLabel(property.type)} · Cód. {property.publicCode || property.slug}
          </p>
          {(rooms.length > 0 || property.areaM2 != null) && (
            <div className="mt-4 space-y-2 border-t border-[#EEF0F3] pt-4 text-sm font-medium text-[#10294B]">
              {rooms.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {rooms.map(({ icon: Icon, value, label }) => (
                    <li key={label} className="inline-flex items-center gap-1.5">
                      <Icon className="size-4 text-[#8a6a2f]" aria-hidden />
                      {value}
                      <span className="sr-only">{label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {property.areaM2 != null && (
                <p className="inline-flex items-center gap-1.5">
                  <Maximize2 className="size-4 text-[#8a6a2f]" aria-hidden />
                  {property.areaM2} m²
                </p>
              )}
            </div>
          )}
          <div className="mt-auto pt-5">
            <span className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#000C24] text-sm font-semibold text-white transition-colors duration-[400ms] group-hover:bg-[#C09048] group-hover:text-[#000C24] motion-reduce:transition-none">
              Ver imóvel
              <ArrowRight
                className="size-4 transition-transform duration-[400ms] motion-safe:group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

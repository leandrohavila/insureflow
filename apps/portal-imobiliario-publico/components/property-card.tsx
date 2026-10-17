import Link from "next/link";
import { ArrowRight, Bath, BedDouble, Building2, Car, MapPin, Maximize2, MessageCircle, Share2 } from "lucide-react";

import { TrackedAnchor } from "@/components/tracked-link";
import { propertyShareHref, propertyWhatsappHref } from "@/lib/commercial";
import {
  formatArea,
  formatBathrooms,
  formatParking,
  formatPrice,
  formatRooms,
  isExclusiveListing,
  purposeLabel,
  resolveCover,
  typeLabel,
} from "@/lib/utils";
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
  whatsappPhone,
}: {
  property: PublicProperty;
  priority?: boolean;
  whatsappPhone?: string | null;
}) {
  const cover = resolveCover(property);
  const rooms = [
    property.bedrooms != null ? { icon: BedDouble, label: formatRooms(property.bedrooms) } : null,
    property.bathrooms != null ? { icon: Bath, label: formatBathrooms(property.bathrooms) } : null,
    property.parkingSpots != null ? { icon: Car, label: formatParking(property.parkingSpots) } : null,
  ].filter((spec) => spec != null);
  const place = [property.neighborhood, property.city].filter(Boolean).join(" • ");
  const price = formatPrice(property.price);
  const whatsapp = propertyWhatsappHref(whatsappPhone, property);
  const exclusive = isExclusiveListing(property.features);

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_32px_-14px_rgba(0,12,36,.22)] transition-[box-shadow,translate] duration-[400ms] ease-out hover:shadow-[0_28px_56px_-18px_rgba(0,12,36,.35)] motion-safe:hover:-translate-y-1.5 motion-reduce:transition-none">
      <TrackedAnchor
        event="whatsapp_click"
        eventLabel="compartilhar-card"
        propertySlug={property.slug}
        href={propertyShareHref(property)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Compartilhar ${property.title}`}
        className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white text-[#000C24] shadow-md hover:bg-[#DEAE5D]"
      >
        <Share2 className="size-4" aria-hidden />
      </TrackedAnchor>
      <Link
        href={`/imoveis/${property.slug}`}
        className="flex min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C09048] focus-visible:ring-offset-2"
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
          <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            {property.featured === true && (
              <span className="rounded-full bg-[#DEAE5D] px-3 py-1 text-xs font-bold text-[#000C24] shadow-md">
                Destaque
              </span>
            )}
            {exclusive && (
              <span className="rounded-full bg-[#000C24] px-3 py-1 text-xs font-bold text-[#DEAE5D] shadow-md ring-1 ring-[#DEAE5D]">
                Exclusivo
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#000C24] shadow-md">
              {purposeLabel(property.purpose)}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <p className="text-[1.65rem] font-extrabold leading-none tracking-tight text-[#7F5209]">{price}</p>
          {place && (
            <p className="mt-4 inline-flex w-fit max-w-full items-start gap-1.5 rounded-full bg-[#F6F1E8] px-3 py-1.5 text-sm font-semibold leading-5 text-[#000C24]">
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
                  {rooms.map(({ icon: Icon, label }) => (
                    <li key={label} className="inline-flex items-center gap-1.5">
                      <Icon className="size-4 text-[#8a6a2f]" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {property.areaM2 != null && (
                <p className="inline-flex items-center gap-1.5">
                  <Maximize2 className="size-4 text-[#8a6a2f]" aria-hidden />
                  {formatArea(property.areaM2)}
                </p>
              )}
            </div>
          )}
        </div>
      </Link>
      <div className={`grid gap-2 px-5 pb-5 ${whatsapp ? "grid-cols-2" : "grid-cols-1"}`}>
        <Link
          href={`/imoveis/${property.slug}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#000C24] px-3 text-sm font-semibold text-white transition-colors duration-[400ms] hover:bg-[#C09048] hover:text-[#000C24] motion-reduce:transition-none"
        >
          Ver detalhes
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        {whatsapp && (
          <TrackedAnchor
            event="whatsapp_click"
            eventLabel="card-imovel"
            propertySlug={property.slug}
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#075E54] px-3 text-sm font-semibold text-white hover:bg-[#0b7a6e]"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </TrackedAnchor>
        )}
      </div>
    </article>
  );
}

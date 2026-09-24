import Link from "next/link";

import { cn, formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function PropertyCard({
  property,
  featured = false,
}: {
  property: PublicProperty;
  featured?: boolean;
}) {
  const cover = resolveCover(property);
  const specs = [
    property.bedrooms != null ? `${property.bedrooms} quartos` : null,
    property.bathrooms != null ? `${property.bathrooms} banheiros` : null,
    property.parkingSpots != null ? `${property.parkingSpots} vagas` : null,
    property.areaM2 != null ? `${property.areaM2} m²` : null,
  ].filter(Boolean);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        featured && "shadow-md",
      )}
    >
      <div className={cn("relative bg-muted", featured ? "aspect-[16/10]" : "aspect-[4/3]")}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt ?? property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem foto</div>
        )}
        <p
          className={cn(
            "absolute font-semibold text-gold",
            featured
              ? "bottom-4 left-4 rounded-lg bg-navy-deep/90 px-4 py-2 text-2xl"
              : "bottom-3 left-3 rounded-full bg-card/95 px-3 py-1 text-sm",
          )}
        >
          {formatPrice(property.price)}
        </p>
      </div>
      <div className={cn("flex flex-1 flex-col gap-2", featured ? "p-5" : "p-4")}>
        <p className="text-sm text-muted-foreground">
          {[property.neighborhood, property.city].filter(Boolean).join(" · ")}
        </p>
        <h3
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-navy",
            featured ? "text-xl" : "text-base",
          )}
        >
          {property.title}
        </h3>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {typeLabel(property.type)} · {purposeLabel(property.purpose)}
        </p>
        <p className="text-sm text-navy/80">{specs.join(" · ")}</p>
        <p className="text-xs text-muted-foreground">Cód. {property.slug}</p>
        <Link
          href={`/imoveis/${property.slug}`}
          className={cn(
            "mt-auto inline-flex items-center justify-center rounded-lg bg-navy font-medium text-white transition-colors hover:bg-navy-deep",
            featured ? "h-12 text-base" : "h-10 text-sm",
          )}
        >
          Ver Imóvel
        </Link>
      </div>
    </article>
  );
}

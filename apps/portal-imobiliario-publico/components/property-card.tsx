import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function PropertyCard({ property }: { property: PublicProperty }) {
  const cover = resolveCover(property);
  const location = [property.neighborhood, property.city].filter(Boolean).join(" · ");

  return (
    <Link href={`/imoveis/${property.slug}`} className="block">
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sem foto
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap gap-1">
            <Badge>{purposeLabel(property.purpose)}</Badge>
            <Badge>{typeLabel(property.type)}</Badge>
          </div>
          <h2 className="text-base font-semibold leading-snug">{property.title}</h2>
          <p className="text-sm text-muted-foreground">{location}</p>
          <p className="text-lg font-semibold">{formatPrice(property.price)}</p>
          <p className="text-xs text-muted-foreground">
            {[
              property.bedrooms != null ? `${property.bedrooms} quartos` : null,
              property.areaM2 != null ? `${property.areaM2} m²` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

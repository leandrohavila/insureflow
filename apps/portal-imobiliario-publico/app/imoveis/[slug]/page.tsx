import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SourceBanner } from "@/components/source-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CatalogNotFoundError } from "@/lib/errors";
import { toAbsoluteUrl } from "@/lib/site";
import { cn, formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import { getPropertyBySlug } from "@/services/catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function descriptionOf(property: {
  description: string | null;
  city: string;
  neighborhood: string | null;
  title: string;
}) {
  const fromBody = property.description?.trim();
  if (fromBody) return fromBody.slice(0, 180);
  const place = [property.neighborhood, property.city].filter(Boolean).join(", ");
  return `${property.title}${place ? ` em ${place}` : ""}`.slice(0, 180);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data: property } = await getPropertyBySlug(slug);
    const cover = resolveCover(property);
    const description = descriptionOf(property);
    return {
      title: property.title,
      description,
      openGraph: {
        title: property.title,
        description,
        type: "website",
        locale: "pt_BR",
        images: cover
          ? [
              {
                url: toAbsoluteUrl(cover.url),
                alt: cover.alt ?? property.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: property.title,
        description,
        images: cover ? [toAbsoluteUrl(cover.url)] : undefined,
      },
    };
  } catch {
    return { title: "Imóvel" };
  }
}

function formatFeatureValue(value: boolean | string | number | null) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const { data: property, source } = await getPropertyBySlug(slug);
    const cover = resolveCover(property);
    const location = [property.address, property.neighborhood, property.city, property.state]
      .filter(Boolean)
      .join(" · ");
    const features = property.features ?? [];

    return (
      <div className="space-y-4">
        <SourceBanner source={source} />
        <Link href="/imoveis" className="text-sm text-muted-foreground">
          ← Voltar à listagem
        </Link>
        <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge>{purposeLabel(property.purpose)}</Badge>
          <Badge>{typeLabel(property.type)}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{property.title}</h1>
        <p className="text-2xl font-semibold">{formatPrice(property.price)}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
        <p className="text-sm text-muted-foreground">
          {[
            property.bedrooms != null ? `${property.bedrooms} quartos` : null,
            property.bathrooms != null ? `${property.bathrooms} banheiros` : null,
            property.parkingSpots != null ? `${property.parkingSpots} vagas` : null,
            property.areaM2 != null ? `${property.areaM2} m²` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {property.primaryOwner?.name && (
          <p className="text-sm text-muted-foreground">
            Proprietário: {property.primaryOwner.name}
          </p>
        )}
        {property.description && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{property.description}</p>
        )}
        {features.length > 0 && (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.key}>
                <span className="text-muted-foreground">{feature.label}: </span>
                {formatFeatureValue(feature.value)}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/imoveis/${property.slug}/interesse`}
          className={cn(buttonVariants(), "inline-flex")}
        >
          Tenho interesse
        </Link>
      </div>
    );
  } catch (error) {
    if (error instanceof CatalogNotFoundError) notFound();
    throw error;
  }
}

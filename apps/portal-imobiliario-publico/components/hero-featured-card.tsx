import Link from "next/link";
import { ArrowUpRight, BedDouble, Building2, MapPin, Maximize2, Sparkles } from "lucide-react";

import { formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

const glassClass =
  "rounded-[28px] border border-white/15 bg-white/[0.08] p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,.55)] backdrop-blur-xl";

export function HeroFeaturedCard({ property }: { property: PublicProperty | null }) {
  if (!property) {
    return (
      <div className={glassClass}>
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[20px] bg-gradient-to-br from-[#10294B] to-[#000C24] px-6 text-center">
          <Building2 className="size-10 text-[#DEAE5D]" aria-hidden />
          <p className="text-lg font-semibold text-white">Imóveis selecionados com cuidado</p>
          <p className="text-sm text-white/75">Novas oportunidades publicadas toda semana.</p>
        </div>
        <Link
          href="/imoveis"
          className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
        >
          Ver todos os imóveis
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const cover = resolveCover(property);
  const place = [property.neighborhood, property.city].filter(Boolean).join(" · ");
  const specs = [
    property.bedrooms != null ? { icon: BedDouble, label: `${property.bedrooms} quartos` } : null,
    property.areaM2 != null ? { icon: Maximize2, label: `${property.areaM2} m²` } : null,
  ].filter((item): item is { icon: typeof BedDouble; label: string } => item !== null);

  return (
    <Link href={`/imoveis/${property.slug}`} className={`group block ${glassClass}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#10294B]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt ?? property.title}
            width={640}
            height={480}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="size-12 text-[#DEAE5D]/70" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000C24]/70 via-transparent to-transparent" aria-hidden />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#DEAE5D] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#000C24] shadow-lg">
          <Sparkles className="size-3.5" aria-hidden />
          Destaque
        </span>
        <p className="absolute bottom-3 left-3 text-2xl font-bold text-white drop-shadow md:text-3xl">
          {formatPrice(property.price)}
        </p>
      </div>
      <div className="space-y-2 px-2 pb-2 pt-4 text-white">
        {place && (
          <p className="flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="size-4 shrink-0 text-[#DEAE5D]" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        )}
        <p className="line-clamp-2 text-lg font-semibold leading-snug">{property.title}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
          <span className="font-medium uppercase tracking-wide">
            {typeLabel(property.type)} · {purposeLabel(property.purpose)}
          </span>
          {specs.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1">
              <Icon className="size-3.5 text-[#DEAE5D]" aria-hidden />
              {label}
            </span>
          ))}
        </div>
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#DEAE5D] group-hover:underline">
          Ver imóvel
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

import Link from "next/link";

import { GrupoAvilaLogo } from "@/components/grupo-avila-logo";
import { companyName, socialHref, whatsappHref } from "@/lib/commercial";
import type { PortalConfig } from "@/types/property";

const linkClass = "block text-gold-bright transition-colors hover:text-gold hover:underline";

export function SiteFooter({ config }: { config: PortalConfig | null }) {
  const name = companyName(config);
  const whatsapp = config?.whatsapp ? whatsappHref(config.whatsapp) : null;
  const instagram = socialHref(config?.instagram);
  const facebook = socialHref(config?.facebook);
  const youtube = socialHref(config?.youtube);

  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4 2xl:max-w-[110rem]">
        <div className="space-y-3">
          {config?.logoUrl ? (
            <span className="avila-logo-plate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.logoUrl} alt={name} className="h-12 w-auto object-contain" />
            </span>
          ) : (
            <GrupoAvilaLogo imageClassName="h-14" />
          )}
          <p className="text-sm font-semibold">{name}</p>
          {config?.creci && <p className="text-sm text-white/80">CRECI {config.creci}</p>}
          {config?.address && <p className="text-sm text-white/80">{config.address}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Contato</p>
          {config?.phone && <p>{config.phone}</p>}
          {whatsapp && (
            <a href={whatsapp} className={linkClass} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          {config?.email && (
            <a href={`mailto:${config.email}`} className={linkClass}>
              {config.email}
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Redes</p>
          {instagram && (
            <a href={instagram} className={linkClass} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {facebook && (
            <a href={facebook} className={linkClass} target="_blank" rel="noreferrer">
              Facebook
            </a>
          )}
          {youtube && (
            <a href={youtube} className={linkClass} target="_blank" rel="noreferrer">
              YouTube
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Institucional</p>
          <Link href="/imoveis" className={linkClass}>
            Imóveis
          </Link>
          <Link href="/#sobre" className={linkClass}>
            Sobre
          </Link>
          <Link href="/#contato" className={linkClass}>
            Falar com um corretor
          </Link>
        </div>
      </div>
    </footer>
  );
}

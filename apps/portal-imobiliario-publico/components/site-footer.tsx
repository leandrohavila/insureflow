import Link from "next/link";

import { companyName, socialHref, whatsappHref } from "@/lib/commercial";
import type { PortalConfig } from "@/types/property";

export function SiteFooter({ config }: { config: PortalConfig | null }) {
  const name = companyName(config);
  const whatsapp = config?.whatsapp ? whatsappHref(config.whatsapp) : null;
  const instagram = socialHref(config?.instagram);
  const facebook = socialHref(config?.facebook);
  const youtube = socialHref(config?.youtube);
  const phone = config?.phone?.trim() || null;
  const email = config?.email?.trim() || null;

  return (
    <footer className="bg-[#000C24] text-white">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 md:grid-cols-3 md:px-8 2xl:max-w-[110rem]">
        <div className="space-y-3 md:col-span-3">
          {config?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt={name} className="h-16 w-auto object-contain" />
          ) : (
            <p className="text-lg font-semibold tracking-[0.14em] uppercase">{name}</p>
          )}
          {config?.creci && <p className="text-sm text-white/80">CRECI {config.creci}</p>}
          {config?.address && <p className="text-sm text-white/80">{config.address}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Contato</p>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-[#DEAE5D]">
              {phone}
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} className="block hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="block break-all hover:text-[#DEAE5D]">
              {email}
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Redes</p>
          {instagram && (
            <a href={instagram} className="block hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {facebook && (
            <a href={facebook} className="block hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              Facebook
            </a>
          )}
          {youtube && (
            <a href={youtube} className="block hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              YouTube
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Institucional</p>
          <Link href="/imoveis" className="block hover:text-[#DEAE5D]">
            Imóveis
          </Link>
          <Link href="/#sobre" className="block hover:text-[#DEAE5D]">
            Sobre
          </Link>
          <Link href="/#contato" className="block hover:text-[#DEAE5D]">
            Falar com um corretor
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-[90rem] px-4 py-4 text-xs text-white/70 md:px-8 2xl:max-w-[110rem]">
          © Grupo Ávila 2026
          <span className="mt-1 block">Todos os direitos reservados.</span>
        </p>
      </div>
    </footer>
  );
}

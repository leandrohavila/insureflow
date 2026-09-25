import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
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
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-10 md:grid-cols-3 md:gap-10 md:px-8 md:py-14 2xl:max-w-[110rem]">
        <div className="space-y-3 md:col-span-3">
          <BrandLogo src={config?.logoUrl} name={name} plate className="text-base" />
          {config?.creci && <p className="text-sm text-white/90">CRECI {config.creci}</p>}
          {config?.address && <p className="text-sm text-white/90">{config.address}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Contato</p>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center hover:text-[#DEAE5D]">
              {phone}
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} className="flex min-h-11 items-center hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex min-h-11 items-center break-all hover:text-[#DEAE5D]">
              {email}
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Redes</p>
          {instagram && (
            <a href={instagram} className="flex min-h-11 items-center hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {facebook && (
            <a href={facebook} className="flex min-h-11 items-center hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              Facebook
            </a>
          )}
          {youtube && (
            <a href={youtube} className="flex min-h-11 items-center hover:text-[#DEAE5D]" target="_blank" rel="noreferrer">
              YouTube
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Institucional</p>
          <Link href="/imoveis" className="flex min-h-11 items-center hover:text-[#DEAE5D]">
            Imóveis
          </Link>
          <Link href="/#sobre" className="flex min-h-11 items-center hover:text-[#DEAE5D]">
            Sobre
          </Link>
          <Link href="/#contato" className="flex min-h-11 items-center hover:text-[#DEAE5D]">
            Falar com um corretor
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-[90rem] px-4 py-4 text-xs text-white/85 md:px-8 2xl:max-w-[110rem]">
          © Grupo Ávila 2026
          <span className="mt-1 block text-white/85">Todos os direitos reservados.</span>
        </p>
      </div>
    </footer>
  );
}

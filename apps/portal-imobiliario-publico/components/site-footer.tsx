import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { TrackedAnchor } from "@/components/tracked-link";
import { attendanceWhatsappHref, companyName, socialHref } from "@/lib/commercial";
import { formatPhoneBR, formatWhatsAppDisplay } from "@/lib/utils";
import { whatsappShareHref } from "@/lib/seo";
import { LOCAL_SEO_PATHS, UBERABA_LANDINGS } from "@/lib/uberaba";
import type { PortalConfig } from "@/types/property";

const QUICK_LINKS = [
  { href: "/imoveis", label: "Imóveis" },
  { href: "/comprar", label: "Comprar" },
  { href: "/alugar", label: "Alugar" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#whatsapp", label: "WhatsApp" },
] as const;

export function SiteFooter({ config }: { config: PortalConfig | null }) {
  const name = companyName(config);
  const whatsapp = attendanceWhatsappHref(config?.whatsapp, name);
  const instagram = socialHref(config?.instagram);
  const facebook = socialHref(config?.facebook);
  const youtube = socialHref(config?.youtube);
  const phone = formatPhoneBR(config?.phone);
  const phoneHref = config?.phone?.replace(/\D/g, "") || null;
  const whatsappDisplay = formatWhatsAppDisplay(config?.whatsapp);
  const email = config?.email?.trim() || null;
  const address = config?.address?.trim() || "Uberaba, MG";
  const mapQuery = encodeURIComponent(address);
  const localLinks = UBERABA_LANDINGS.filter((item) =>
    (LOCAL_SEO_PATHS as readonly string[]).includes(item.path),
  );

  return (
    <footer className="bg-[#000C24] text-white">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-10 md:grid-cols-2 md:px-8 md:py-14 lg:grid-cols-4 2xl:max-w-[110rem]">
        <div className="space-y-3">
          <BrandLogo src={config?.logoUrl} name={name} plate className="text-base" />
          <p className="text-sm leading-relaxed text-white/85">
            Imobiliária em Uberaba para compra, venda e aluguel.
          </p>
          {config?.creci && <p className="text-sm text-white/90">CRECI {config.creci}</p>}
          <p className="text-sm text-white/90">{address}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Contato</p>
          {phone && phoneHref && (
            <a href={`tel:${phoneHref}`} className="flex min-h-11 items-center hover:text-[#DEAE5D]">
              {phone}
            </a>
          )}
          {whatsapp && (
            <TrackedAnchor
              event="whatsapp_click"
              eventLabel="rodape"
              href={whatsapp}
              className="flex min-h-11 items-center hover:text-[#DEAE5D]"
              target="_blank"
              rel="noreferrer"
            >
              {whatsappDisplay ? `WhatsApp ${whatsappDisplay}` : "WhatsApp"}
            </TrackedAnchor>
          )}
          <TrackedAnchor
            event="whatsapp_click"
            eventLabel="compartilhar-rodape"
            href={whatsappShareHref()}
            className="flex min-h-11 items-center hover:text-[#DEAE5D]"
            target="_blank"
            rel="noreferrer"
          >
            Compartilhar no WhatsApp
          </TrackedAnchor>
          {email && (
            <a href={`mailto:${email}`} className="flex min-h-11 items-center break-all hover:text-[#DEAE5D]">
              {email}
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Links rápidos</p>
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="flex min-h-11 items-center hover:text-[#DEAE5D]">
              {link.label}
            </Link>
          ))}
          {localLinks.map((link) => (
            <Link key={link.path} href={link.path} className="flex min-h-11 items-center hover:text-[#DEAE5D]">
              {link.title}
            </Link>
          ))}
          <p className="pt-3 font-semibold text-[#DEAE5D]">Redes sociais</p>
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
          {!instagram && !facebook && !youtube && (
            <p className="text-white/70">As redes aparecem quando estiverem cadastradas no portal.</p>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[#DEAE5D]">Mapa</p>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <iframe
              title={`Mapa de ${name} em Uberaba`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
              className="h-48 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            className="inline-flex min-h-11 items-center hover:text-[#DEAE5D]"
            target="_blank"
            rel="noreferrer"
          >
            Abrir mapa
          </a>
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

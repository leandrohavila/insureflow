import { Share2 } from "lucide-react";

import { TrackedAnchor } from "@/components/tracked-link";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { attendanceWhatsappHref, companyName } from "@/lib/commercial";
import { formatPhoneBR, formatWhatsAppDisplay } from "@/lib/utils";
import { whatsappShareHref } from "@/lib/seo";
import type { PortalConfig } from "@/types/property";

export function WhatsAppHighlight({ config }: { config: PortalConfig | null }) {
  const name = companyName(config);
  const direct = attendanceWhatsappHref(config?.whatsapp, name);
  const phone = formatPhoneBR(config?.phone);
  const whatsappNumber = formatWhatsAppDisplay(config?.whatsapp);
  const share = whatsappShareHref();

  return (
    <section
      id="whatsapp"
      className="scroll-mt-16 text-white"
      style={{ background: "linear-gradient(135deg, #000C24, #10294B)" }}
    >
      <div id="contato" className="mx-auto flex w-full max-w-3xl scroll-mt-16 flex-col items-center px-4 py-14 text-center md:py-20">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#000C24]">
          <WhatsAppIcon className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold md:text-4xl">Fale com um corretor no WhatsApp</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
          Envie o bairro, se quer comprar ou alugar, e o tipo de imóvel. A {name} responde com opções de Uberaba.
        </p>
        {(phone || whatsappNumber) && (
          <div className="mt-4 space-y-1 text-sm font-semibold text-[#DEAE5D]">
            {phone && <p>Telefone {phone}</p>}
            {whatsappNumber && <p>WhatsApp {whatsappNumber}</p>}
          </div>
        )}
        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {direct ? (
            <TrackedAnchor
              event="whatsapp_click"
              eventLabel="destaque-home"
              href={direct}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-semibold text-[#000C24] transition-colors duration-[400ms] hover:bg-[#1EBE5A] active:bg-[#075E54] active:text-white motion-reduce:transition-none sm:w-auto"
            >
              <WhatsAppIcon className="size-4 shrink-0" />
              Chamar no WhatsApp
            </TrackedAnchor>
          ) : (
            <a
              href="#busca"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
            >
              Buscar um imóvel
            </a>
          )}
          <TrackedAnchor
            event="whatsapp_click"
            eventLabel="compartilhar-home"
            href={share}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white hover:border-[#DEAE5D] hover:text-[#DEAE5D]"
          >
            <Share2 className="size-4" aria-hidden />
            Compartilhar no WhatsApp
          </TrackedAnchor>
        </div>
      </div>
    </section>
  );
}

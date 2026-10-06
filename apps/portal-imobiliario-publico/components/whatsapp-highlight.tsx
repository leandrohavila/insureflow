import { MessageCircle, Share2 } from "lucide-react";

import { TrackedAnchor } from "@/components/tracked-link";
import { attendanceWhatsappHref, companyName } from "@/lib/commercial";
import { whatsappShareHref } from "@/lib/seo";
import type { PortalConfig } from "@/types/property";

export function WhatsAppHighlight({ config }: { config: PortalConfig | null }) {
  const name = companyName(config);
  const direct = attendanceWhatsappHref(config?.whatsapp, name);
  const phone = config?.phone?.trim() || null;
  const share = whatsappShareHref();

  return (
    <section
      id="whatsapp"
      className="scroll-mt-16 text-white"
      style={{ background: "linear-gradient(135deg, #000C24, #10294B)" }}
    >
      <div id="contato" className="mx-auto flex w-full max-w-3xl scroll-mt-16 flex-col items-center px-4 py-14 text-center md:py-20">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#075E54] text-white">
          <MessageCircle className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-bold md:text-4xl">Fale com um corretor no WhatsApp</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
          Envie o bairro, se quer comprar ou alugar, e o tipo de imóvel. A {name} responde com opções de Uberaba.
        </p>
        {phone && <p className="mt-3 text-sm font-semibold text-[#DEAE5D]">{phone}</p>}
        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {direct ? (
            <TrackedAnchor
              event="whatsapp_click"
              eventLabel="destaque-home"
              href={direct}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
            >
              <MessageCircle className="size-4" aria-hidden />
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

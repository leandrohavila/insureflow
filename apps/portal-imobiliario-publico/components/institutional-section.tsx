import { TrackedAnchor } from "@/components/tracked-link";
import { InstitutionalVideo } from "@/components/institutional-video";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import {
  parseCaptionsUrl,
  parseInstitutionalVideoUrl,
  parsePosterUrl,
} from "@/lib/institutional-video";
import type { InstitutionalVideoConfig } from "@/types/property";

export const INSTITUTIONAL_SLOGAN = "Mais que imóveis. Realizamos histórias.";

function cssImageUrl(value: string) {
  return value.replace(/["\\\n\r]/g, "");
}

export function InstitutionalSection({
  image,
  aboutTitle,
  aboutText,
  differentials,
  contactHref,
  video,
}: {
  image: string | null;
  aboutTitle: string;
  aboutText: string;
  differentials: string[];
  contactHref: string | null;
  video: InstitutionalVideoConfig | null;
}) {
  const lead = aboutTitle.trim();
  const showLead = Boolean(lead) && lead.localeCompare(INSTITUTIONAL_SLOGAN, "pt-BR", { sensitivity: "accent" }) !== 0;
  const source = video?.active ? parseInstitutionalVideoUrl(video.url ?? "") : null;
  const poster = parsePosterUrl(video?.posterUrl ?? "");
  const captions = parseCaptionsUrl(video?.captionsUrl ?? "");

  return (
    <section id="sobre" aria-labelledby="institucional-titulo" className="scroll-mt-16 overflow-x-clip bg-white">
      <div className="mx-auto grid w-full min-w-0 max-w-[90rem] items-center gap-8 px-4 py-12 md:gap-12 md:px-8 md:py-20 lg:grid-cols-2 2xl:max-w-[110rem]">
        <div className="institutional-photo relative min-h-72 overflow-hidden rounded-[28px] shadow-[0_24px_50px_-28px_rgba(0,12,36,.65)] lg:min-h-[32rem]" style={image ? { backgroundImage: `url("${cssImageUrl(image)}")` } : undefined}>
          <div
            className="absolute inset-0"
            style={{
              background: image
                ? "linear-gradient(90deg, rgba(0,12,36,.55) 0%, rgba(0,12,36,.18) 24%, rgba(0,12,36,0) 48%), linear-gradient(180deg, rgba(0,12,36,.08), rgba(0,12,36,.45))"
                : "radial-gradient(ellipse 80% 70% at 70% 30%, #10294B 0%, #000C24 72%)",
            }}
            aria-hidden
          />
          {!image ? <div className="absolute -right-1/4 bottom-0 aspect-square w-2/3 rounded-full bg-[rgba(222,174,93,0.18)] blur-[80px]" aria-hidden /> : null}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#DEAE5D]" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">Posicionamento</p>
          <h2 id="institucional-titulo" className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-[#000C24] md:text-5xl">
            {INSTITUTIONAL_SLOGAN}
          </h2>
          {showLead ? <p className="mt-4 text-lg font-semibold text-[#10294B] md:text-xl">{lead}</p> : null}
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#10294B] md:text-lg">{aboutText}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {differentials.map((item) => (
              <li key={item} className="rounded-2xl border-t-4 border-[#C09048] bg-[#F6F1E8] p-4 text-sm font-semibold text-[#000C24]">
                {item}
              </li>
            ))}
          </ul>
          {contactHref ? (
            <TrackedAnchor
              event="whatsapp_click"
              eventLabel="sobre"
              href={contactHref}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-7 text-base font-semibold text-white shadow-[0_16px_36px_-14px_rgba(37,211,102,.9)] hover:bg-[#0b7a6e] sm:w-auto"
            >
              <WhatsAppIcon className="size-5" />
              Falar no WhatsApp
            </TrackedAnchor>
          ) : (
            <a
              href="#whatsapp"
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[#C09048] px-7 text-base font-semibold text-[#000C24] hover:bg-[#DEAE5D] sm:w-auto"
            >
              Falar com a imobiliária
            </a>
          )}
        </div>
      </div>
      {source ? (
        <div className="mx-auto w-full min-w-0 max-w-[90rem] px-4 pb-14 md:px-8 md:pb-20 2xl:max-w-[110rem]">
          <InstitutionalVideo
            source={source}
            title={
              video?.title?.trim() && video.title.trim().localeCompare(INSTITUTIONAL_SLOGAN, "pt-BR", { sensitivity: "accent" }) !== 0
                ? video.title.trim()
                : null
            }
            description={video?.description?.trim() || null}
            poster={poster}
            captions={captions}
          />
        </div>
      ) : null}
    </section>
  );
}

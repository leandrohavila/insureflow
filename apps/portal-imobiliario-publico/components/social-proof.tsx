import { Star } from "lucide-react";

import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { portalRating } from "@/lib/portal-metrics";
import { PORTAL_TESTIMONIALS } from "@/lib/social-proof";

export function SocialProof() {
  const rating = portalRating();
  const score = rating.score;
  const parsed = score ? Number(score.replace(",", ".")) : Number.NaN;
  const stars = Number.isFinite(parsed) ? Math.max(0, Math.min(5, Math.round(parsed))) : 0;

  return (
    <section id="depoimentos" className="scroll-mt-16 bg-[#F8F9FA] py-10 md:py-16" aria-labelledby="depoimentos-titulo">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">Prova social</p>
        <h2 id="depoimentos-titulo" className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-[#000C24] md:text-4xl">
          Quem busca imóvel em Uberaba encontra orientação clara
        </h2>
        <div className="mt-6 grid gap-4 rounded-[28px] bg-[#000C24] p-6 text-white shadow-[0_18px_40px_-24px_rgba(0,12,36,.55)] md:grid-cols-[auto_auto_1fr] md:items-center md:gap-8 md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#DEAE5D]">Avaliações {rating.source}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{rating.count ?? "Volume a publicar"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#DEAE5D]">Nota média</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{score ?? "A publicar"}</p>
            <div className="mt-2 flex gap-1" aria-hidden>
              {Array.from({ length: 5 }, (_, star) => (
                <Star
                  key={star}
                  className={`size-4 ${star < stars ? "fill-[#DEAE5D] text-[#DEAE5D]" : "text-white/30"}`}
                />
              ))}
            </div>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/80">
            Estrutura pronta para a nota e o volume de avaliações {rating.source}. Depoimentos nominais entram quando o
            cliente autorizar a publicação. Nenhuma avaliação externa é consultada nesta página.
          </p>
        </div>
        <TestimonialCarousel items={PORTAL_TESTIMONIALS} />
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#10294B]">
          Relatos ilustrativos do atendimento, separados da nota média e das avaliações reais.
        </p>
      </div>
    </section>
  );
}

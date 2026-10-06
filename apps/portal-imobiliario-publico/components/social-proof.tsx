const TESTIMONIALS = [
  {
    quote: "Precisava comparar casas no mesmo bairro e sair da visita com a proposta explicada.",
    name: "Cliente de compra",
    context: "Casa em Uberaba",
  },
  {
    quote: "Queria alugar sem perder tempo: opções do bairro e resposta no WhatsApp.",
    name: "Cliente de locação",
    context: "Apartamento em Uberaba",
  },
  {
    quote: "Buscava sala comercial e terreno com orientação clara antes de negociar.",
    name: "Cliente comercial",
    context: "Imóvel comercial em Uberaba",
  },
] as const;

export function SocialProof() {
  return (
    <section id="depoimentos" className="scroll-mt-16 bg-[#F8F9FA] py-8 md:py-16" aria-labelledby="depoimentos-titulo">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
        <h2 id="depoimentos-titulo" className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">
          Depoimentos
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#10294B]">
          Relatos ilustrativos do atendimento. Avaliações nominais entram quando o cliente autorizar a publicação.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li
              key={item.name}
              className="flex h-full flex-col rounded-[24px] border border-[#E6E8EC] bg-white p-6 shadow-[0_12px_32px_-18px_rgba(0,12,36,.18)]"
            >
              <blockquote className="text-base leading-relaxed text-[#000C24]">“{item.quote}”</blockquote>
              <footer className="mt-5">
                <p className="text-sm font-semibold text-[#000C24]">{item.name}</p>
                <p className="text-xs font-medium text-[#8a6a2f]">{item.context}</p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

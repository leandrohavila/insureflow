export type PortalTestimonial = {
  id: string;
  quote: string;
  name: string;
  context: string;
  source: "ilustrativo" | "google" | "cliente";
};

export const PORTAL_TESTIMONIALS: PortalTestimonial[] = [
  {
    id: "compra",
    quote: "Precisava comparar casas no mesmo bairro e sair da visita com a proposta explicada.",
    name: "Cliente de compra",
    context: "Casa em Uberaba",
    source: "ilustrativo",
  },
  {
    id: "locacao",
    quote: "Queria alugar sem perder tempo: opções do bairro e resposta no WhatsApp.",
    name: "Cliente de locação",
    context: "Apartamento em Uberaba",
    source: "ilustrativo",
  },
  {
    id: "comercial",
    quote: "Buscava sala comercial e terreno com orientação clara antes de negociar.",
    name: "Cliente comercial",
    context: "Imóvel comercial em Uberaba",
    source: "ilustrativo",
  },
];

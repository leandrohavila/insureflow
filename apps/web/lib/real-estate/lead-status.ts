import type { LeadStatus } from "@/lib/data-access/modules/leads"

/** Pipeline operacional do workspace imobiliário sobre o Lead único. */
export const REAL_ESTATE_LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Em Atendimento",
  qualified: "Visita Agendada",
  converted: "Convertido",
  lost: "Perdido",
}

export const REAL_ESTATE_LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  contacted: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  qualified: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  converted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-400/35 bg-rose-500/10 text-rose-200",
}

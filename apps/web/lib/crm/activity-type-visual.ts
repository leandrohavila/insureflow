import type { ComponentType, CSSProperties } from "react"
import {
  CalendarClock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  StickyNote,
  Users,
} from "lucide-react"

import type { StatusPillTone } from "@/components/crm/primitives"
import type { ActivityType } from "@/lib/data-access/modules/activities"

/**
 * Identidade visual unificada por tipo de atividade.
 *
 * Fonte da verdade única, consumida por:
 * - `ActivityTimeline` (nó da rail + accent do card)
 * - `TimelineLane` (chips de filtro)
 * - `ActivityTypeSelector` (chips do modal de atividade)
 *
 * Sem regras de negócio: apenas tipografia, ícone e mapeamento de tom
 * semântico (info / success / warn / brand / violet / neutral). Os tons
 * resolvem para tokens `--crm-tone-*` do crm-v2 — nenhuma cor é arbitrária.
 */

/**
 * Subconjunto das props aceitas pelos ícones do lucide-react que efetivamente
 * usamos pelo CRM. Inclui `style` para permitir injeção de cor inline a partir
 * dos accents `--crm-tone-*` (necessário quando `currentColor` não basta).
 */
type IconComponent = ComponentType<{
  className?: string
  strokeWidth?: number
  style?: CSSProperties
}>

export const activityTypeIcons: Record<ActivityType, IconComponent> = {
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  note: StickyNote,
  follow_up: CalendarClock,
}

/**
 * Tom semântico do `StatusPill`/accent visual por tipo. Mantém o mesmo
 * vocabulário usado pelas tokens `--crm-tone-*` (não inventa cores).
 *
 * Convenção:
 *   call      → info       (azul)   — contato síncrono
 *   whatsapp  → success    (verde)  — canal humano direto
 *   email     → neutral    (cinza)  — canal assíncrono formal
 *   meeting   → violet     (roxo)   — encontro presencial/virtual
 *   visit     → warn       (âmbar)  — visita externa, custo logístico
 *   note      → neutral    (cinza)  — registro interno
 *   follow_up → brand      (primary)— ação operacional ativa
 */
export const activityTypeTones: Record<ActivityType, StatusPillTone> = {
  call: "info",
  whatsapp: "success",
  email: "neutral",
  meeting: "violet",
  visit: "warn",
  note: "neutral",
  follow_up: "brand",
}

/**
 * Variável CSS correspondente ao tom, usada inline em `style={{ ... }}`
 * para iconografia e backgrounds derivados via `color-mix`. Apenas para
 * elementos que NÃO podem usar `StatusPill` (ex.: nó da timeline rail).
 */
export const activityTypeAccentVar: Record<ActivityType, string> = {
  call: "var(--crm-tone-info)",
  whatsapp: "var(--crm-tone-success)",
  email: "var(--crm-tone-neutral)",
  meeting: "var(--crm-tone-violet)",
  visit: "var(--crm-tone-warn)",
  note: "var(--crm-tone-neutral)",
  follow_up: "var(--crm-tone-brand)",
}

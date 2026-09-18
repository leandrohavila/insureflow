/**
 * CRM v2 — primitives (Fase 1 / foundation).
 *
 * Camada visual aditiva. Não substitui consumidores existentes; é consumida
 * pelos componentes que estão sendo modernizados módulo a módulo (Entity
 * Sheets → Kanban → Tables → ...).
 *
 * Princípios:
 * - Tokens via crm-v2 layer (crm-operational.css), nunca cores arbitrárias.
 * - Surface ladder explícita (panel / raised / overlay / row + hover).
 * - Tipografia operacional (crm-text-title/subtitle/meta/micro/metric).
 * - Hierarquia por whitespace + surface, não por bordas em toda lista.
 */

export {
  RecordRow,
  type RecordRowAccent,
  type RecordRowProps,
} from "./record-row"

export { SectionPanel, type SectionPanelTone } from "./section-panel"

export {
  StatusPill,
  type StatusPillTone,
  type StatusPillVariant,
  type StatusPillSize,
} from "./status-pill"

export { MetricStrip, type MetricStripTone } from "./metric-strip"

export {
  EntitySheetShell,
  type EntitySheetShellWidth,
} from "./entity-sheet-shell"

export { FilterChip, type FilterChipProps } from "./filter-chip"

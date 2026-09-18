/**
 * Layout operacional reutilizável — Header · KPIs · Workspace.
 * Padrão para CRM, Leads, Clientes, Questionários e demais módulos.
 */
export const dsOperationalWorkspace = {
  /** Coluna da página: header + métricas + workspace (workspace recebe flex:1). */
  page: {
    className:
      "flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--if-layout-section-gap)] overflow-hidden",
  },
  /** Variante densa — maximiza área do Kanban (CRM operacional). */
  pageDense: {
    className:
      "flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--if-layout-section-gap-dense)] overflow-hidden",
  },
  /** Área operacional — preenche altura restante abaixo de header/KPIs. */
  root: {
    className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  },
  /** Faixa de indicadores — nunca compete por altura com o workspace. */
  metrics: {
    className: "w-full min-w-0 shrink-0",
  },
  /** Toolbar/filtros acima do grid — shrink-0. */
  toolbar: {
    className: "mb-2 min-w-0 shrink-0",
  },
  toolbarDense: {
    className: "mb-1 min-w-0 shrink-0",
  },
  /** Grid principal + painel lateral — mesma altura (items-stretch). */
  grid: {
    className: "grid min-h-0 min-w-0 flex-1 items-stretch overflow-hidden",
    gapOpen: "gap-4 min-[1366px]:gap-5",
    gapClosed: "grid-cols-1",
  },
  /** Painel principal (pipeline, tabela, kanban). */
  main: {
    className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  },
  /** Painel lateral inline (≥1366px). */
  aside: {
    className:
      "hidden h-full min-h-0 min-w-0 shrink-0 overflow-hidden min-[1366px]:flex min-[1366px]:flex-col",
  },
  asideInner: {
    className: "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
  },
  asideScroll: {
    className:
      "flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
  },
} as const

/** Largura padrão do painel lateral operacional (px). */
export const DS_OPERATIONAL_ASIDE_WIDTH_PX = 320

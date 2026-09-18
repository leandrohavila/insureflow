/**
 * Pipeline / Kanban — layout estrutural via Flex (sem height fixa, vh ou max-height).
 * Visual das lanes/cards permanece em crm-operational.css (escopo CRM).
 */
export const dsPipeline = {
  board: {
    className:
      "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
  },
  /** Único scroll horizontal — encostado no rodapé do painel. */
  scroll: {
    className:
      "w-full min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
  },
  /** Fileira de colunas — inline-flex + w-max evita compressão; stretch em altura. */
  columns: {
    className:
      "pipeline-board-v2 inline-flex h-full min-h-full w-max flex-nowrap items-stretch gap-3 px-0.5",
  },
  laneWidthPx: 320,
  laneMinWidthPx: 280,
  laneCompactWidthPx: 280,
} as const

import type { CrmDensity } from "./crm-workspace-preferences"

/**
 * Contrato visual Compacto × Confortável do pipeline.
 * Os números abaixo são o que o quadro aplica (largura, altura, padding, campos).
 * A validação manual em `pipeline-density.validation.spec.ts` trava esse delta.
 */

export const PIPELINE_LANE_WIDTH_PX = {
  compact: 280,
  comfortable: 400,
} as const

export const PIPELINE_CARD_MIN_HEIGHT_PX = {
  compact: 96,
  comfortable: 148,
} as const

export const PIPELINE_CARD_GAP_PX = {
  compact: 8,
  comfortable: 12,
} as const

export const PIPELINE_COLUMN_GAP_PX = {
  compact: 12,
  comfortable: 16,
} as const

export const PIPELINE_BOARD_GAP_PX = {
  compact: 12,
  comfortable: 20,
} as const

export type PipelineDensityField =
  | "title"
  | "value"
  | "unit"
  | "ownerAvatar"
  | "company"
  | "contact"
  | "ownerName"
  | "product"
  | "stage"
  | "score"
  | "priority"
  | "questionnaire"
  | "interaction"
  | "phone"
  | "nextAction"

const COMPACT_FIELDS: readonly PipelineDensityField[] = [
  "title",
  "value",
  "company",
  "unit",
  "ownerAvatar",
  "ownerName",
  "nextAction",
  "product",
]

const COMFORTABLE_FIELDS: readonly PipelineDensityField[] = [
  ...COMPACT_FIELDS,
  "questionnaire",
]

export type PipelineDensityPresentation = {
  mode: CrmDensity
  compact: boolean
  cardClassName: "deal-card-v2--compact" | "deal-card-v2--comfortable"
  laneClassName: "pipeline-lane--compact" | "pipeline-lane--comfortable"
  headerClassName:
    | "pipeline-lane__header--compact"
    | "pipeline-lane__header--comfortable"
  dataDensity: CrmDensity
  laneWidthPx: number
  cardMinHeightPx: number
  cardGapPx: number
  cardPadding: string
  columnGapPx: number
  boardGapPx: number
  headerPaddingClassName: string
  metricsDensity: "compact" | "default"
  listDensity: "compact" | "default"
  visibleFields: readonly PipelineDensityField[]
}

export function resolvePipelineDensity(
  density: CrmDensity,
): PipelineDensityPresentation {
  const compact = density === "compact"
  return {
    mode: density,
    compact,
    cardClassName: compact
      ? "deal-card-v2--compact"
      : "deal-card-v2--comfortable",
    laneClassName: compact
      ? "pipeline-lane--compact"
      : "pipeline-lane--comfortable",
    headerClassName: compact
      ? "pipeline-lane__header--compact"
      : "pipeline-lane__header--comfortable",
    dataDensity: density,
    laneWidthPx: compact
      ? PIPELINE_LANE_WIDTH_PX.compact
      : PIPELINE_LANE_WIDTH_PX.comfortable,
    cardMinHeightPx: compact
      ? PIPELINE_CARD_MIN_HEIGHT_PX.compact
      : PIPELINE_CARD_MIN_HEIGHT_PX.comfortable,
    cardGapPx: compact
      ? PIPELINE_CARD_GAP_PX.compact
      : PIPELINE_CARD_GAP_PX.comfortable,
    cardPadding: compact ? "14px" : "16px",
    columnGapPx: compact
      ? PIPELINE_COLUMN_GAP_PX.compact
      : PIPELINE_COLUMN_GAP_PX.comfortable,
    boardGapPx: compact
      ? PIPELINE_BOARD_GAP_PX.compact
      : PIPELINE_BOARD_GAP_PX.comfortable,
    headerPaddingClassName: compact ? "py-1" : "py-3",
    metricsDensity: compact ? "compact" : "default",
    listDensity: compact ? "compact" : "default",
    visibleFields: compact ? COMPACT_FIELDS : COMFORTABLE_FIELDS,
  }
}

export function pipelineDensityShows(
  density: CrmDensity,
  field: PipelineDensityField,
): boolean {
  return resolvePipelineDensity(density).visibleFields.includes(field)
}

export type PipelineDensityManualCheck = {
  id: string
  label: string
  pass: boolean
}

/**
 * Roteiro da validação manual. Cada item precisa ser verdadeiro
 * para o operador perceber o modo ativo sem ler o botão.
 */
export function runPipelineDensityManualValidation(): PipelineDensityManualCheck[] {
  const compact = resolvePipelineDensity("compact")
  const comfortable = resolvePipelineDensity("comfortable")

  return [
    {
      id: "lane-width",
      label: "Coluna confortável é pelo menos 100px mais larga",
      pass: comfortable.laneWidthPx - compact.laneWidthPx >= 100,
    },
    {
      id: "card-height",
      label: "Card confortável é mais alto, sem dobrar a altura do compacto",
      pass:
        comfortable.cardMinHeightPx > compact.cardMinHeightPx &&
        comfortable.cardMinHeightPx < compact.cardMinHeightPx * 2,
    },
    {
      id: "card-padding",
      label: "Padding do card confortável é maior",
      pass: comfortable.cardPadding !== compact.cardPadding,
    },
    {
      id: "column-gap",
      label: "Espaço entre cards e entre colunas confortáveis é maior",
      pass:
        comfortable.columnGapPx > compact.columnGapPx &&
        comfortable.boardGapPx > compact.boardGapPx,
    },
    {
      id: "classes",
      label: "Classes CSS de card, coluna e cabeçalho divergem",
      pass:
        compact.cardClassName !== comfortable.cardClassName &&
        compact.laneClassName !== comfortable.laneClassName &&
        compact.headerClassName !== comfortable.headerClassName,
    },
    {
      id: "less-info",
      label: "Compacto mostra cliente, valor, responsável, próxima ação e ramo",
      pass:
        pipelineDensityShows("compact", "company") &&
        pipelineDensityShows("compact", "value") &&
        pipelineDensityShows("compact", "nextAction") &&
        pipelineDensityShows("compact", "ownerName") &&
        pipelineDensityShows("compact", "product") &&
        !pipelineDensityShows("compact", "phone") &&
        !pipelineDensityShows("compact", "questionnaire"),
    },
    {
      id: "more-info",
      label: "Confortável mantém a hierarquia e acrescenta o questionário",
      pass:
        pipelineDensityShows("comfortable", "company") &&
        pipelineDensityShows("comfortable", "ownerName") &&
        pipelineDensityShows("comfortable", "product") &&
        pipelineDensityShows("comfortable", "nextAction") &&
        pipelineDensityShows("comfortable", "questionnaire") &&
        !pipelineDensityShows("comfortable", "phone") &&
        comfortable.visibleFields.length > compact.visibleFields.length,
    },
    {
      id: "surfaces",
      label: "Métricas e lista também trocam de densidade",
      pass:
        compact.metricsDensity === "compact" &&
        comfortable.metricsDensity === "default" &&
        compact.listDensity === "compact" &&
        comfortable.listDensity === "default",
    },
  ]
}

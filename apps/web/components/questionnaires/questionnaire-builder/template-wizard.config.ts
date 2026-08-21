import {
  getBlockDefinition,
  getFieldDefinition,
  type BlockDefinition,
} from "@repo/forms-library"

export type WizardBranchId =
  | "auto"
  | "moto"
  | "truck"
  | "vida"
  | "residencial"
  | "empresarial"
  | "condominio"
  | "rural"
  | "equipamentos"
  | "personalizado"

export type WizardStartMode = "smart" | "blank"

export type WizardModuleOption = {
  id: string
  blockId: string
  label: string
  defaultSelected: boolean
}

export type WizardBranchCard = {
  id: WizardBranchId
  emoji: string
  title: string
  description: string
  category: string
  defaultName: string
}

export const WIZARD_BRANCHES: WizardBranchCard[] = [
  {
    id: "auto",
    emoji: "🚗",
    title: "Seguro Auto",
    description: "Veículos leves e passeio",
    category: "Auto",
    defaultName: "Seguro Auto — Cotação",
  },
  {
    id: "moto",
    emoji: "🏍",
    title: "Seguro Moto",
    description: "Motocicletas e ciclomotores",
    category: "Moto",
    defaultName: "Seguro Moto — Cotação",
  },
  {
    id: "truck",
    emoji: "🚛",
    title: "Seguro Caminhão",
    description: "Frota e carga rodoviária",
    category: "Caminhão",
    defaultName: "Seguro Caminhão — Cotação",
  },
  {
    id: "vida",
    emoji: "❤️",
    title: "Seguro Vida",
    description: "Proteção pessoal e familiar",
    category: "Vida",
    defaultName: "Seguro Vida — Proposta",
  },
  {
    id: "residencial",
    emoji: "🏠",
    title: "Seguro Residencial",
    description: "Casas e apartamentos",
    category: "Residencial",
    defaultName: "Seguro Residencial — Cotação",
  },
  {
    id: "empresarial",
    emoji: "🏢",
    title: "Seguro Empresarial",
    description: "PMEs e operações comerciais",
    category: "Empresarial",
    defaultName: "Seguro Empresarial — Cotação",
  },
  {
    id: "condominio",
    emoji: "🏢",
    title: "Condomínio",
    description: "Áreas comuns e patrimônio",
    category: "Condomínio",
    defaultName: "Seguro Condomínio — Cotação",
  },
  {
    id: "rural",
    emoji: "🚜",
    title: "Rural",
    description: "Propriedades e atividade agrícola",
    category: "Rural",
    defaultName: "Seguro Rural — Cotação",
  },
  {
    id: "equipamentos",
    emoji: "📦",
    title: "Equipamentos",
    description: "Máquinas e bens móveis",
    category: "Equipamentos",
    defaultName: "Seguro de Equipamentos — Cotação",
  },
  {
    id: "personalizado",
    emoji: "📋",
    title: "Personalizado",
    description: "Monte do zero no canvas",
    category: "Personalizado",
    defaultName: "Questionário Personalizado",
  },
]

const AUTO_MODULES: WizardModuleOption[] = [
  { id: "personal", blockId: "auto.block.personal_data", label: "Dados Pessoais", defaultSelected: true },
  { id: "vehicle", blockId: "auto.block.vehicle", label: "Veículo", defaultSelected: true },
  { id: "main_driver", blockId: "auto.block.main_driver", label: "Condutor Principal", defaultSelected: true },
  { id: "second_driver", blockId: "auto.block.second_driver", label: "Segundo Condutor", defaultSelected: false },
  { id: "usage", blockId: "auto.block.garage", label: "Perfil de Utilização", defaultSelected: false },
  { id: "coverages", blockId: "auto.block.coverages", label: "Coberturas", defaultSelected: false },
  { id: "claims", blockId: "auto.block.claims_history", label: "Histórico de Sinistro", defaultSelected: false },
]

const VIDA_MODULES: WizardModuleOption[] = [
  { id: "insured", blockId: "vida.block.insured", label: "Segurado", defaultSelected: true },
  { id: "beneficiary", blockId: "vida.block.beneficiary", label: "Beneficiário", defaultSelected: true },
  { id: "health", blockId: "vida.block.health", label: "Saúde", defaultSelected: false },
  { id: "habits", blockId: "vida.block.habits", label: "Hábitos", defaultSelected: false },
  { id: "profession", blockId: "vida.block.profession", label: "Profissão", defaultSelected: false },
  { id: "income", blockId: "vida.block.income", label: "Renda", defaultSelected: false },
]

const RES_MODULES: WizardModuleOption[] = [
  { id: "property", blockId: "res.block.property", label: "Imóvel", defaultSelected: true },
  { id: "construction", blockId: "res.block.construction", label: "Construção", defaultSelected: true },
  { id: "contents", blockId: "res.block.contents", label: "Conteúdo", defaultSelected: false },
  { id: "security", blockId: "res.block.security", label: "Segurança", defaultSelected: false },
]

const BIZ_MODULES: WizardModuleOption[] = [
  { id: "company", blockId: "biz.block.company", label: "Empresa", defaultSelected: true },
  { id: "employees", blockId: "biz.block.employees", label: "Funcionários", defaultSelected: false },
  { id: "revenue", blockId: "biz.block.revenue", label: "Faturamento", defaultSelected: false },
  { id: "equipment", blockId: "biz.block.equipment", label: "Equipamentos", defaultSelected: false },
]

export const WIZARD_MODULES: Record<WizardBranchId, WizardModuleOption[]> = {
  auto: AUTO_MODULES,
  moto: AUTO_MODULES.map((item) =>
    item.id === "vehicle"
      ? { ...item, label: "Moto / Veículo" }
      : item,
  ),
  truck: AUTO_MODULES.map((item) =>
    item.id === "vehicle"
      ? { ...item, label: "Caminhão / Veículo" }
      : item,
  ),
  vida: VIDA_MODULES,
  residencial: RES_MODULES,
  empresarial: BIZ_MODULES,
  condominio: RES_MODULES.map((item) =>
    item.id === "property"
      ? { ...item, label: "Condomínio / Imóvel" }
      : item,
  ),
  rural: [
    { id: "property", blockId: "res.block.property", label: "Propriedade Rural", defaultSelected: true },
    { id: "contents", blockId: "res.block.contents", label: "Benfeitorias", defaultSelected: true },
    { id: "equipment", blockId: "biz.block.equipment", label: "Equipamentos", defaultSelected: false },
  ],
  equipamentos: [
    { id: "company", blockId: "biz.block.company", label: "Tomador", defaultSelected: true },
    { id: "equipment", blockId: "biz.block.equipment", label: "Equipamentos", defaultSelected: true },
  ],
  personalizado: [],
}

export function getWizardBranch(id: WizardBranchId) {
  return WIZARD_BRANCHES.find((branch) => branch.id === id)
}

export function resolveWizardBlocks(
  branchId: WizardBranchId,
  selectedModuleIds: string[],
): BlockDefinition[] {
  const modules = WIZARD_MODULES[branchId] ?? []
  const selected = new Set(selectedModuleIds)
  const blocks: BlockDefinition[] = []
  const seen = new Set<string>()

  for (const wizardModule of modules) {
    if (!selected.has(wizardModule.id)) continue
    const block = getBlockDefinition(wizardModule.blockId)
    if (!block || seen.has(block.id)) continue
    seen.add(block.id)
    blocks.push(block)
  }

  return blocks
}

export function defaultSelectedModuleIds(branchId: WizardBranchId): string[] {
  return (WIZARD_MODULES[branchId] ?? [])
    .filter((wizardModule) => wizardModule.defaultSelected)
    .map((wizardModule) => wizardModule.id)
}

export type WizardBlueprintStats = {
  questionCount: number
  sectionCount: number
  ruleCount: number
  validationCount: number
  blockLabels: string[]
}

export function computeWizardBlueprintStats(
  branchId: WizardBranchId,
  selectedModuleIds: string[],
): WizardBlueprintStats {
  const blocks = resolveWizardBlocks(branchId, selectedModuleIds)
  const sections = new Set<string>()
  let questionCount = 0
  let ruleCount = 0
  let validationCount = 0

  for (const block of blocks) {
    sections.add(block.section)
    questionCount += block.preview.fieldCount
    ruleCount += block.defaultRules?.length ?? 0
    for (const fieldId of block.fieldIds) {
      const field = getFieldDefinition(fieldId)
      if (field?.validation) validationCount += 1
    }
  }

  return {
    questionCount,
    sectionCount: sections.size,
    ruleCount,
    validationCount,
    blockLabels: blocks.map((block) => block.label),
  }
}

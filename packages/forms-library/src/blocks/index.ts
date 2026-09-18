import type { FormRuleDefinition } from "@repo/forms-engine"
import type { BlockDefinition } from "../metadata/types"

function block(partial: BlockDefinition): BlockDefinition {
  return partial
}

const secondDriverRules: FormRuleDefinition[] = [
  {
    id: "auto_second_driver_show",
    name: "Exibir segundo condutor",
    enabled: true,
    conditionLogic: "and",
    conditions: [
      { fieldKey: "has_second_driver", operator: "equals", value: true },
    ],
    actions: [
      { type: "showField", targetFieldKey: "second_driver_name" },
      { type: "showField", targetFieldKey: "second_driver_cpf" },
      { type: "requireField", targetFieldKey: "second_driver_name" },
    ],
  },
]

const garageRules: FormRuleDefinition[] = [
  {
    id: "auto_garage_type",
    name: "Tipo de garagem",
    enabled: true,
    conditions: [{ fieldKey: "has_garage", operator: "equals", value: true }],
    actions: [{ type: "showField", targetFieldKey: "garage_type" }],
  },
]

const claimsRules: FormRuleDefinition[] = [
  {
    id: "auto_claims_count",
    name: "Quantidade de sinistros",
    enabled: true,
    conditions: [{ fieldKey: "had_claims", operator: "equals", value: true }],
    actions: [
      { type: "showField", targetFieldKey: "claims_count" },
      { type: "requireField", targetFieldKey: "claims_count" },
    ],
  },
]

const healthRules: FormRuleDefinition[] = [
  {
    id: "vida_health_details",
    name: "Detalhes de saúde",
    enabled: true,
    conditions: [
      { fieldKey: "has_health_conditions", operator: "equals", value: true },
    ],
    actions: [
      { type: "showField", targetFieldKey: "health_details" },
      { type: "requireField", targetFieldKey: "health_details" },
    ],
  },
]

export const autoBlocks: BlockDefinition[] = [
  block({
    id: "auto.block.personal_data",
    name: "personal_data",
    label: "Dados Pessoais",
    description: "Identificação básica do proponente.",
    product: "auto",
    section: "Dados pessoais",
    fieldIds: [
      "shared.full_name",
      "shared.cpf",
      "shared.birth_date",
      "shared.email",
      "shared.phone",
    ],
    tags: ["pessoal", "identificacao", "auto"],
    icon: "user",
    documentation: "Bloco padrão de identificação para seguro auto.",
    preview: {
      summary: "Nome, CPF, nascimento, e-mail e telefone.",
      fieldCount: 5,
      highlights: ["CPF validado", "Contato completo"],
    },
  }),
  block({
    id: "auto.block.vehicle",
    name: "vehicle",
    label: "Veículo",
    description: "Dados completos do veículo segurado.",
    product: "auto",
    section: "Veículo",
    fieldIds: [
      "auto.plate",
      "auto.brand",
      "auto.model",
      "auto.year",
      "auto.chassi",
      "auto.renavam",
    ],
    tags: ["veiculo", "placa", "auto"],
    icon: "car",
    preview: {
      summary: "Placa, marca, modelo, ano, chassi e renavam.",
      fieldCount: 6,
      highlights: ["Validação de placa", "Dados FIPE-ready"],
    },
  }),
  block({
    id: "auto.block.main_driver",
    name: "main_driver",
    label: "Condutor Principal",
    description: "Informações do condutor principal.",
    product: "auto",
    section: "Condutores",
    fieldIds: [
      "auto.main_driver_name",
      "auto.main_driver_cpf",
      "auto.main_driver_license",
    ],
    tags: ["condutor", "cnh"],
    icon: "user",
    preview: {
      summary: "Nome, CPF e CNH do condutor principal.",
      fieldCount: 3,
      highlights: ["Perfil do condutor"],
    },
  }),
  block({
    id: "auto.block.second_driver",
    name: "second_driver",
    label: "Segundo Condutor",
    description: "Segundo condutor com regras condicionais embutidas.",
    product: "auto",
    section: "Condutores",
    fieldIds: [
      "auto.has_second_driver",
      "auto.second_driver_name",
      "auto.second_driver_cpf",
    ],
    defaultRules: secondDriverRules,
    tags: ["segundo condutor", "condicional"],
    icon: "users",
    documentation: "Inclui regra: campos do 2º condutor visíveis quando has_second_driver = true.",
    preview: {
      summary: "Pergunta sim/não + dados condicionais do 2º condutor.",
      fieldCount: 3,
      highlights: ["Regras padrão incluídas"],
    },
  }),
  block({
    id: "auto.block.garage",
    name: "garage",
    label: "Garagem",
    description: "Local de pernoite e tipo de garagem.",
    product: "auto",
    section: "Perfil de uso",
    fieldIds: ["auto.has_garage", "auto.garage_type"],
    defaultRules: garageRules,
    tags: ["garagem", "pernoite"],
    icon: "warehouse",
    preview: {
      summary: "Garagem sim/não e tipo de estacionamento.",
      fieldCount: 2,
      highlights: ["Regra condicional de tipo"],
    },
  }),
  block({
    id: "auto.block.claims_history",
    name: "claims_history",
    label: "Histórico de Sinistro",
    description: "Sinistros nos últimos 5 anos.",
    product: "auto",
    section: "Histórico do segurado",
    fieldIds: ["auto.had_claims", "auto.claims_count"],
    defaultRules: claimsRules,
    tags: ["sinistro", "historico"],
    icon: "alert-triangle",
    preview: {
      summary: "Indicador de sinistro e quantidade.",
      fieldCount: 2,
      highlights: ["Campo quantidade condicional"],
    },
  }),
  block({
    id: "auto.block.coverages",
    name: "coverages",
    label: "Coberturas",
    description: "Modalidade de cobertura desejada.",
    product: "auto",
    section: "Cobertura",
    fieldIds: ["auto.coverage_type"],
    tags: ["cobertura", "modalidade"],
    icon: "shield",
    preview: {
      summary: "Seleção de modalidade de cobertura.",
      fieldCount: 1,
      highlights: ["Compreensiva / Terceiros"],
    },
  }),
]

export const vidaBlocks: BlockDefinition[] = [
  block({
    id: "vida.block.insured",
    name: "insured",
    label: "Segurado",
    description: "Dados do segurado principal.",
    product: "vida",
    section: "Segurado",
    fieldIds: [
      "vida.insured_name",
      "shared.cpf",
      "shared.birth_date",
      "shared.email",
      "shared.phone",
    ],
    tags: ["segurado", "vida"],
    icon: "user",
    preview: {
      summary: "Identificação completa do segurado.",
      fieldCount: 5,
      highlights: ["CPF + contato"],
    },
  }),
  block({
    id: "vida.block.beneficiary",
    name: "beneficiary",
    label: "Beneficiário",
    description: "Beneficiário principal da apólice.",
    product: "vida",
    section: "Beneficiários",
    fieldIds: ["vida.beneficiary_name", "vida.beneficiary_relationship"],
    tags: ["beneficiario"],
    icon: "heart",
    preview: {
      summary: "Nome e parentesco do beneficiário.",
      fieldCount: 2,
      highlights: ["Parentesco configurável"],
    },
  }),
  block({
    id: "vida.block.income",
    name: "income",
    label: "Renda",
    description: "Renda mensal declarada.",
    product: "vida",
    section: "Financeiro",
    fieldIds: ["vida.monthly_income"],
    tags: ["renda", "financeiro"],
    icon: "credit-card",
    preview: {
      summary: "Campo monetário de renda mensal.",
      fieldCount: 1,
      highlights: ["Moeda BRL"],
    },
  }),
  block({
    id: "vida.block.health",
    name: "health",
    label: "Saúde",
    description: "Condições de saúde com regra condicional.",
    product: "vida",
    section: "Saúde",
    fieldIds: ["vida.has_health_conditions", "vida.health_details"],
    defaultRules: healthRules,
    tags: ["saude", "condicional"],
    icon: "heart-pulse",
    preview: {
      summary: "Pergunta sim/não + detalhes condicionais.",
      fieldCount: 2,
      highlights: ["Regras padrão incluídas"],
    },
  }),
  block({
    id: "vida.block.habits",
    name: "habits",
    label: "Hábitos",
    description: "Hábitos relevantes para subscrição.",
    product: "vida",
    section: "Hábitos",
    fieldIds: ["vida.smoker"],
    tags: ["habitos", "fumante"],
    icon: "cigarette",
    preview: {
      summary: "Indicador de tabagismo.",
      fieldCount: 1,
      highlights: ["Sim/Não"],
    },
  }),
  block({
    id: "vida.block.profession",
    name: "profession",
    label: "Profissão",
    description: "Ocupação principal do segurado.",
    product: "vida",
    section: "Profissão",
    fieldIds: ["vida.occupation"],
    tags: ["profissao"],
    icon: "briefcase",
    preview: {
      summary: "Campo de profissão/ocupação.",
      fieldCount: 1,
      highlights: ["Texto livre"],
    },
  }),
]

export const residencialBlocks: BlockDefinition[] = [
  block({
    id: "res.block.property",
    name: "property",
    label: "Imóvel",
    description: "Características básicas do imóvel.",
    product: "residencial",
    section: "Imóvel",
    fieldIds: ["res.property_type", "shared.cep", "shared.address"],
    tags: ["imovel", "endereco"],
    icon: "home",
    preview: {
      summary: "Tipo, CEP e endereço.",
      fieldCount: 3,
      highlights: ["CEP validado"],
    },
  }),
  block({
    id: "res.block.construction",
    name: "construction",
    label: "Construção",
    description: "Tipo de construção do imóvel.",
    product: "residencial",
    section: "Construção",
    fieldIds: ["res.construction_type"],
    tags: ["construcao"],
    icon: "building",
    preview: {
      summary: "Material de construção.",
      fieldCount: 1,
      highlights: ["Alvenaria / Madeira / Mista"],
    },
  }),
  block({
    id: "res.block.contents",
    name: "contents",
    label: "Conteúdo",
    description: "Valores do imóvel e conteúdo.",
    product: "residencial",
    section: "Conteúdo",
    fieldIds: ["res.property_value", "res.contents_value"],
    tags: ["conteudo", "valor"],
    icon: "package",
    preview: {
      summary: "Valores estimados de imóvel e conteúdo.",
      fieldCount: 2,
      highlights: ["Campos monetários"],
    },
  }),
  block({
    id: "res.block.security",
    name: "security",
    label: "Segurança",
    description: "Dispositivos de segurança instalados.",
    product: "residencial",
    section: "Segurança",
    fieldIds: ["res.has_alarm", "res.has_cameras"],
    tags: ["seguranca", "alarme"],
    icon: "shield",
    preview: {
      summary: "Alarme e câmeras.",
      fieldCount: 2,
      highlights: ["Perfil de risco"],
    },
  }),
]

export const empresarialBlocks: BlockDefinition[] = [
  block({
    id: "biz.block.company",
    name: "company",
    label: "Empresa",
    description: "Identificação da empresa.",
    product: "empresarial",
    section: "Empresa",
    fieldIds: [
      "biz.company_name",
      "shared.cnpj",
      "biz.business_activity",
      "shared.email",
      "shared.phone",
    ],
    tags: ["empresa", "cnpj"],
    icon: "building",
    preview: {
      summary: "Razão social, CNPJ, ramo e contato.",
      fieldCount: 5,
      highlights: ["CNPJ validado"],
    },
  }),
  block({
    id: "biz.block.employees",
    name: "employees",
    label: "Funcionários",
    description: "Quantidade de colaboradores.",
    product: "empresarial",
    section: "Funcionários",
    fieldIds: ["biz.employee_count"],
    tags: ["funcionarios", "rh"],
    icon: "users",
    preview: {
      summary: "Número de funcionários.",
      fieldCount: 1,
      highlights: ["Numérico"],
    },
  }),
  block({
    id: "biz.block.revenue",
    name: "revenue",
    label: "Faturamento",
    description: "Faturamento anual estimado.",
    product: "empresarial",
    section: "Faturamento",
    fieldIds: ["biz.annual_revenue"],
    tags: ["faturamento", "financeiro"],
    icon: "credit-card",
    preview: {
      summary: "Receita bruta anual.",
      fieldCount: 1,
      highlights: ["Moeda BRL"],
    },
  }),
  block({
    id: "biz.block.equipment",
    name: "equipment",
    label: "Equipamentos",
    description: "Equipamentos a segurar.",
    product: "empresarial",
    section: "Equipamentos",
    fieldIds: ["biz.equipment_value", "biz.equipment_list"],
    tags: ["equipamentos"],
    icon: "wrench",
    preview: {
      summary: "Valor total e lista descritiva.",
      fieldCount: 2,
      highlights: ["Valor + detalhamento"],
    },
  }),
]

export const allBlocks: BlockDefinition[] = [
  ...autoBlocks,
  ...vidaBlocks,
  ...residencialBlocks,
  ...empresarialBlocks,
]

export const blockCatalogById = new Map(allBlocks.map((item) => [item.id, item]))

export function getBlockDefinition(id: string): BlockDefinition | undefined {
  return blockCatalogById.get(id)
}

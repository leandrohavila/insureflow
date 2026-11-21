import type { FormRuleDefinition } from "@repo/forms-engine"

export const INTELLIGENT_FORM_BRANCHES = [
  "auto",
  "residencial",
  "empresarial",
] as const

export type IntelligentFormBranch = (typeof INTELLIGENT_FORM_BRANCHES)[number]

export const INTELLIGENT_FORM_CATALOG_VERSION = 1

const YES_NO = [
  { label: "Sim", value: "yes" },
  { label: "Não", value: "no" },
]

type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CURRENCY"

type FieldDraft = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  helpText?: string
  placeholder?: string
  options?: { label: string; value: string }[]
  validation?: { version: 1; rules: Array<Record<string, unknown>> }
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
}

export type IntelligentFormField = FieldDraft & {
  order: number
  sectionKey: string
  sectionTitle: string
  required: boolean
}

export type IntelligentFormSection = {
  key: string
  title: string
  order: number
}

export type IntelligentFormDefinition = {
  branch: IntelligentFormBranch
  catalogVersion: number
  name: string
  description: string
  sections: IntelligentFormSection[]
  fields: IntelligentFormField[]
  rules: FormRuleDefinition[]
}

function rule(
  id: string,
  name: string,
  conditions: FormRuleDefinition["conditions"],
  actions: FormRuleDefinition["actions"],
  conditionLogic?: "and" | "or",
): FormRuleDefinition {
  return {
    id,
    name,
    enabled: true,
    ...(conditionLogic ? { conditionLogic } : {}),
    conditions,
    actions,
  }
}

function showWhenEquals(
  id: string,
  sourceKey: string,
  value: string,
  targets: Array<{ key: string; required?: boolean }>,
): FormRuleDefinition[] {
  return [
    rule(
      `${id}-show`,
      `Exibir ${targets.map((target) => target.key).join(", ")}`,
      [{ fieldKey: sourceKey, operator: "equals", value }],
      targets.flatMap((target) => [
        { type: "showField" as const, targetFieldKey: target.key },
        ...(target.required
          ? [{ type: "requireField" as const, targetFieldKey: target.key }]
          : []),
      ]),
    ),
    rule(
      `${id}-hide`,
      `Ocultar ${targets.map((target) => target.key).join(", ")}`,
      [{ fieldKey: sourceKey, operator: "notEquals", value }],
      targets.map((target) => ({
        type: "hideField" as const,
        targetFieldKey: target.key,
      })),
    ),
  ]
}

function showWhenIn(
  id: string,
  sourceKey: string,
  values: string[],
  targets: Array<{ key: string; required?: boolean }>,
): FormRuleDefinition[] {
  return [
    rule(
      `${id}-show`,
      `Exibir ${targets.map((target) => target.key).join(", ")}`,
      [{ fieldKey: sourceKey, operator: "in", value: values }],
      targets.flatMap((target) => [
        { type: "showField" as const, targetFieldKey: target.key },
        ...(target.required
          ? [{ type: "requireField" as const, targetFieldKey: target.key }]
          : []),
      ]),
    ),
    rule(
      `${id}-hide`,
      `Ocultar ${targets.map((target) => target.key).join(", ")}`,
      [{ fieldKey: sourceKey, operator: "notIn", value: values }],
      targets.map((target) => ({
        type: "hideField" as const,
        targetFieldKey: target.key,
      })),
    ),
  ]
}

function showWhenAnyEquals(
  id: string,
  triggers: Array<{ key: string; value: string }>,
  targets: string[],
): FormRuleDefinition[] {
  return [
    ...triggers.map((trigger, index) =>
      rule(
        `${id}-show-${index + 1}`,
        `Exibir ${targets.join(", ")}`,
        [{ fieldKey: trigger.key, operator: "equals", value: trigger.value }],
        targets.map((key) => ({ type: "showField" as const, targetFieldKey: key })),
      ),
    ),
    rule(
      `${id}-hide`,
      `Ocultar ${targets.join(", ")}`,
      triggers.map((trigger) => ({
        fieldKey: trigger.key,
        operator: "notEquals" as const,
        value: trigger.value,
      })),
      targets.map((key) => ({ type: "hideField" as const, targetFieldKey: key })),
      "and",
    ),
  ]
}

function assemble(input: {
  branch: IntelligentFormBranch
  name: string
  description: string
  sections: Array<{ key: string; title: string; fields: FieldDraft[] }>
  rules: FormRuleDefinition[]
}): IntelligentFormDefinition {
  let order = 0
  const sections = input.sections.map((section, index) => ({
    key: section.key,
    title: section.title,
    order: index,
  }))
  const fields = input.sections.flatMap((section) =>
    section.fields.map((field) => {
      const next: IntelligentFormField = {
        ...field,
        required: field.required ?? false,
        order,
        sectionKey: section.key,
        sectionTitle: section.title,
      }
      order += 1
      return next
    }),
  )
  return {
    branch: input.branch,
    catalogVersion: INTELLIGENT_FORM_CATALOG_VERSION,
    name: input.name,
    description: input.description,
    sections,
    fields,
    rules: input.rules,
  }
}

const cpf = { version: 1 as const, rules: [{ type: "cpf" }] }
const cnpj = { version: 1 as const, rules: [{ type: "cnpj" }] }
const cep = { version: 1 as const, rules: [{ type: "cep" }] }
const plate = { version: 1 as const, rules: [{ type: "plate" }] }
const chassi = { version: 1 as const, rules: [{ type: "chassi" }] }
const year = {
  version: 1 as const,
  rules: [
    { type: "min", value: 1950 },
    { type: "max", value: 2035 },
  ],
}

const AUTO_FORM = assemble({
  branch: "auto",
  name: "Questionário Automóvel",
  description: "Preenchimento interno do seguro de automóvel.",
  sections: [
    {
      key: "vehicle_identification",
      title: "Dados do veículo",
      fields: [
        { key: "brand", label: "Marca", type: "TEXT", required: true },
        { key: "model", label: "Modelo", type: "TEXT", required: true },
        {
          key: "manufacture_year",
          label: "Ano de fabricação",
          type: "NUMBER",
          required: true,
          validation: year,
        },
        {
          key: "model_year",
          label: "Ano do modelo",
          type: "NUMBER",
          required: true,
          validation: year,
        },
        { key: "version", label: "Versão", type: "TEXT" },
        {
          key: "vehicle_condition",
          label: "Veículo zero ou usado",
          type: "SELECT",
          required: true,
          options: [
            { label: "Zero", value: "new" },
            { label: "Usado", value: "used" },
          ],
        },
        {
          key: "plate",
          label: "Placa",
          type: "TEXT",
          mask: "plate",
          validation: plate,
          placeholder: "ABC1D23",
        },
        {
          key: "needs_chassis",
          label: "Informar chassi?",
          type: "SELECT",
          options: YES_NO,
          helpText: "Use quando a placa não identificar o veículo.",
        },
        {
          key: "chassis",
          label: "Chassi",
          type: "TEXT",
          validation: chassi,
        },
      ],
    },
    {
      key: "driver",
      title: "Condutor",
      fields: [
        {
          key: "driver_name",
          label: "Nome do condutor principal",
          type: "TEXT",
          required: true,
        },
        {
          key: "driver_cpf",
          label: "CPF",
          type: "TEXT",
          required: true,
          mask: "cpf",
          validation: cpf,
        },
        {
          key: "driver_birth_date",
          label: "Data de nascimento",
          type: "DATE",
          required: true,
        },
        {
          key: "driver_relationship",
          label: "Relação com o proprietário",
          type: "SELECT",
          required: true,
          options: [
            { label: "O próprio proprietário", value: "self" },
            { label: "Cônjuge ou companheiro(a)", value: "spouse" },
            { label: "Filho(a)", value: "child" },
            { label: "Pai ou mãe", value: "parent" },
            { label: "Funcionário", value: "employee" },
            { label: "Outra", value: "other" },
          ],
        },
        {
          key: "marital_status",
          label: "Estado civil",
          type: "SELECT",
          options: [
            { label: "Solteiro(a)", value: "single" },
            { label: "Casado(a)", value: "married" },
            { label: "União estável", value: "stable_union" },
            { label: "Divorciado(a)", value: "divorced" },
            { label: "Viúvo(a)", value: "widowed" },
          ],
        },
      ],
    },
    {
      key: "usage",
      title: "Utilização",
      fields: [
        {
          key: "use_purpose",
          label: "Particular ou comercial",
          type: "SELECT",
          required: true,
          options: [
            { label: "Particular", value: "particular" },
            { label: "Comercial", value: "commercial" },
          ],
        },
        {
          key: "work_use",
          label: "Uso para trabalho",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "ride_apps",
          label: "Aplicativos de transporte",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "mileage",
          label: "Quilometragem aproximada",
          type: "NUMBER",
          placeholder: "Km por mês",
        },
      ],
    },
    {
      key: "garage",
      title: "Garagem e pernoite",
      fields: [
        {
          key: "garage_home",
          label: "Possui garagem na residência?",
          type: "SELECT",
          required: true,
          options: YES_NO,
        },
        {
          key: "garage_work",
          label: "Possui garagem no trabalho?",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "parking_place",
          label: "Local habitual de estacionamento",
          type: "SELECT",
          required: true,
          options: [
            { label: "Residência", value: "home" },
            { label: "Trabalho", value: "work" },
            { label: "Rua", value: "street" },
            { label: "Outro", value: "other" },
          ],
        },
        {
          key: "garage_notes",
          label: "Outras informações de garagem e pernoite",
          type: "TEXTAREA",
        },
      ],
    },
    {
      key: "insurance_history",
      title: "Histórico",
      fields: [
        {
          key: "has_insurance",
          label: "Possui seguro atualmente?",
          type: "SELECT",
          required: true,
          options: YES_NO,
        },
        { key: "current_insurer", label: "Seguradora atual", type: "TEXT" },
        {
          key: "renewal_type",
          label: "Renovação ou seguro novo?",
          type: "SELECT",
          required: true,
          options: [
            { label: "Seguro novo", value: "new" },
            { label: "Renovação", value: "renewal" },
          ],
        },
        {
          key: "previous_claims",
          label: "Sinistros anteriores?",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "claims_details",
          label: "Informações dos sinistros",
          type: "TEXTAREA",
        },
        {
          key: "history_notes",
          label: "Informações complementares",
          type: "TEXTAREA",
        },
      ],
    },
    {
      key: "coverages",
      title: "Coberturas",
      fields: [
        {
          key: "coverage_desired",
          label: "Cobertura desejada",
          type: "SELECT",
          required: true,
          options: [
            { label: "Compreensiva", value: "comprehensive" },
            { label: "RCF", value: "third_party" },
            { label: "RCF + APP", value: "third_party_plus" },
          ],
        },
        {
          key: "assistance_24h",
          label: "Assistência 24 horas",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "rental_car", label: "Carro reserva", type: "SELECT", options: YES_NO },
        {
          key: "glass_protection",
          label: "Proteção de vidros",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "deductible", label: "Franquia", type: "TEXT" },
        { key: "coverage_notes", label: "Observações", type: "TEXTAREA" },
      ],
    },
  ],
  rules: [
    ...showWhenEquals("auto-plate", "vehicle_condition", "used", [
      { key: "plate", required: true },
    ]),
    ...showWhenEquals("auto-chassis", "needs_chassis", "yes", [
      { key: "chassis", required: true },
    ]),
    ...showWhenIn("auto-marital", "driver_relationship", ["self", "spouse"], [
      { key: "marital_status" },
    ]),
    ...showWhenAnyEquals(
      "auto-ride",
      [
        { key: "use_purpose", value: "commercial" },
        { key: "work_use", value: "yes" },
      ],
      ["ride_apps"],
    ),
    ...showWhenAnyEquals(
      "auto-garage-work",
      [
        { key: "use_purpose", value: "commercial" },
        { key: "work_use", value: "yes" },
      ],
      ["garage_work"],
    ),
    ...showWhenEquals("auto-insurer", "has_insurance", "yes", [
      { key: "current_insurer", required: true },
    ]),
    ...showWhenEquals("auto-claims", "previous_claims", "yes", [
      { key: "claims_details" },
    ]),
  ],
})

function addressFields(requiredStreet = true): FieldDraft[] {
  return [
    {
      key: "zip_code",
      label: "CEP",
      type: "TEXT",
      required: true,
      mask: "cep",
      validation: cep,
    },
    { key: "state", label: "Estado", type: "TEXT", required: true, placeholder: "UF" },
    { key: "city", label: "Cidade", type: "TEXT", required: true },
    { key: "neighborhood", label: "Bairro", type: "TEXT" },
    { key: "street", label: "Logradouro", type: "TEXT", required: requiredStreet },
    { key: "address_number", label: "Número", type: "TEXT", required: true },
    { key: "complement", label: "Complemento", type: "TEXT" },
  ]
}

const RESIDENTIAL_FORM = assemble({
  branch: "residencial",
  name: "Questionário Residencial",
  description: "Preenchimento interno do seguro residencial.",
  sections: [
    {
      key: "property_identification",
      title: "Dados do imóvel",
      fields: [
        {
          key: "property_kind",
          label: "Casa ou apartamento",
          type: "SELECT",
          required: true,
          options: [
            { label: "Casa", value: "house" },
            { label: "Apartamento", value: "apartment" },
          ],
        },
        {
          key: "ownership",
          label: "Próprio ou alugado",
          type: "SELECT",
          required: true,
          options: [
            { label: "Próprio", value: "owned" },
            { label: "Alugado", value: "rented" },
          ],
        },
        {
          key: "occupancy",
          label: "Ocupação habitual ou temporária",
          type: "SELECT",
          required: true,
          options: [
            { label: "Habitual", value: "habitual" },
            { label: "Temporária", value: "temporary" },
          ],
        },
        {
          key: "construction_type",
          label: "Tipo de construção",
          type: "SELECT",
          required: true,
          options: [
            { label: "Alvenaria", value: "masonry" },
            { label: "Madeira", value: "wood" },
            { label: "Mista", value: "mixed" },
            { label: "Outro", value: "other" },
          ],
        },
        { key: "area_m2", label: "Área aproximada (m²)", type: "NUMBER" },
      ],
    },
    {
      key: "risk_location",
      title: "Endereço do risco",
      fields: addressFields(),
    },
    {
      key: "estimated_values",
      title: "Valores",
      fields: [
        {
          key: "property_value",
          label: "Valor estimado do imóvel",
          type: "CURRENCY",
          required: true,
        },
        {
          key: "contents_value",
          label: "Valor estimado do conteúdo",
          type: "CURRENCY",
        },
        {
          key: "special_assets",
          label: "Bens especiais",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "special_assets_description",
          label: "Descrição dos bens especiais",
          type: "TEXTAREA",
        },
      ],
    },
    {
      key: "existing_protections",
      title: "Proteção",
      fields: [
        { key: "concierge", label: "Portaria", type: "SELECT", options: YES_NO },
        { key: "alarm", label: "Alarme", type: "SELECT", options: YES_NO },
        { key: "cameras", label: "Câmeras", type: "SELECT", options: YES_NO },
        { key: "surveillance", label: "Vigilância", type: "SELECT", options: YES_NO },
        {
          key: "other_devices",
          label: "Outros dispositivos",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "other_devices_description",
          label: "Quais dispositivos",
          type: "TEXTAREA",
        },
      ],
    },
    {
      key: "claims_history",
      title: "Histórico",
      fields: [
        {
          key: "has_insurance",
          label: "Possui seguro atual?",
          type: "SELECT",
          required: true,
          options: YES_NO,
        },
        { key: "current_insurer", label: "Seguradora", type: "TEXT" },
        {
          key: "previous_claims",
          label: "Sinistros anteriores",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "claims_details", label: "Detalhes dos sinistros", type: "TEXTAREA" },
      ],
    },
    {
      key: "coverages",
      title: "Coberturas",
      fields: [
        { key: "coverage_fire", label: "Incêndio", type: "SELECT", options: YES_NO },
        {
          key: "coverage_electrical",
          label: "Danos elétricos",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "coverage_wind", label: "Vendaval", type: "SELECT", options: YES_NO },
        { key: "coverage_theft", label: "Roubo", type: "SELECT", options: YES_NO },
        {
          key: "coverage_liability",
          label: "Responsabilidade civil",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "coverage_assistance", label: "Assistências", type: "SELECT", options: YES_NO },
        {
          key: "coverage_other",
          label: "Outras coberturas desejadas",
          type: "TEXTAREA",
        },
      ],
    },
  ],
  rules: [
    ...showWhenEquals("home-special", "special_assets", "yes", [
      { key: "special_assets_description" },
    ]),
    ...showWhenEquals("home-devices", "other_devices", "yes", [
      { key: "other_devices_description" },
    ]),
    ...showWhenEquals("home-insurer", "has_insurance", "yes", [
      { key: "current_insurer", required: true },
    ]),
    ...showWhenEquals("home-claims", "previous_claims", "yes", [
      { key: "claims_details" },
    ]),
  ],
})

const BUSINESS_FORM = assemble({
  branch: "empresarial",
  name: "Questionário Empresarial",
  description: "Preenchimento interno do seguro empresarial.",
  sections: [
    {
      key: "company_identification",
      title: "Empresa",
      fields: [
        { key: "legal_name", label: "Razão social", type: "TEXT", required: true },
        { key: "trade_name", label: "Nome fantasia", type: "TEXT" },
        {
          key: "cnpj",
          label: "CNPJ",
          type: "TEXT",
          required: true,
          mask: "cnpj",
          validation: cnpj,
        },
        {
          key: "economic_activity",
          label: "Atividade econômica",
          type: "TEXT",
          required: true,
        },
        {
          key: "operation_description",
          label: "Descrição da operação",
          type: "TEXTAREA",
        },
      ],
    },
    {
      key: "establishment",
      title: "Estabelecimento",
      fields: [
        ...addressFields(),
        {
          key: "property_kind",
          label: "Tipo de imóvel",
          type: "SELECT",
          required: true,
          options: [
            { label: "Loja", value: "store" },
            { label: "Escritório", value: "office" },
            { label: "Galpão", value: "warehouse" },
            { label: "Prédio comercial", value: "commercial_building" },
            { label: "Outro", value: "other" },
          ],
        },
        {
          key: "ownership",
          label: "Próprio ou alugado",
          type: "SELECT",
          required: true,
          options: [
            { label: "Próprio", value: "owned" },
            { label: "Alugado", value: "rented" },
          ],
        },
        { key: "built_area", label: "Área construída (m²)", type: "NUMBER" },
        {
          key: "construction_type",
          label: "Tipo de construção",
          type: "SELECT",
          options: [
            { label: "Alvenaria", value: "masonry" },
            { label: "Metálica", value: "metal" },
            { label: "Mista", value: "mixed" },
            { label: "Outro", value: "other" },
          ],
        },
      ],
    },
    {
      key: "operation",
      title: "Operação",
      fields: [
        {
          key: "employee_count",
          label: "Quantidade de funcionários",
          type: "NUMBER",
          required: true,
        },
        { key: "business_hours", label: "Horário de funcionamento", type: "TEXT" },
        { key: "activities", label: "Atividades realizadas", type: "TEXTAREA" },
        {
          key: "has_stock",
          label: "Existência de estoque",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "stock_description", label: "Descrição do estoque", type: "TEXTAREA" },
      ],
    },
    {
      key: "assets",
      title: "Bens e valores",
      fields: [
        { key: "value_property", label: "Imóvel", type: "CURRENCY" },
        { key: "value_machinery", label: "Máquinas", type: "CURRENCY" },
        { key: "value_equipment", label: "Equipamentos", type: "CURRENCY" },
        { key: "value_furniture", label: "Móveis", type: "CURRENCY" },
        { key: "value_stock", label: "Estoque", type: "CURRENCY" },
        { key: "value_other", label: "Outros bens", type: "CURRENCY" },
        { key: "values_notes", label: "Valores estimados e observações", type: "TEXTAREA" },
      ],
    },
    {
      key: "protection_history",
      title: "Proteção e histórico",
      fields: [
        { key: "extinguishers", label: "Extintores", type: "SELECT", options: YES_NO },
        { key: "sprinklers", label: "Sprinklers", type: "SELECT", options: YES_NO },
        { key: "alarm", label: "Alarme", type: "SELECT", options: YES_NO },
        { key: "cameras", label: "Câmeras", type: "SELECT", options: YES_NO },
        { key: "surveillance", label: "Vigilância", type: "SELECT", options: YES_NO },
        {
          key: "previous_claims",
          label: "Sinistros anteriores",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "claims_details", label: "Detalhes dos sinistros", type: "TEXTAREA" },
        {
          key: "has_insurance",
          label: "Seguro atual",
          type: "SELECT",
          required: true,
          options: YES_NO,
        },
        { key: "current_insurer", label: "Seguradora atual", type: "TEXT" },
      ],
    },
    {
      key: "coverages",
      title: "Coberturas",
      fields: [
        { key: "coverage_fire", label: "Incêndio", type: "SELECT", options: YES_NO },
        {
          key: "coverage_electrical",
          label: "Danos elétricos",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "coverage_theft", label: "Roubo", type: "SELECT", options: YES_NO },
        {
          key: "coverage_liability",
          label: "Responsabilidade civil",
          type: "SELECT",
          options: YES_NO,
        },
        {
          key: "coverage_business_interruption",
          label: "Lucros cessantes",
          type: "SELECT",
          options: YES_NO,
        },
        { key: "coverage_wind", label: "Vendaval", type: "SELECT", options: YES_NO },
        {
          key: "coverage_other",
          label: "Outras coberturas desejadas",
          type: "TEXTAREA",
        },
      ],
    },
  ],
  rules: [
    ...showWhenEquals("biz-stock", "has_stock", "yes", [
      { key: "stock_description" },
      { key: "value_stock" },
    ]),
    ...showWhenEquals("biz-claims", "previous_claims", "yes", [
      { key: "claims_details" },
    ]),
    ...showWhenEquals("biz-insurer", "has_insurance", "yes", [
      { key: "current_insurer", required: true },
    ]),
  ],
})

const FORMS: Record<IntelligentFormBranch, IntelligentFormDefinition> = {
  auto: AUTO_FORM,
  residencial: RESIDENTIAL_FORM,
  empresarial: BUSINESS_FORM,
}

export function isIntelligentFormBranch(
  value: unknown,
): value is IntelligentFormBranch {
  return (
    typeof value === "string" &&
    (INTELLIGENT_FORM_BRANCHES as readonly string[]).includes(value)
  )
}

export function getIntelligentForm(
  branch: IntelligentFormBranch,
): IntelligentFormDefinition {
  return FORMS[branch]
}

export function listIntelligentForms(): IntelligentFormDefinition[] {
  return INTELLIGENT_FORM_BRANCHES.map((branch) => FORMS[branch])
}

export function intelligentFormFingerprint(form: IntelligentFormDefinition): string {
  return JSON.stringify({
    catalogVersion: form.catalogVersion,
    sections: form.sections,
    fields: form.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      sectionKey: field.sectionKey,
      options: field.options ?? null,
      validation: field.validation ?? null,
      mask: field.mask ?? null,
    })),
    rules: form.rules,
  })
}

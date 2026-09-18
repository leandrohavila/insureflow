import type { FieldCategoryId, InsuranceProductId } from "./types"

export const FIELD_CATEGORY_LABELS: Record<FieldCategoryId, string> = {
  dados_pessoais: "Dados Pessoais",
  documentos: "Documentos",
  contato: "Contato",
  endereco: "Endereço",
  veiculos: "Veículos",
  condutores: "Condutores",
  imovel: "Imóvel",
  empresa: "Empresa",
  financeiro: "Financeiro",
  beneficiarios: "Beneficiários",
  coberturas: "Coberturas",
  anexos: "Anexos",
}

export const PRODUCT_LABELS: Record<InsuranceProductId, string> = {
  auto: "Auto",
  vida: "Vida",
  residencial: "Residencial",
  empresarial: "Empresarial",
  shared: "Compartilhado",
}

export const PRODUCT_ORDER: InsuranceProductId[] = [
  "auto",
  "vida",
  "residencial",
  "empresarial",
  "shared",
]

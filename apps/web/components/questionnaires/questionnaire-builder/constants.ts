import type {
  QuestionnaireFieldType,
  QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires"

import type { InsuranceQuestionKind } from "./types"

export const PAGE_SIZE = 10
export const SEARCH_DEBOUNCE_MS = 400
export const DEFAULT_SECTION = "Geral"

export const statusLabels: Record<QuestionnaireTemplateStatus, string> = {
  draft: "Inativo",
  active: "Ativo",
  archived: "Arquivado",
}

export const statusStyles: Record<QuestionnaireTemplateStatus, string> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  active: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  archived: "border-amber-400/30 bg-amber-500/10 text-amber-200",
}

export const fieldTypeLabels: Record<QuestionnaireFieldType, string> = {
  TEXT: "Texto curto",
  TEXTAREA: "Texto longo",
  NUMBER: "Número",
  DATE: "Data",
  BOOLEAN: "Sim/Não",
  SELECT: "Seleção única",
  MULTI_SELECT: "Seleção múltipla",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  CURRENCY: "Moeda",
  FILE: "Arquivo",
}

export const sectionSuggestions = [
  "Dados pessoais",
  "Veículo",
  "Endereço",
  "Perfil de uso",
  "Cobertura",
  "Histórico do segurado",
]

export const questionKindOptions: Array<{
  value: InsuranceQuestionKind
  label: string
  description: string
  type: QuestionnaireFieldType
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
  placeholder?: string
}> = [
  {
    value: "short_text",
    label: "Texto curto",
    description: "Nome, modelo, profissão ou respostas curtas.",
    type: "TEXT",
  },
  {
    value: "long_text",
    label: "Texto longo",
    description: "Observações, detalhes e comentários livres.",
    type: "TEXTAREA",
  },
  {
    value: "number",
    label: "Número",
    description: "Idade, quantidade, ano ou valores numéricos simples.",
    type: "NUMBER",
  },
  {
    value: "currency",
    label: "Moeda",
    description: "Campo monetário existente em templates anteriores.",
    type: "CURRENCY",
  },
  {
    value: "cpf",
    label: "CPF",
    description: "Documento de pessoa física com máscara automática.",
    type: "TEXT",
    mask: "cpf",
    placeholder: "000.000.000-00",
  },
  {
    value: "cnpj",
    label: "CNPJ",
    description: "Documento de pessoa jurídica com máscara automática.",
    type: "TEXT",
    mask: "cnpj",
    placeholder: "00.000.000/0000-00",
  },
  {
    value: "cep",
    label: "CEP",
    description: "CEP do endereço com máscara automática.",
    type: "TEXT",
    mask: "cep",
    placeholder: "00000-000",
  },
  {
    value: "phone",
    label: "Telefone",
    description: "Celular ou telefone fixo com máscara automática.",
    type: "PHONE",
    mask: "phone",
    placeholder: "(00) 00000-0000",
  },
  {
    value: "email",
    label: "E-mail",
    description: "Endereço de e-mail validado pelo navegador.",
    type: "EMAIL",
  },
  {
    value: "date",
    label: "Data",
    description: "Nascimento, vencimento ou data de evento.",
    type: "DATE",
  },
  {
    value: "yes_no",
    label: "Sim/Não",
    description: "Pergunta binária com resposta direta.",
    type: "BOOLEAN",
  },
  {
    value: "single_choice",
    label: "Escolha única",
    description: "Lista em que o cliente escolhe uma opção.",
    type: "SELECT",
  },
  {
    value: "multi_choice",
    label: "Múltipla escolha",
    description: "Lista em que o cliente pode escolher várias opções.",
    type: "MULTI_SELECT",
  },
  {
    value: "plate",
    label: "Placa",
    description: "Placa Mercosul ou modelo antigo com máscara visual.",
    type: "TEXT",
    mask: "plate",
    placeholder: "ABC1D23",
  },
  {
    value: "file",
    label: "Arquivo",
    description: "Campo de arquivo existente em templates anteriores.",
    type: "FILE",
  },
]

export const defaultQuestionKind = questionKindOptions[0]!

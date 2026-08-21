import type { LucideIcon } from "lucide-react"
import {
  Calendar,
  Car,
  CheckSquare,
  CircleDot,
  Clock,
  CreditCard,
  FileText,
  Hash,
  Image,
  List,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Signature,
  Type,
} from "lucide-react"

import type { InsuranceQuestionKind } from "./types"

export type FieldLibraryCategoryId =
  | "texto"
  | "documentos"
  | "veiculos"
  | "escolhas"
  | "arquivos"

export type FieldLibraryItem = {
  id: string
  label: string
  icon: LucideIcon
  kind: InsuranceQuestionKind
  category: FieldLibraryCategoryId
  defaultLabel: string
  placeholder?: string
  keywords?: string[]
  draggable: true
}

export type FieldLibraryCategory = {
  id: FieldLibraryCategoryId
  label: string
}

export const fieldLibraryCategories: FieldLibraryCategory[] = [
  { id: "texto", label: "Texto" },
  { id: "documentos", label: "Documentos" },
  { id: "veiculos", label: "Veículos" },
  { id: "escolhas", label: "Escolhas" },
  { id: "arquivos", label: "Arquivos" },
]

/** Biblioteca de campos — mapeia para tipos existentes no backend */
export const fieldLibraryItems: FieldLibraryItem[] = [
  {
    id: "text",
    label: "Texto",
    icon: Type,
    kind: "short_text",
    category: "texto",
    defaultLabel: "Nova pergunta",
    keywords: ["texto", "curto", "nome"],
    draggable: true,
  },
  {
    id: "long_text",
    label: "Texto Longo",
    icon: FileText,
    kind: "long_text",
    category: "texto",
    defaultLabel: "Descreva...",
    keywords: ["textarea", "longo"],
    draggable: true,
  },
  {
    id: "number",
    label: "Número",
    icon: Hash,
    kind: "number",
    category: "texto",
    defaultLabel: "Quantidade",
    keywords: ["numero", "idade"],
    draggable: true,
  },
  {
    id: "currency",
    label: "Moeda",
    icon: CreditCard,
    kind: "currency",
    category: "texto",
    defaultLabel: "Valor",
    keywords: ["valor", "dinheiro"],
    draggable: true,
  },
  {
    id: "cpf",
    label: "CPF",
    icon: CreditCard,
    kind: "cpf",
    category: "documentos",
    defaultLabel: "CPF",
    placeholder: "000.000.000-00",
    keywords: ["documento"],
    draggable: true,
  },
  {
    id: "cnpj",
    label: "CNPJ",
    icon: CreditCard,
    kind: "cnpj",
    category: "documentos",
    defaultLabel: "CNPJ",
    placeholder: "00.000.000/0000-00",
    keywords: ["empresa"],
    draggable: true,
  },
  {
    id: "cep",
    label: "CEP",
    icon: MapPin,
    kind: "cep",
    category: "documentos",
    defaultLabel: "CEP",
    placeholder: "00000-000",
    keywords: ["endereco"],
    draggable: true,
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    kind: "email",
    category: "documentos",
    defaultLabel: "E-mail",
    keywords: ["mail"],
    draggable: true,
  },
  {
    id: "phone",
    label: "Telefone",
    icon: Phone,
    kind: "phone",
    category: "documentos",
    defaultLabel: "Telefone",
    placeholder: "(00) 00000-0000",
    keywords: ["celular"],
    draggable: true,
  },
  {
    id: "date",
    label: "Data",
    icon: Calendar,
    kind: "date",
    category: "documentos",
    defaultLabel: "Data",
    keywords: ["nascimento"],
    draggable: true,
  },
  {
    id: "time",
    label: "Hora",
    icon: Clock,
    kind: "short_text",
    category: "documentos",
    defaultLabel: "Horário",
    placeholder: "00:00",
    keywords: ["horario"],
    draggable: true,
  },
  {
    id: "plate",
    label: "Placa",
    icon: Car,
    kind: "plate",
    category: "veiculos",
    defaultLabel: "Placa",
    placeholder: "ABC1D23",
    draggable: true,
  },
  {
    id: "renavam",
    label: "Renavam",
    icon: Hash,
    kind: "short_text",
    category: "veiculos",
    defaultLabel: "Renavam",
    placeholder: "00000000000",
    draggable: true,
  },
  {
    id: "chassi",
    label: "Chassi",
    icon: Car,
    kind: "short_text",
    category: "veiculos",
    defaultLabel: "Chassi",
    placeholder: "17 caracteres",
    draggable: true,
  },
  {
    id: "select",
    label: "Select",
    icon: List,
    kind: "single_choice",
    category: "escolhas",
    defaultLabel: "Selecione",
    draggable: true,
  },
  {
    id: "multiselect",
    label: "MultiSelect",
    icon: ListChecks,
    kind: "multi_choice",
    category: "escolhas",
    defaultLabel: "Selecione várias",
    draggable: true,
  },
  {
    id: "radio",
    label: "Radio",
    icon: CircleDot,
    kind: "single_choice",
    category: "escolhas",
    defaultLabel: "Escolha uma opção",
    draggable: true,
  },
  {
    id: "checkbox",
    label: "Checkbox",
    icon: CheckSquare,
    kind: "yes_no",
    category: "escolhas",
    defaultLabel: "Confirma?",
    draggable: true,
  },
  {
    id: "file",
    label: "Arquivo",
    icon: FileText,
    kind: "file",
    category: "arquivos",
    defaultLabel: "Anexo",
    draggable: true,
  },
  {
    id: "image",
    label: "Imagem",
    icon: Image,
    kind: "file",
    category: "arquivos",
    defaultLabel: "Imagem",
    draggable: true,
  },
  {
    id: "signature",
    label: "Assinatura",
    icon: Signature,
    kind: "file",
    category: "arquivos",
    defaultLabel: "Assinatura",
    draggable: true,
  },
]

/** Quick Add — campos mais usados */
export const quickAddItemIds = [
  "text",
  "cpf",
  "cnpj",
  "phone",
  "cep",
  "plate",
  "file",
  "image",
] as const

export const quickAddItems = quickAddItemIds
  .map((id) => fieldLibraryItems.find((item) => item.id === id))
  .filter((item): item is FieldLibraryItem => Boolean(item))

export function getLibraryItemById(id: string) {
  return fieldLibraryItems.find((item) => item.id === id)
}

export function getLibraryItemByKind(kind: InsuranceQuestionKind) {
  return fieldLibraryItems.find((item) => item.kind === kind)
}

export function filterLibraryItems(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return fieldLibraryItems
  return fieldLibraryItems.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.category.includes(normalized) ||
      item.keywords?.some((keyword) => keyword.includes(normalized)),
  )
}

export function groupLibraryItems(items: FieldLibraryItem[]) {
  return fieldLibraryCategories
    .map((category) => ({
      ...category,
      items: items.filter((item) => item.category === category.id),
    }))
    .filter((group) => group.items.length > 0)
}

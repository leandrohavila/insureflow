import type { RuleActionType, RuleOperator } from "@repo/forms-engine"

export const OPERATOR_LABELS: Record<RuleOperator, string> = {
  equals: "é igual a",
  notEquals: "é diferente de",
  greaterThan: "é maior que",
  greaterOrEqual: "é maior ou igual a",
  lessThan: "é menor que",
  lessOrEqual: "é menor ou igual a",
  contains: "contém",
  startsWith: "começa com",
  endsWith: "termina com",
  between: "está entre",
  in: "está em",
  notIn: "não está em",
  isEmpty: "está vazio",
  isFilled: "está preenchido",
  exists: "existe",
  notExists: "não existe",
}

export const ACTION_LABELS: Record<RuleActionType, string> = {
  showField: "Mostrar campo",
  hideField: "Ocultar campo",
  requireField: "Tornar obrigatório",
  optionalField: "Tornar opcional",
  enableField: "Habilitar campo",
  disableField: "Desabilitar campo",
  setValue: "Definir valor",
  clearValue: "Limpar valor",
  showSection: "Mostrar seção",
  hideSection: "Ocultar seção",
  jumpToSection: "Ir para seção",
}

export const FIELD_TARGET_ACTIONS: RuleActionType[] = [
  "showField",
  "hideField",
  "requireField",
  "optionalField",
  "enableField",
  "disableField",
  "setValue",
  "clearValue",
]

export const SECTION_TARGET_ACTIONS: RuleActionType[] = [
  "showSection",
  "hideSection",
  "jumpToSection",
]

export const VALUELESS_OPERATORS: RuleOperator[] = [
  "isEmpty",
  "isFilled",
  "exists",
  "notExists",
]

export const BETWEEN_OPERATOR: RuleOperator = "between"

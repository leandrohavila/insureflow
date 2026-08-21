import type { FormRuleDefinition, RuleConditionNode } from "@repo/forms-engine"
import { createRuleId } from "@repo/forms-engine"

import { getFieldDefinition } from "../fields/index"
import type {
  BlockDefinition,
  BlockInstantiationResult,
  FieldDefinition,
  InstantiatedField,
} from "../metadata/types"

export type InstantiateBlockInput = {
  block: BlockDefinition
  existingKeys?: string[]
  orderStart?: number
  keyPrefix?: string
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60)
  return slug || "campo"
}

function uniqueKey(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let index = 2
  while (existing.has(`${base}_${index}`)) index += 1
  return `${base}_${index}`
}

function remapConditionNode(
  node: RuleConditionNode,
  keyMap: Record<string, string>,
): RuleConditionNode {
  if ("logic" in node && "conditions" in node) {
    return {
      ...node,
      conditions: node.conditions.map((child) => remapConditionNode(child, keyMap)),
    }
  }
  return {
    ...node,
    fieldKey: keyMap[node.fieldKey] ?? node.fieldKey,
  }
}

function remapRuleFieldKeys(
  rules: FormRuleDefinition[] | undefined,
  keyMap: Record<string, string>,
): FormRuleDefinition[] {
  if (!rules?.length) return []

  return rules.map((rule) => ({
    ...rule,
    id: `${rule.id}_${createRuleId().slice(-6)}`,
    conditions: rule.conditions.map((node) => remapConditionNode(node, keyMap)),
    actions: rule.actions.map((action) => ({
      ...action,
      targetFieldKey: action.targetFieldKey
        ? (keyMap[action.targetFieldKey] ?? action.targetFieldKey)
        : action.targetFieldKey,
    })),
  }))
}

export function fieldDefinitionToInstantiated(
  definition: FieldDefinition,
  options: {
    key: string
    order: number
    section: string
  },
): InstantiatedField {
  const settings: Record<string, unknown> = {
    section: options.section,
    inputKind: definition.inputKind,
    libraryFieldId: definition.id,
    librarySource: definition.product,
  }

  if (definition.defaultMask) settings.mask = definition.defaultMask
  if (definition.defaultValue !== undefined) settings.defaultValue = definition.defaultValue

  return {
    key: options.key,
    label: definition.label,
    type: definition.fieldType,
    required: definition.required ?? false,
    order: options.order,
    placeholder: definition.defaultPlaceholder,
    helpText: definition.helpText,
    options: definition.options,
    validation: definition.validation ?? null,
    settings,
  }
}

export function instantiateBlock(input: InstantiateBlockInput): BlockInstantiationResult {
  const existing = new Set(input.existingKeys ?? [])
  const prefix = input.keyPrefix ? `${slugify(input.keyPrefix)}_` : ""
  let order = input.orderStart ?? 0
  const keyMap: Record<string, string> = {}
  const fields: InstantiatedField[] = []

  for (const fieldId of input.block.fieldIds) {
    const definition = getFieldDefinition(fieldId)
    if (!definition) continue

    const baseKey = uniqueKey(`${prefix}${definition.key}`, existing)
    existing.add(baseKey)
    keyMap[definition.key] = baseKey

    fields.push(
      fieldDefinitionToInstantiated(definition, {
        key: baseKey,
        order,
        section: input.block.section,
      }),
    )
    order += 10
  }

  return {
    blockId: input.block.id,
    section: input.block.section,
    fields,
    rules: remapRuleFieldKeys(input.block.defaultRules, keyMap),
  }
}

export function mergeTemplateRules(
  existing: FormRuleDefinition[],
  incoming: FormRuleDefinition[],
): FormRuleDefinition[] {
  const ids = new Set(existing.map((rule) => rule.id))
  return [...existing, ...incoming.filter((rule) => !ids.has(rule.id))]
}

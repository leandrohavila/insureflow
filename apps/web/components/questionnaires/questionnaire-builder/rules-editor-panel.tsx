"use client"

import { memo, useMemo, useState } from "react"
import { FlaskConical, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createConditionGroup,
  createEmptyRule,
  createRuleId,
  type FormRuleDefinition,
  type RuleActionDefinition,
  type RuleCondition,
  type RuleConditionNode,
  type RuleOperator,
  type RuleActionType,
  RULE_OPERATORS,
  RULE_ACTION_TYPES,
  isConditionGroup,
} from "@repo/forms-engine"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

import {
  ACTION_LABELS,
  BETWEEN_OPERATOR,
  FIELD_TARGET_ACTIONS,
  OPERATOR_LABELS,
  SECTION_TARGET_ACTIONS,
  VALUELESS_OPERATORS,
} from "./rules-constants"
import { RuleTesterDialog } from "./rule-tester-dialog"
import { getFieldSection } from "./utils"

type RulesEditorPanelProps = {
  rules: FormRuleDefinition[]
  fields: QuestionnaireField[]
  sections: string[]
  engineVersion: number
  onChange: (rules: FormRuleDefinition[]) => void
  onEngineVersionChange: (version: 1 | 2) => void
  className?: string
}

function createCondition(fieldKey: string): RuleCondition {
  return { fieldKey, operator: "equals", value: "" }
}

function updateRuleAt(
  rules: FormRuleDefinition[],
  index: number,
  patch: Partial<FormRuleDefinition>,
): FormRuleDefinition[] {
  return rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
}

export const RulesEditorPanel = memo(function RulesEditorPanel({
  rules,
  fields,
  sections,
  engineVersion,
  onChange,
  onEngineVersionChange,
  className,
}: RulesEditorPanelProps) {
  const [testRuleIndex, setTestRuleIndex] = useState<number | null>(null)

  const fieldOptions = useMemo(
    () =>
      fields.map((field) => ({
        key: field.key,
        label: field.label,
        section: getFieldSection(field),
      })),
    [fields],
  )

  const testedRule =
    testRuleIndex !== null ? (rules[testRuleIndex] ?? null) : null

  function addRule() {
    onChange([...rules, createEmptyRule(`Regra ${rules.length + 1}`)])
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index))
  }

  function updateConditions(index: number, conditions: RuleConditionNode[]) {
    onChange(updateRuleAt(rules, index, { conditions }))
  }

  function updateActions(index: number, actions: RuleActionDefinition[]) {
    onChange(updateRuleAt(rules, index, { actions }))
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-[var(--if-space-4)]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-[var(--if-space-3)]">
        <div>
          <h3 className="text-sm font-semibold tracking-[-0.02em]">
            Regras condicionais
          </h3>
          <p className="text-xs text-muted-foreground">
            Quando → Campo → Operador → Valor → Então → Ação → Destino
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Motor
            <select
              value={engineVersion}
              onChange={(event) =>
                onEngineVersionChange(Number(event.target.value) as 1 | 2)
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
            >
              <option value={1}>v1 (legado)</option>
              <option value={2}>v2 (regras)</option>
            </select>
          </label>
          <Button type="button" size="sm" className="gap-1.5" onClick={addRule}>
            <Plus className="size-3.5" />
            Nova regra
          </Button>
        </div>
      </div>

      {engineVersion !== 2 ? (
        <div className="rounded-xl border border-dashed border-white/[0.14] p-[var(--if-space-6)] text-center text-sm text-muted-foreground">
          Ative o motor v2 para criar e executar regras condicionais.
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.14] p-[var(--if-space-6)] text-center text-sm text-muted-foreground">
          Nenhuma regra cadastrada. Use &quot;Nova regra&quot; para começar.
        </div>
      ) : (
        <div className="space-y-[var(--if-space-4)]">
          {rules.map((rule, ruleIndex) => (
            <article
              key={rule.id}
              className="rounded-xl border border-white/[0.10] bg-white/[0.03] p-[var(--if-space-4)]"
            >
              <div className="mb-[var(--if-space-3)] flex flex-wrap items-center gap-2">
                <Input
                  value={rule.name}
                  onChange={(event) =>
                    onChange(
                      updateRuleAt(rules, ruleIndex, {
                        name: event.target.value,
                      }),
                    )
                  }
                  className="h-8 max-w-xs"
                  aria-label="Nome da regra"
                />
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(event) =>
                      onChange(
                        updateRuleAt(rules, ruleIndex, {
                          enabled: event.target.checked,
                        }),
                      )
                    }
                  />
                  Ativa
                </label>
                <select
                  value={rule.conditionLogic ?? "and"}
                  onChange={(event) =>
                    onChange(
                      updateRuleAt(rules, ruleIndex, {
                        conditionLogic: event.target.value as "and" | "or",
                      }),
                    )
                  }
                  className="h-8 rounded-md border border-input bg-background/40 px-2 text-xs"
                  aria-label="Lógica entre condições"
                >
                  <option value="and">Todas (AND)</option>
                  <option value="or">Qualquer (OR)</option>
                </select>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setTestRuleIndex(ruleIndex)}
                  >
                    <FlaskConical className="size-3.5" />
                    Testar regra
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeRule(ruleIndex)}
                    aria-label="Remover regra"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <ConditionEditor
                title="Quando"
                nodes={rule.conditions}
                fieldOptions={fieldOptions}
                onChange={(conditions) => updateConditions(ruleIndex, conditions)}
              />

              <ActionEditor
                title="Então"
                actions={rule.actions}
                fieldOptions={fieldOptions}
                sections={sections}
                onChange={(actions) => updateActions(ruleIndex, actions)}
              />
            </article>
          ))}
        </div>
      )}

      {testedRule ? (
        <RuleTesterDialog
          open={testRuleIndex !== null}
          rule={testedRule}
          fields={fields}
          onOpenChange={(open) => {
            if (!open) setTestRuleIndex(null)
          }}
        />
      ) : null}
    </div>
  )
})

function ConditionEditor({
  title,
  nodes,
  fieldOptions,
  onChange,
  depth = 0,
}: {
  title: string
  nodes: RuleConditionNode[]
  fieldOptions: Array<{ key: string; label: string; section: string }>
  onChange: (nodes: RuleConditionNode[]) => void
  depth?: number
}) {
  function updateNode(index: number, node: RuleConditionNode) {
    const next = [...nodes]
    next[index] = node
    onChange(next)
  }

  function removeNode(index: number) {
    onChange(nodes.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-4 border-l border-white/[0.08] pl-3")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {nodes.map((node, index) =>
        isConditionGroup(node) ? (
          <div key={`group-${index}`} className="space-y-2 rounded-lg bg-white/[0.02] p-2">
            <div className="flex items-center gap-2">
              <select
                value={node.logic}
                onChange={(event) =>
                  updateNode(index, {
                    ...node,
                    logic: event.target.value as "and" | "or",
                  })
                }
                className="h-7 rounded-md border border-input bg-background/40 px-2 text-xs"
              >
                <option value="and">Grupo AND</option>
                <option value="or">Grupo OR</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeNode(index)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <ConditionEditor
              title="Condições do grupo"
              nodes={node.conditions}
              fieldOptions={fieldOptions}
              depth={depth + 1}
              onChange={(conditions) =>
                updateNode(index, { ...node, conditions })
              }
            />
          </div>
        ) : (
          <div
            key={`cond-${index}`}
            className="grid gap-2 rounded-lg bg-white/[0.02] p-2 sm:grid-cols-[1fr_auto_1fr_auto]"
          >
            <select
              value={node.fieldKey}
              onChange={(event) =>
                updateNode(index, { ...node, fieldKey: event.target.value })
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
            >
              {fieldOptions.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            <select
              value={node.operator}
              onChange={(event) =>
                updateNode(index, {
                  ...node,
                  operator: event.target.value as RuleOperator,
                })
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
            >
              {RULE_OPERATORS.map((operator) => (
                <option key={operator} value={operator}>
                  {OPERATOR_LABELS[operator]}
                </option>
              ))}
            </select>
            {!VALUELESS_OPERATORS.includes(node.operator) ? (
              node.operator === BETWEEN_OPERATOR ? (
                <div className="flex gap-2">
                  <Input
                    value={String(node.value ?? "")}
                    onChange={(event) =>
                      updateNode(index, { ...node, value: event.target.value })
                    }
                    placeholder="De"
                    className="h-8"
                  />
                  <Input
                    value={String(node.valueTo ?? "")}
                    onChange={(event) =>
                      updateNode(index, {
                        ...node,
                        valueTo: event.target.value,
                      })
                    }
                    placeholder="Até"
                    className="h-8"
                  />
                </div>
              ) : (
                <Input
                  value={String(node.value ?? "")}
                  onChange={(event) =>
                    updateNode(index, { ...node, value: event.target.value })
                  }
                  placeholder="Valor"
                  className="h-8"
                />
              )
            ) : (
              <span className="self-center text-xs text-muted-foreground">—</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeNode(index)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...nodes,
              createCondition(fieldOptions[0]?.key ?? "campo"),
            ])
          }
        >
          + Condição
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([...nodes, createConditionGroup("and")])
          }
        >
          + Grupo AND/OR
        </Button>
      </div>
    </div>
  )
}

function ActionEditor({
  title,
  actions,
  fieldOptions,
  sections,
  onChange,
}: {
  title: string
  actions: RuleActionDefinition[]
  fieldOptions: Array<{ key: string; label: string; section: string }>
  sections: string[]
  onChange: (actions: RuleActionDefinition[]) => void
}) {
  function updateAction(index: number, action: RuleActionDefinition) {
    const next = [...actions]
    next[index] = action
    onChange(next)
  }

  return (
    <div className="mt-[var(--if-space-4)] space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {actions.map((action, index) => {
        const needsField = FIELD_TARGET_ACTIONS.includes(action.type)
        const needsSection = SECTION_TARGET_ACTIONS.includes(action.type)
        return (
          <div
            key={`action-${index}`}
            className="grid gap-2 rounded-lg bg-white/[0.02] p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <select
              value={action.type}
              onChange={(event) =>
                updateAction(index, {
                  ...action,
                  type: event.target.value as RuleActionType,
                })
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
            >
              {RULE_ACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTION_LABELS[type]}
                </option>
              ))}
            </select>
            {needsField ? (
              <select
                value={action.targetFieldKey ?? ""}
                onChange={(event) =>
                  updateAction(index, {
                    ...action,
                    targetFieldKey: event.target.value,
                  })
                }
                className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
              >
                {fieldOptions.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            ) : needsSection ? (
              <select
                value={action.targetSection ?? ""}
                onChange={(event) =>
                  updateAction(index, {
                    ...action,
                    targetSection: event.target.value,
                  })
                }
                className="h-8 rounded-md border border-input bg-background/40 px-2 text-sm"
              >
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            ) : (
              <span className="self-center text-xs text-muted-foreground">—</span>
            )}
            {action.type === "setValue" ? (
              <Input
                value={String(action.value ?? "")}
                onChange={(event) =>
                  updateAction(index, { ...action, value: event.target.value })
                }
                placeholder="Valor"
                className="h-8"
              />
            ) : (
              <span className="self-center text-xs text-muted-foreground">—</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(actions.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          onChange([
            ...actions,
            {
              type: "showField",
              targetFieldKey: fieldOptions[0]?.key ?? "",
            },
          ])
        }
      >
        + Ação
      </Button>
    </div>
  )
}

export function parseRulesFromTemplateSettings(
  settings?: Record<string, unknown> | null,
): FormRuleDefinition[] {
  if (!settings || !Array.isArray(settings.rules)) return []
  return settings.rules.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const record = item as FormRuleDefinition
    if (!record.id) record.id = createRuleId()
    return [record]
  })
}

export function serializeRulesToSettings(
  settings: Record<string, unknown> | null | undefined,
  rules: FormRuleDefinition[],
  engineVersion: 1 | 2,
): Record<string, unknown> {
  return {
    ...(settings ?? {}),
    engineVersion,
    rules,
  }
}

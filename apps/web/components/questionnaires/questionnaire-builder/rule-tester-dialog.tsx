"use client"

import { memo, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FormRuleDefinition } from "@repo/forms-engine"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { testQuestionnaireRule } from "@/lib/questionnaires/questionnaire-rules"

import { QuestionnaireAnswerField } from "../questionnaire-answer-field"
import { ACTION_LABELS } from "./rules-constants"

type RuleTesterDialogProps = {
  open: boolean
  rule: FormRuleDefinition
  fields: QuestionnaireField[]
  onOpenChange: (open: boolean) => void
}

export const RuleTesterDialog = memo(function RuleTesterDialog({
  open,
  rule,
  fields,
  onOpenChange,
}: RuleTesterDialogProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  const testResult = useMemo(() => {
    if (!open) return null
    return testQuestionnaireRule(
      rule,
      { name: "Test", settings: { engineVersion: 2, rules: [rule] } },
      fields,
      answers,
    )
  }, [open, rule, fields, answers])

  const referencedFields = useMemo(() => {
    const keys = new Set<string>()
    function walk(nodes: FormRuleDefinition["conditions"]) {
      for (const node of nodes) {
        if ("logic" in node && "conditions" in node) {
          walk(node.conditions)
        } else if ("fieldKey" in node) {
          keys.add(node.fieldKey)
        }
      }
    }
    walk(rule.conditions)
    for (const action of rule.actions) {
      if (action.targetFieldKey) keys.add(action.targetFieldKey)
    }
    return fields.filter((field) => keys.has(field.key))
  }, [rule, fields])

  const fieldsToFill =
    referencedFields.length > 0 ? referencedFields : fields.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Testar regra</DialogTitle>
          <DialogDescription>
            Informe valores de teste e execute o motor de regras para{" "}
            <strong>{rule.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[var(--if-space-4)]">
          <div className="space-y-[var(--if-space-3)]">
            {fieldsToFill.map((field) => (
              <QuestionnaireAnswerField
                key={field.id}
                field={field}
                value={answers[field.key]}
                onChange={(value) =>
                  setAnswers((current) => ({ ...current, [field.key]: value }))
                }
              />
            ))}
          </div>

          {testResult ? (
            <div className="space-y-[var(--if-space-3)] rounded-xl border border-white/[0.10] bg-white/[0.03] p-[var(--if-space-4)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resultado</span>
                <span
                  className={
                    testResult.matched
                      ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400"
                      : "rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400"
                  }
                >
                  {testResult.matched ? "TRUE" : "FALSE"}
                </span>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Ações executadas
                </p>
                {testResult.executedActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {testResult.executedActions.map((item, index) => (
                      <li key={`${item.ruleId}-${index}`}>
                        {ACTION_LABELS[item.action.type]}
                        {item.action.targetFieldKey
                          ? ` → ${item.action.targetFieldKey}`
                          : ""}
                        {item.action.targetSection
                          ? ` → ${item.action.targetSection}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Campos afetados
                  </p>
                  <p className="text-xs">
                    {testResult.affectedFieldKeys.length > 0
                      ? testResult.affectedFieldKeys.join(", ")
                      : "Nenhum"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Seções afetadas
                  </p>
                  <p className="text-xs">
                    {testResult.affectedSections.length > 0
                      ? testResult.affectedSections.join(", ")
                      : "Nenhuma"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

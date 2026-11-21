"use client"

import { memo } from "react"
import Link from "next/link"
import { ClipboardList, Loader2, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getErrorMessage } from "@/lib/data-access"
import type { QuestionnaireTemplate } from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

import { builderPortalClass } from "./builder-surfaces"
import { statusLabels, statusStyles } from "./constants"
import { formatDate } from "./utils"

type QuestionnaireTemplateListProps = {
  templates: QuestionnaireTemplate[]
  selectedId: string | null
  loading: boolean
  error: unknown
  onSelect: (template: QuestionnaireTemplate) => void
  onEdit: (template: QuestionnaireTemplate) => void
  onToggle: (template: QuestionnaireTemplate) => void
  onDelete: (template: QuestionnaireTemplate) => void
  onRetry: () => void
  canManage: boolean
  onCreate?: () => void
}

function branchLabel(template: QuestionnaireTemplate) {
  const branch =
    template.settings &&
    typeof template.settings === "object" &&
    "branch" in template.settings
      ? template.settings.branch
      : null
  if (branch === "auto") return "Automóvel"
  if (branch === "residencial") return "Residencial"
  if (branch === "empresarial") return "Empresarial"
  return "Personalizado"
}

function TemplateCard({
  template,
  selected,
  canManage,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}: {
  template: QuestionnaireTemplate
  selected: boolean
  canManage: boolean
  onSelect: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const fieldCount = template.fields?.length ?? 0

  return (
    <article
      role="button"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      aria-label={`Template ${template.name}, versão ${template.version}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      data-builder-level="template"
      className={cn(
        "group cursor-pointer rounded-2xl border p-[var(--if-space-4)] transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected
          ? "border-[var(--avila-gold-600)] border-l-[3px] bg-[color-mix(in_srgb,var(--avila-gold-600)_12%,var(--avila-paper))] shadow-[0_1px_2px_rgb(16_41_75/0.05)]"
          : "border-[#e4ddd2] bg-[var(--avila-paper)] shadow-[0_1px_2px_rgb(16_41_75/0.04)] hover:border-[#d6cfc4]",
      )}
    >
      <div className="flex items-start justify-between gap-[var(--if-space-2)]">
        <div className="min-w-0 flex-1">
          {selected ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Template
            </p>
          ) : null}
          <p
            className={cn(
              "truncate tracking-[-0.02em]",
              selected ? "text-base font-semibold" : "text-sm font-medium",
            )}
          >
            {template.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            v{template.version}
          </p>
        </div>
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#5c6578] outline-none transition-colors hover:bg-[#ebe5dc] hover:text-[var(--avila-navy-900)] focus-visible:ring-2 focus-visible:ring-[var(--avila-gold-600)]"
              aria-label={`Ações do template ${template.name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={builderPortalClass}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
              {template.status !== "archived" ? (
                <DropdownMenuItem onClick={onToggle}>
                  {template.status === "active" ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="mt-[var(--if-space-3)] flex flex-wrap items-center gap-[var(--if-space-2)]">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full text-[10px] font-semibold",
            statusStyles[template.status],
          )}
        >
          {statusLabels[template.status]}
        </Badge>
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#5c6578]">
          {branchLabel(template)}
        </span>
      </div>

      <dl className="mt-[var(--if-space-3)] grid grid-cols-2 gap-x-[var(--if-space-3)] gap-y-[var(--if-space-2)] text-xs">
        <div>
          <dt className="text-muted-foreground">Perguntas</dt>
          <dd className="font-medium">{fieldCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Respostas</dt>
          <dd>
            <Link
              href={`/questionarios/respostas?templateId=${template.id}`}
              className="font-medium text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {template.submissionsCount}
            </Link>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Atualizado</dt>
          <dd className="font-medium">{formatDate(template.updatedAt)}</dd>
        </div>
      </dl>
    </article>
  )
}

const MemoTemplateCard = memo(TemplateCard)

export function QuestionnaireTemplateList({
  templates,
  selectedId,
  loading,
  error,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
  onRetry,
  canManage,
  onCreate,
}: QuestionnaireTemplateListProps) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-[var(--if-space-4)] overflow-hidden"
      aria-label="Lista de templates"
    >
      <div className="flex items-center justify-between gap-[var(--if-space-2)]">
        <h2 className="text-sm font-semibold tracking-[-0.02em]">Templates</h2>
        <span className="text-xs text-muted-foreground">{templates.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-[var(--if-space-3)] overflow-x-hidden overflow-y-auto overscroll-contain pr-1 md:space-y-[var(--if-space-4)]">
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#e4ddd2] bg-[var(--avila-paper)] p-4 text-sm text-[#5c6578]">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando templates...
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{getErrorMessage(error, "Não foi possível carregar templates.")}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-[var(--if-radius-2xl)] border border-dashed border-[#d6cfc4] bg-[var(--avila-paper)] p-6 text-center">
            <ClipboardList
              className="mx-auto size-7 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-2 text-sm font-medium">Nenhum registro encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique em Novo para começar.
            </p>
            {canManage && onCreate ? (
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={onCreate}
              >
                Novo template
              </Button>
            ) : null}
          </div>
        ) : (
          templates.map((template) => (
            <MemoTemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedId}
              canManage={canManage}
              onSelect={() => onSelect(template)}
              onEdit={() => onEdit(template)}
              onToggle={() => onToggle(template)}
              onDelete={() => onDelete(template)}
            />
          ))
        )}
      </div>
    </aside>
  )
}

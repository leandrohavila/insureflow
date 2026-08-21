"use client"

import {
  ClipboardList,
  Eye,
  Filter,
  GitBranch,
  Layers,
  Plus,
  Save,
  Search,
  Upload,
  Rocket,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  QUESTIONNAIRE_TEMPLATE_STATUSES,
  type QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires"

import { statusLabels } from "./constants"
import { AutoSaveIndicator, type AutoSaveStatus } from "./autosave-indicator"
import { VersionsMenu } from "./versions-menu"
import type { QuestionnaireTemplate } from "@/lib/data-access/modules/questionnaires"

type QuestionnaireBuilderHeaderProps = {
  search: string
  status: QuestionnaireTemplateStatus | "all"
  template: QuestionnaireTemplate | null
  autoSaveStatus: AutoSaveStatus
  onSearchChange: (value: string) => void
  onStatusChange: (value: QuestionnaireTemplateStatus | "all") => void
  onImport: () => void
  onNewTemplate: () => void
  onTogglePreview: () => void
  onToggleTemplates?: () => void
  onToggleRules?: () => void
  onToggleBlocks?: () => void
  onSave: () => void
  onPublish: () => void
  previewOpen: boolean
  canManage: boolean
  publishDisabled?: boolean
  savePending?: boolean
}

export function QuestionnaireBuilderHeader({
  search,
  status,
  template,
  autoSaveStatus,
  onSearchChange,
  onStatusChange,
  onImport,
  onNewTemplate,
  onTogglePreview,
  onToggleTemplates,
  onToggleRules,
  onToggleBlocks,
  onSave,
  onPublish,
  previewOpen,
  canManage,
  publishDisabled,
  savePending,
}: QuestionnaireBuilderHeaderProps) {
  return (
    <header className="flex flex-col gap-[var(--if-space-4)]">
      <div className="flex flex-col gap-[var(--if-space-2)]">
        <h1 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">
          Builder de Questionários
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Organize templates, seções e perguntas com preview em tempo real —
          produtividade visual para montar formulários comerciais.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--if-space-3)] xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--if-space-3)] sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
              aria-hidden
            />
            <Input
              placeholder="Buscar template..."
              aria-label="Buscar template"
              className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-[var(--if-space-2)]">
            <Filter className="size-4 text-muted-foreground" aria-hidden />
            <select
              value={status}
              aria-label="Filtrar por status"
              onChange={(event) =>
                onStatusChange(
                  event.target.value as QuestionnaireTemplateStatus | "all",
                )
              }
              className="flex h-9 rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="all">Todos os status</option>
              {QUESTIONNAIRE_TEMPLATE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[var(--if-space-2)]">
          <AutoSaveIndicator status={autoSaveStatus} />
          <VersionsMenu template={template} />

          <PermissionGate permission="questionnaires:manage">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={onImport}
                    aria-label="Importar template"
                  />
                }
              >
                <Upload className="size-3.5" />
                <span className="hidden sm:inline">Importar</span>
              </TooltipTrigger>
              <TooltipContent>Duplicar estrutura a partir de JSON (em breve)</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={onNewTemplate}
              aria-label="Novo template"
            >
              <Plus className="size-3.5" />
              Novo template
            </Button>
          </PermissionGate>

          {onToggleBlocks && template ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onToggleBlocks}
              aria-label="Inserir bloco"
            >
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">Inserir bloco</span>
            </Button>
          ) : null}

          {onToggleRules && template ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onToggleRules}
              aria-label="Editor de regras"
            >
              <GitBranch className="size-3.5" />
              <span className="hidden sm:inline">Regras</span>
            </Button>
          ) : null}

          {onToggleTemplates ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 xl:hidden"
              onClick={onToggleTemplates}
              aria-label="Abrir templates"
            >
              <ClipboardList className="size-3.5" />
              Templates
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 xl:hidden"
            onClick={onTogglePreview}
            aria-expanded={previewOpen}
            aria-controls="questionnaire-preview-panel"
          >
            <Eye className="size-3.5" />
            Preview
          </Button>

          {canManage ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={savePending}
                onClick={onSave}
                aria-label="Salvar alterações"
              >
                <Save className="size-3.5" />
                Salvar
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={publishDisabled}
                onClick={onPublish}
                aria-label="Publicar template"
              >
                <Rocket className="size-3.5" />
                Publicar
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}

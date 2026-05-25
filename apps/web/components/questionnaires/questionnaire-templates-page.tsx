"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckSquare,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  HelpCircle,
  Layers3,
  Loader2,
  Plus,
  Search,
  ToggleLeft,
  Trash2,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { useCanManage } from "@/components/auth/session-provider";
import { CrmPageHeader } from "@/components/crm/crm-page-header";
import { QuestionnaireNavTabs } from "@/components/questionnaires/questionnaire-nav-tabs";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/data-access";
import {
  QUESTIONNAIRE_TEMPLATE_STATUSES,
  useCreateQuestionnaireField,
  useCreateQuestionnaireTemplate,
  useDeleteQuestionnaireField,
  useDeleteQuestionnaireTemplate,
  useQuestionnaireFields,
  useQuestionnaireTemplates,
  useUpdateQuestionnaireField,
  useUpdateQuestionnaireTemplate,
  type CreateQuestionnaireFieldInput,
  type CreateQuestionnaireTemplateInput,
  type QuestionnaireField,
  type QuestionnaireFieldType,
  type QuestionnaireTemplate,
  type QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires";
import { easeOut } from "@/lib/motion";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const statusLabels: Record<QuestionnaireTemplateStatus, string> = {
  draft: "Inativo",
  active: "Ativo",
  archived: "Arquivado",
};

const statusStyles: Record<QuestionnaireTemplateStatus, string> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  active: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  archived: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

const fieldTypeLabels: Record<QuestionnaireFieldType, string> = {
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
};

type InsuranceQuestionKind =
  | "short_text"
  | "long_text"
  | "number"
  | "cpf"
  | "cnpj"
  | "cep"
  | "phone"
  | "email"
  | "date"
  | "yes_no"
  | "single_choice"
  | "multi_choice"
  | "plate"
  | "currency"
  | "file";

type FieldSettings = {
  section?: string;
  inputKind?: InsuranceQuestionKind;
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate";
  [key: string]: unknown;
};

type TemplateSettings = {
  questionnaireSections?: unknown;
  [key: string]: unknown;
};

const DEFAULT_SECTION = "Geral";

const sectionSuggestions = [
  "Dados pessoais",
  "Veículo",
  "Endereço",
  "Perfil de uso",
  "Cobertura",
  "Histórico do segurado",
];

const questionKindOptions: Array<{
  value: InsuranceQuestionKind;
  label: string;
  description: string;
  type: QuestionnaireFieldType;
  mask?: FieldSettings["mask"];
  placeholder?: string;
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
];

const defaultQuestionKind = questionKindOptions[0]!;

function optionalFormValue(value: string) {
  return value.trim() || undefined;
}

function formatDate(value: string) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function getFieldSettings(
  field: Pick<QuestionnaireField, "settings">,
): FieldSettings {
  return field.settings as FieldSettings;
}

function getTemplateSettings(
  template: Pick<QuestionnaireTemplate, "settings">,
): TemplateSettings {
  return template.settings as TemplateSettings;
}

function normalizeSectionName(value: string) {
  return value.trim() || DEFAULT_SECTION;
}

function getFieldSection(field: QuestionnaireField) {
  return normalizeSectionName(getFieldSettings(field).section ?? "");
}

function getQuestionKindFromField(
  field: QuestionnaireField,
): InsuranceQuestionKind {
  const settings = getFieldSettings(field);
  if (settings.inputKind) return settings.inputKind;
  if (field.type === "TEXTAREA") return "long_text";
  if (field.type === "NUMBER") return "number";
  if (field.type === "BOOLEAN") return "yes_no";
  if (field.type === "SELECT") return "single_choice";
  if (field.type === "MULTI_SELECT") return "multi_choice";
  if (field.type === "EMAIL") return "email";
  if (field.type === "PHONE") return "phone";
  if (field.type === "DATE") return "date";
  if (field.type === "CURRENCY") return "currency";
  if (field.type === "FILE") return "file";
  return "short_text";
}

function getQuestionKindLabel(field: QuestionnaireField) {
  const kind = getQuestionKindFromField(field);
  return (
    questionKindOptions.find((option) => option.value === kind)?.label ??
    fieldTypeLabels[field.type]
  );
}

function slugifyKey(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70);

  if (!slug) return "pergunta";
  return /^[a-z]/.test(slug) ? slug : `campo_${slug}`;
}

function uniqueQuestionKey(
  label: string,
  fields: QuestionnaireField[],
  currentKey?: string,
) {
  const base = slugifyKey(label);
  const used = new Set(
    fields.map((field) => field.key).filter((key) => key !== currentKey),
  );
  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function slugifyOption(value: string) {
  return slugifyKey(value).replace(/^campo_/, "");
}

function uniqueOptionValue(value: string, usedValues: Set<string>) {
  if (!usedValues.has(value)) return value;

  let index = 2;
  while (usedValues.has(`${value}_${index}`)) index += 1;
  return `${value}_${index}`;
}

function buildFieldOptions(
  labels: string[],
  existingOptions: QuestionnaireField["options"] = [],
) {
  const usedValues = new Set<string>();

  return labels.map((label) => {
    const existingValue = existingOptions?.find(
      (option) => option.label === label && !usedValues.has(option.value),
    )?.value;
    const value = uniqueOptionValue(existingValue ?? slugifyOption(label), usedValues);
    usedValues.add(value);
    return { label, value };
  });
}

function uniqueSectionNames(values: string[]) {
  const sections: string[] = [];
  for (const value of values) {
    const section = normalizeSectionName(value);
    if (!sections.includes(section)) sections.push(section);
  }
  return sections;
}

function getTemplateSectionNames(template: QuestionnaireTemplate) {
  const sections = getTemplateSettings(template).questionnaireSections;
  if (!Array.isArray(sections)) return [];
  return uniqueSectionNames(
    sections.filter((section): section is string => typeof section === "string"),
  );
}

function getQuestionnaireSections(
  template: QuestionnaireTemplate,
  fields: QuestionnaireField[],
) {
  return uniqueSectionNames([
    ...getTemplateSectionNames(template),
    ...fields.map(getFieldSection),
  ]);
}

function groupFieldsBySection(
  fields: QuestionnaireField[],
  sections: string[] = [],
) {
  const groups = uniqueSectionNames(sections).map((section) => ({
    section,
    fields: [] as QuestionnaireField[],
  }));

  for (const field of [...fields].sort((a, b) => a.order - b.order)) {
    const section = getFieldSection(field);
    const group = groups.find((item) => item.section === section);
    if (group) {
      group.fields.push(field);
    } else {
      groups.push({ section, fields: [field] });
    }
  }
  return groups;
}

export function QuestionnaireTemplatesPage() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState<QuestionnaireTemplateStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<QuestionnaireTemplate | null>(null);
  const [editingField, setEditingField] = useState<QuestionnaireField | null>(
    null,
  );
  const [newSectionName, setNewSectionName] = useState("");
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renamedSectionName, setRenamedSectionName] = useState("");
  const reduce = useReducedMotion();
  const canManage = useCanManage("questionnaires:view");

  const filters = useMemo(
    () => ({ search, status, page, limit: PAGE_SIZE }),
    [page, search, status],
  );
  const templatesQuery = useQuestionnaireTemplates(filters);
  const createTemplate = useCreateQuestionnaireTemplate();
  const updateTemplate = useUpdateQuestionnaireTemplate();
  const deleteTemplate = useDeleteQuestionnaireTemplate();
  const createField = useCreateQuestionnaireField();
  const updateField = useUpdateQuestionnaireField();
  const deleteField = useDeleteQuestionnaireField();
  const fieldReorderInFlight = useRef(false);

  const templates = useMemo(
    () => templatesQuery.data?.data ?? [],
    [templatesQuery.data?.data],
  );
  const meta = templatesQuery.data?.meta;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0] ??
    null;
  const fieldsQuery = useQuestionnaireFields(selectedTemplate?.id ?? null);
  const fields = useMemo(
    () => fieldsQuery.data ?? selectedTemplate?.fields ?? [],
    [fieldsQuery.data, selectedTemplate?.fields],
  );
  const builderSections = useMemo(
    () =>
      selectedTemplate ? getQuestionnaireSections(selectedTemplate, fields) : [],
    [fields, selectedTemplate],
  );
  const sectionGroups = useMemo(
    () => groupFieldsBySection(fields, builderSections),
    [builderSections, fields],
  );
  const visibleSectionGroups = useMemo(
    () => sectionGroups.filter((group) => group.fields.length > 0),
    [sectionGroups],
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    if (!selectedTemplateId && templates[0]) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  const columns = useMemo<DataTableColumn<QuestionnaireTemplate>[]>(
    () => [
      {
        key: "name",
        header: "Template",
        render: (row) => (
          <div>
            <p className="font-medium tracking-[-0.02em]">{row.name}</p>
            <p className="text-xs text-muted-foreground">
              v{row.version} · {row.description || "Sem descrição"}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[10px] font-semibold",
              statusStyles[row.status],
            )}
          >
            {statusLabels[row.status]}
          </Badge>
        ),
      },
      {
        key: "fields",
        header: "Perguntas",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.fields.length} campos
          </span>
        ),
      },
      {
        key: "submissions",
        header: "Respostas",
        hideOnMobile: true,
        render: (row) => (
          <Link
            href={`/questionarios/respostas?templateId=${row.id}`}
            className="text-xs text-primary hover:underline"
          >
            {row.submissionsCount} respostas
          </Link>
        ),
      },
      {
        key: "updatedAt",
        header: "Atualizado",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  function toggleTemplate(template: QuestionnaireTemplate) {
    updateTemplate.mutate({
      id: template.id,
      input: { status: template.status === "active" ? "draft" : "active" },
    });
  }

  async function moveField(field: QuestionnaireField, direction: -1 | 1) {
    if (fieldReorderInFlight.current || updateField.isPending) return;

    const ordered = [...fields].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((item) => item.id === field.id);
    const swapWith = ordered[index + direction];
    if (!selectedTemplate || !swapWith) return;

    fieldReorderInFlight.current = true;
    try {
      await updateField.mutateAsync({
        templateId: selectedTemplate.id,
        fieldId: field.id,
        input: { order: swapWith.order },
      });
      await updateField.mutateAsync({
        templateId: selectedTemplate.id,
        fieldId: swapWith.id,
        input: { order: field.order },
      });
    } finally {
      fieldReorderInFlight.current = false;
    }
  }

  function saveSectionNames(nextSections: string[]) {
    if (!selectedTemplate) return;
    updateTemplate.mutate({
      id: selectedTemplate.id,
      input: {
        settings: {
          ...selectedTemplate.settings,
          questionnaireSections: uniqueSectionNames(nextSections),
        },
      },
    });
  }

  function addQuestionnaireSection(sectionName: string) {
    if (!sectionName.trim()) return null;
    const section = normalizeSectionName(sectionName);
    if (!selectedTemplate) return null;
    if (builderSections.includes(section)) return section;
    saveSectionNames([...builderSections, section]);
    return section;
  }

  function createSection() {
    const section = addQuestionnaireSection(newSectionName);
    if (!section) return;
    setNewSectionName("");
  }

  function moveSection(section: string, direction: -1 | 1) {
    const index = builderSections.indexOf(section);
    const swapWith = builderSections[index + direction];
    if (!selectedTemplate || index < 0 || !swapWith) return;

    const nextSections = [...builderSections];
    nextSections[index] = swapWith;
    nextSections[index + direction] = section;
    saveSectionNames(nextSections);
  }

  function renameSection(section: string) {
    if (!selectedTemplate) return;
    const nextSection = normalizeSectionName(renamedSectionName);
    if (nextSection === section) {
      setRenamingSection(null);
      setRenamedSectionName("");
      return;
    }

    const nextSections = uniqueSectionNames(
      builderSections.map((item) => (item === section ? nextSection : item)),
    );
    saveSectionNames(nextSections);
    fields
      .filter((field) => getFieldSection(field) === section)
      .forEach((field) => {
        updateField.mutate({
          templateId: selectedTemplate.id,
          fieldId: field.id,
          input: {
            settings: {
              ...getFieldSettings(field),
              section: nextSection,
            },
          },
        });
      });
    setRenamingSection(null);
    setRenamedSectionName("");
  }

  function deleteQuestionnaireField(field: QuestionnaireField) {
    if (!selectedTemplate) return;
    const section = getFieldSection(field);
    const willLeaveSectionEmpty =
      fields.filter((item) => getFieldSection(item) === section).length === 1;

    deleteField.mutate(
      {
        templateId: selectedTemplate.id,
        fieldId: field.id,
      },
      {
        onSuccess: () => {
          if (willLeaveSectionEmpty) {
            saveSectionNames(builderSections.filter((item) => item !== section));
          }
        },
      },
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Operação humana"
        title="Templates de questionários"
        description="Crie templates simples, organize os fields e deixe ativos apenas os questionários prontos para preenchimento interno."
        primaryAction={
          canManage
            ? {
                label: "Novo template",
                onClick: () => {
                  setEditingTemplate(null);
                  setTemplateDialogOpen(true);
                },
              }
            : undefined
        }
      >
        <QuestionnaireNavTabs />
      </CrmPageHeader>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar template..."
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) =>
              setStatus(
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

      <DataTable
        data={templates}
        columns={columns}
        getRowId={(row) => row.id}
        loading={templatesQuery.isLoading}
        loadingLabel="Carregando templates..."
        error={templatesQuery.isError ? templatesQuery.error : null}
        errorTitle="Não foi possível carregar templates."
        onRetry={() => templatesQuery.refetch()}
        emptyIcon={ClipboardList}
        emptyTitle="Nenhum template encontrado."
        emptyDescription="Crie um template para começar a coletar informações de leads."
        emptyAction={
          <PermissionGate permission="questionnaires:manage">
            <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
              Novo template
            </Button>
          </PermissionGate>
        }
        onRowClick={(row) => setSelectedTemplateId(row.id)}
        rowActions={[
          {
            key: "toggle",
            label: "Ativar/desativar",
            icon: ToggleLeft,
            permission: "questionnaires:manage",
            hidden: (row) => row.status === "archived",
            onSelect: toggleTemplate,
          },
          {
            key: "edit",
            label: "Editar template",
            icon: Edit3,
            permission: "questionnaires:manage",
            onSelect: (row) => {
              setEditingTemplate(row);
              setTemplateDialogOpen(true);
            },
          },
          {
            key: "delete",
            label: "Excluir template",
            icon: Trash2,
            variant: "destructive",
            permission: "questionnaires:manage",
            onSelect: (row) => {
              if (window.confirm(`Excluir ou arquivar ${row.name}?`)) {
                deleteTemplate.mutate(row.id);
              }
            },
          },
        ]}
        pagination={{
          meta: {
            page: meta?.page ?? page,
            totalPages: meta?.totalPages ?? 1,
            total: meta?.total,
          },
          onPageChange: setPage,
        }}
        title="Templates"
        subtitle={`${meta?.total ?? templates.length} templates cadastrados`}
      />

      {selectedTemplate ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="glass-panel space-y-5 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers3 className="size-4 text-primary" />
                  <p className="text-sm font-semibold tracking-[-0.02em]">
                    Builder de {selectedTemplate.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Organize perguntas por seções operacionais, escolha o tipo de
                  resposta e use as setas para ajustar a ordem.
                </p>
              </div>
              <PermissionGate permission="questionnaires:manage">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setEditingField(null);
                    setFieldDialogOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  Nova pergunta
                </Button>
              </PermissionGate>
            </div>

            <PermissionGate permission="questionnaires:manage">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em]">
                      Seções do formulário
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Crie blocos como Dados do veículo, Condutor e Perfil de
                      uso para o corretor preencher sem depender de termos
                      técnicos.
                    </p>
                  </div>
                  <div className="flex min-w-0 gap-2 sm:min-w-80">
                    <Input
                      value={newSectionName}
                      onChange={(event) => setNewSectionName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          createSection();
                        }
                      }}
                      placeholder="Ex.: Dados do veículo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-2"
                      disabled={
                        updateTemplate.isPending || !newSectionName.trim()
                      }
                      onClick={createSection}
                    >
                      <Plus className="size-3.5" />
                      Nova seção
                    </Button>
                  </div>
                </div>

                {visibleSectionGroups.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {visibleSectionGroups.map((group, index) => {
                      const isFirst = index === 0;
                      const isLast = index === visibleSectionGroups.length - 1;
                      const isRenaming = renamingSection === group.section;

                      return (
                        <div
                          key={group.section}
                          className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-background/35 p-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            {isRenaming ? (
                              <Input
                                autoFocus
                                value={renamedSectionName}
                                onChange={(event) =>
                                  setRenamedSectionName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    renameSection(group.section);
                                  }
                                  if (event.key === "Escape") {
                                    setRenamingSection(null);
                                    setRenamedSectionName("");
                                  }
                                }}
                                className="h-8"
                              />
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-white/10 bg-white/[0.04]"
                                >
                                  {group.section}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {group.fields.length}{" "}
                                  {group.fields.length === 1
                                    ? "pergunta"
                                    : "perguntas"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isRenaming ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    updateTemplate.isPending ||
                                    updateField.isPending ||
                                    !renamedSectionName.trim()
                                  }
                                  onClick={() => renameSection(group.section)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRenamingSection(null);
                                    setRenamedSectionName("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="size-8"
                                  disabled={isFirst || updateTemplate.isPending}
                                  onClick={() => moveSection(group.section, -1)}
                                  aria-label="Mover seção para cima"
                                >
                                  <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="size-8"
                                  disabled={isLast || updateTemplate.isPending}
                                  onClick={() => moveSection(group.section, 1)}
                                  aria-label="Mover seção para baixo"
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  disabled={
                                    updateTemplate.isPending ||
                                    updateField.isPending
                                  }
                                  onClick={() => {
                                    setRenamingSection(group.section);
                                    setRenamedSectionName(group.section);
                                  }}
                                >
                                  <Edit3 className="size-3.5" />
                                  Renomear
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/[0.12] p-4 text-xs text-muted-foreground">
                    Adicione uma seção para estruturar o questionário antes das
                    perguntas.
                  </div>
                )}
              </div>
            </PermissionGate>

            {fieldsQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando perguntas...
              </div>
            ) : fieldsQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {getErrorMessage(
                  fieldsQuery.error,
                  "Não foi possível carregar perguntas.",
                )}
              </div>
            ) : fields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.03] p-8 text-center">
                <ClipboardList className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  Comece com a primeira pergunta
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Crie tópicos como Dados pessoais, Veículo e Perfil de uso para
                  guiar o cliente.
                </p>
                <PermissionGate permission="questionnaires:manage">
                  <Button
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => {
                      setEditingField(null);
                      setFieldDialogOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Adicionar pergunta
                  </Button>
                </PermissionGate>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleSectionGroups.map((group) => (
                  <section key={group.section} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-white/[0.08]" />
                      <Badge
                        variant="outline"
                        className="rounded-full border-white/10 bg-white/[0.03]"
                      >
                        {group.section}
                      </Badge>
                      <span className="h-px flex-1 bg-white/[0.08]" />
                    </div>
                    <div className="space-y-3">
                      {group.fields.map((field, index) => {
                        const ordered = [...fields].sort(
                          (a, b) => a.order - b.order,
                        );
                        const isFirst = ordered[0]?.id === field.id;
                        const isLast = ordered.at(-1)?.id === field.id;

                        return (
                          <article
                            key={field.id}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition-colors hover:border-white/[0.14]"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="flex min-w-0 gap-3">
                                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-background/50 text-xs font-semibold text-muted-foreground">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium tracking-[-0.01em]">
                                      {field.label}
                                    </p>
                                    {field.required ? (
                                      <Badge className="rounded-full bg-primary/15 text-[10px] text-primary">
                                        Obrigatória
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-white/10 text-[10px]"
                                    >
                                      {getQuestionKindLabel(field)}
                                    </Badge>
                                    {field.options?.length ? (
                                      <span>{field.options.length} opções</span>
                                    ) : null}
                                    {field.helpText ? (
                                      <span className="inline-flex items-center gap-1">
                                        <HelpCircle className="size-3" />
                                        {field.helpText}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <PermissionGate permission="questionnaires:manage">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="size-8"
                                    disabled={isFirst}
                                    onClick={() => moveField(field, -1)}
                                    aria-label="Mover pergunta para cima"
                                  >
                                    <ArrowUp className="size-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="size-8"
                                    disabled={isLast}
                                    onClick={() => moveField(field, 1)}
                                    aria-label="Mover pergunta para baixo"
                                  >
                                    <ArrowDown className="size-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => {
                                      setEditingField(field);
                                      setFieldDialogOpen(true);
                                    }}
                                  >
                                    <Edit3 className="size-3.5" />
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="size-8"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Excluir pergunta ${field.label}?`,
                                      )
                                    ) {
                                      deleteQuestionnaireField(field);
                                    }
                                  }}
                                    aria-label="Excluir pergunta"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </PermissionGate>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <QuestionnairePreview template={selectedTemplate} fields={fields} />
        </div>
      ) : null}

      {(createTemplate.error ||
        updateTemplate.error ||
        deleteTemplate.error ||
        createField.error ||
        updateField.error ||
        deleteField.error) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(
            createTemplate.error ??
              updateTemplate.error ??
              deleteTemplate.error ??
              createField.error ??
              updateField.error ??
              deleteField.error,
            "Erro ao processar questionário",
          )}
        </p>
      )}

      <TemplateDialog
        open={canManage && templateDialogOpen}
        template={editingTemplate}
        pending={createTemplate.isPending || updateTemplate.isPending}
        error={createTemplate.error ?? updateTemplate.error}
        onOpenChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        onSubmit={(input) => {
          if (editingTemplate) {
            updateTemplate.mutate(
              { id: editingTemplate.id, input },
              { onSuccess: () => setTemplateDialogOpen(false) },
            );
            return;
          }
          createTemplate.mutate(input, {
            onSuccess: (template) => {
              setSelectedTemplateId(template.id);
              setTemplateDialogOpen(false);
            },
          });
        }}
      />

      <FieldDialog
        open={canManage && fieldDialogOpen}
        field={editingField}
        fields={fields}
        sections={builderSections}
        nextOrder={
          fields.length === 0
            ? 0
            : Math.max(...fields.map((field) => field.order)) + 10
        }
        pending={createField.isPending || updateField.isPending}
        sectionPending={updateTemplate.isPending}
        error={createField.error ?? updateField.error}
        onOpenChange={(open) => {
          setFieldDialogOpen(open);
          if (!open) setEditingField(null);
        }}
        onCreateSection={addQuestionnaireSection}
        onSubmit={(input) => {
          if (!selectedTemplate) return;
          if (editingField) {
            updateField.mutate(
              {
                templateId: selectedTemplate.id,
                fieldId: editingField.id,
                input,
              },
              { onSuccess: () => setFieldDialogOpen(false) },
            );
            return;
          }
          createField.mutate(
            { templateId: selectedTemplate.id, input },
            { onSuccess: () => setFieldDialogOpen(false) },
          );
        }}
      />
    </motion.div>
  );
}

type TemplateForm = {
  name: string;
  description: string;
  status: QuestionnaireTemplateStatus;
  version: string;
};

function TemplateDialog({
  open,
  template,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  template: QuestionnaireTemplate | null;
  pending: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateQuestionnaireTemplateInput) => void;
}) {
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    description: "",
    status: "draft",
    version: "1",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: template?.name ?? "",
      description: template?.description ?? "",
      status: template?.status ?? "draft",
      version: String(template?.version ?? 1),
    });
  }, [open, template]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      description: optionalFormValue(form.description),
      status: form.status,
      version: Number(form.version) || 1,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {template ? "Editar template" : "Novo template"}
            </DialogTitle>
            <DialogDescription>
              Mantenha somente o necessário para o corretor preencher
              internamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex.: Seguro auto individual"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as QuestionnaireTemplateStatus,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {QUESTIONNAIRE_TEMPLATE_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Versão</span>
              <Input
                type="number"
                min={1}
                value={form.version}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    version: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Descrição</span>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Quando este questionário deve ser usado"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar template")}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FieldForm = {
  label: string;
  kind: InsuranceQuestionKind;
  required: boolean;
  order: string;
  section: string;
  placeholder: string;
  helpText: string;
  options: string;
};

function FieldDialog({
  open,
  field,
  fields,
  sections,
  nextOrder,
  pending,
  sectionPending,
  error,
  onOpenChange,
  onCreateSection,
  onSubmit,
}: {
  open: boolean;
  field: QuestionnaireField | null;
  fields: QuestionnaireField[];
  sections: string[];
  nextOrder: number;
  pending: boolean;
  sectionPending: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onCreateSection: (sectionName: string) => string | null;
  onSubmit: (input: CreateQuestionnaireFieldInput) => void;
}) {
  const [form, setForm] = useState<FieldForm>({
    label: "",
    kind: "short_text",
    required: false,
    order: "0",
    section: DEFAULT_SECTION,
    placeholder: "",
    helpText: "",
    options: "",
  });
  const [localSections, setLocalSections] = useState<string[]>([]);
  const [newSectionDraft, setNewSectionDraft] = useState("");
  const [optionDraft, setOptionDraft] = useState("");
  const initializedFieldRef = useRef<string | null>(null);
  const usesOptions =
    form.kind === "single_choice" || form.kind === "multi_choice";
  const selectedKind =
    questionKindOptions.find((option) => option.value === form.kind) ??
    defaultQuestionKind;
  const existingSections = useMemo(
    () =>
      Array.from(
        new Set([
          DEFAULT_SECTION,
          ...sections,
          ...localSections,
          ...fields.map(getFieldSection),
          ...sectionSuggestions,
        ]),
      ).filter(Boolean),
    [fields, localSections, sections],
  );
  const selectedSectionExists =
    Boolean(form.section.trim()) &&
    existingSections.includes(normalizeSectionName(form.section));
  const sectionSelectValue = selectedSectionExists
    ? normalizeSectionName(form.section)
    : "__new__";

  useEffect(() => {
    if (!open) {
      initializedFieldRef.current = null;
      return;
    }

    const fieldKey = field?.id ?? "__new__";
    if (initializedFieldRef.current === fieldKey) return;
    initializedFieldRef.current = fieldKey;

    setLocalSections([]);
    setNewSectionDraft("");
    setOptionDraft("");
    const kind = field ? getQuestionKindFromField(field) : "short_text";
    const matchingKind = questionKindOptions.some(
      (option) => option.value === kind,
    )
      ? kind
      : "short_text";

    setForm({
      label: field?.label ?? "",
      kind: matchingKind,
      required: field?.required ?? false,
      order: String(field?.order ?? nextOrder),
      section: field ? getFieldSection(field) : sections[0] ?? DEFAULT_SECTION,
      placeholder: field?.placeholder ?? "",
      helpText: field?.helpText ?? "",
      options: field?.options?.map((option) => option.label).join("\n") ?? "",
    });
  }, [field, nextOrder, open, sections]);

  useEffect(() => {
    if (!open || !field || form.options || !field.options?.length) return;
    setForm((current) => ({
      ...current,
      options: field.options?.map((option) => option.label).join("\n") ?? "",
    }));
  }, [field, form.options, open]);

  function handleCreateSection() {
    if (!newSectionDraft.trim()) return;
    const section = onCreateSection(newSectionDraft);
    if (!section) return;
    setLocalSections((current) => uniqueSectionNames([...current, section]));
    setForm((current) => ({
      ...current,
      section,
    }));
    setNewSectionDraft("");
  }

  function getOptionLabels() {
    return form.options
      .split(/\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  function handleAddOption() {
    const option = optionDraft.trim();
    if (!option) return;
    const options = getOptionLabels();
    if (options.includes(option)) {
      setOptionDraft("");
      return;
    }

    setForm((current) => ({
      ...current,
      options: [...options, option].join("\n"),
    }));
    setOptionDraft("");
  }

  function removeOption(optionToRemove: string) {
    setForm((current) => ({
      ...current,
      options: current.options
        .split(/\n|,/)
        .map((option) => option.trim())
        .filter((option) => option && option !== optionToRemove)
        .join("\n"),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.label.trim()) return;
    const key = field?.key ?? uniqueQuestionKey(form.label, fields);
    const options = buildFieldOptions(getOptionLabels(), field?.options);
    const settings: FieldSettings = {
      ...getFieldSettings(field ?? ({ settings: {} } as QuestionnaireField)),
      section: form.section.trim() || DEFAULT_SECTION,
      inputKind: form.kind,
    };

    if (selectedKind.mask) {
      settings.mask = selectedKind.mask;
    } else {
      delete settings.mask;
    }

    onSubmit({
      key,
      label: form.label.trim(),
      type: selectedKind.type,
      required: form.required,
      order: Number(form.order) || 0,
      placeholder:
        optionalFormValue(form.placeholder) ?? selectedKind.placeholder,
      helpText: optionalFormValue(form.helpText),
      options: usesOptions ? options : undefined,
      settings,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-white/[0.08] bg-background/95 sm:max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {field ? "Editar pergunta" : "Nova pergunta"}
            </DialogTitle>
            <DialogDescription>
              Monte a pergunta como o corretor e o cliente enxergam. A chave
              técnica é gerada automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Pergunta</span>
                <Input
                  required
                  value={form.label}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Qual é o modelo do veículo?"
                />
              </label>
              <div className="space-y-2">
                <span className="text-sm font-medium">Tópico / seção</span>
                <select
                  value={sectionSelectValue}
                  onChange={(event) => {
                    const nextSection = event.target.value;
                    if (nextSection === "__new__") {
                      setNewSectionDraft("");
                    }
                    setForm((current) => ({
                      ...current,
                      section: nextSection === "__new__" ? "" : nextSection,
                    }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {existingSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                  <option value="__new__">+ Nova seção</option>
                </select>
                {sectionSelectValue === "__new__" ? (
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        value={newSectionDraft}
                        onChange={(event) =>
                          setNewSectionDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleCreateSection();
                          }
                          if (event.key === "Escape") {
                            setNewSectionDraft("");
                            setForm((current) => ({
                              ...current,
                              section: existingSections[0] ?? DEFAULT_SECTION,
                            }));
                          }
                        }}
                        placeholder="descrição do novo tópico"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={sectionPending || !newSectionDraft.trim()}
                        onClick={handleCreateSection}
                      >
                        Salvar
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => {
                        setNewSectionDraft("");
                        setForm((current) => ({
                          ...current,
                          section: existingSections[0] ?? DEFAULT_SECTION,
                        }));
                      }}
                    >
                      Cancelar nova seção
                    </button>
                  </div>
                ) : null}
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium">Tipo de resposta</span>
                <select
                  value={form.kind}
                  onChange={(event) => {
                    const nextKind = event.target
                      .value as InsuranceQuestionKind;
                    const nextOption = questionKindOptions.find(
                      (option) => option.value === nextKind,
                    );
                    setForm((current) => ({
                      ...current,
                      kind: nextKind,
                      placeholder:
                        current.placeholder || nextOption?.placeholder || "",
                    }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {questionKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">
                  {selectedKind.description}
                </span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      required: event.target.checked,
                    }))
                  }
                />
                Obrigatório
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Texto de exemplo</span>
                <Input
                  value={form.placeholder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      placeholder: event.target.value,
                    }))
                  }
                  placeholder={selectedKind.placeholder ?? "Texto de apoio"}
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Ajuda ao usuário</span>
                <Input
                  value={form.helpText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      helpText: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Informe como aparece no documento do veículo"
                />
              </label>
              {usesOptions ? (
                <div className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium">Opções</span>
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                    <div className="flex gap-2">
                      <Input
                        value={optionDraft}
                        onChange={(event) => setOptionDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddOption();
                          }
                        }}
                        placeholder="Ex.: Gasolina"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!optionDraft.trim()}
                        onClick={handleAddOption}
                      >
                        Salvar opção
                      </Button>
                    </div>
                    {getOptionLabels().length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getOptionLabels().map((option) => (
                          <span
                            key={option}
                            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/45 px-3 py-1 text-xs text-muted-foreground"
                          >
                            {option}
                            <button
                              type="button"
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              onClick={() => removeOption(option)}
                              aria-label={`Remover opção ${option}`}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md border border-dashed border-white/[0.12] px-3 py-2 text-xs text-muted-foreground">
                        Cadastre as opções uma por vez. Ex.: Gasolina, Álcool,
                        Flex, Diesel.
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Salvar opção não fecha esta janela. Finalize a pergunta
                    apenas no botão Salvar pergunta.
                  </span>
                </div>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="size-4 text-primary" />
                Preview da pergunta
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-background/45 p-4">
                <p className="text-sm font-medium">
                  {form.label.trim() || "Sua pergunta aparecerá aqui"}
                  {form.required ? (
                    <span className="text-destructive"> *</span>
                  ) : null}
                </p>
                {form.helpText ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.helpText}
                  </p>
                ) : null}
                <PreviewControl
                  className="mt-3"
                  kind={form.kind}
                  placeholder={form.placeholder || selectedKind.placeholder}
                  options={form.options}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                A ordem é controlada pelas setas no builder. Ao salvar, a chave
                técnica será{" "}
                <span className="font-mono">
                  {field?.key ?? uniqueQuestionKey(form.label, fields)}
                </span>
                .
              </p>
            </aside>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar pergunta")}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar pergunta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PreviewControl({
  kind,
  placeholder,
  options,
  className,
}: {
  kind: InsuranceQuestionKind;
  placeholder?: string;
  options?: string;
  className?: string;
}) {
  const parsedOptions = options
    ?.split(/\n|,/)
    .map((option) => option.trim())
    .filter(Boolean);

  if (kind === "long_text") {
    return (
      <textarea
        disabled
        placeholder={placeholder || "Resposta longa"}
        className={cn(
          "min-h-20 w-full resize-none rounded-lg border border-input/70 bg-input/20 px-3 py-2 text-sm",
          className,
        )}
      />
    );
  }

  if (kind === "single_choice" || kind === "multi_choice") {
    const choices = parsedOptions ?? [];
    const inputType = kind === "single_choice" ? "radio" : "checkbox";

    return (
      <div
        className={cn(
          "space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3",
          className,
        )}
      >
        {choices.length > 0 ? (
          choices.slice(0, 4).map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <input type={inputType} disabled />
              {option}
            </label>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-white/[0.12] px-3 py-2 text-xs text-muted-foreground">
            Adicione opções abaixo
          </p>
        )}
      </div>
    );
  }

  if (kind === "yes_no") {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {["Sim", "Não"].map((option) => (
          <button
            key={option}
            type="button"
            disabled
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground"
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  const inputType =
    kind === "email"
      ? "email"
      : kind === "number" || kind === "currency"
        ? "number"
        : kind === "date"
          ? "date"
          : "text";

  return (
    <Input
      disabled
      type={inputType}
      placeholder={placeholder || "Resposta"}
      className={className}
    />
  );
}

function PreviewField({ field }: { field: QuestionnaireField }) {
  const kind = getQuestionKindFromField(field);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-background/45 p-3">
      <p className="text-sm font-medium">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </p>
      {field.helpText ? (
        <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
      ) : null}
      <PreviewControl
        className="mt-3"
        kind={kind}
        placeholder={field.placeholder ?? undefined}
        options={field.options?.map((option) => option.label).join("\n")}
      />
    </div>
  );
}

function QuestionnairePreview({
  template,
  fields,
}: {
  template: QuestionnaireTemplate;
  fields: QuestionnaireField[];
}) {
  const groups = groupFieldsBySection(
    fields,
    getQuestionnaireSections(template, fields),
  ).filter((group) => group.fields.length > 0);

  return (
    <aside className="glass-panel h-fit rounded-2xl border border-white/[0.06] p-5 xl:sticky xl:top-6">
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-primary" />
        <p className="text-sm font-semibold tracking-[-0.02em]">
          Preview do cliente
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Visual simples de como o questionário será respondido.
      </p>

      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-base font-semibold tracking-[-0.02em]">
          {template.name}
        </p>
        {template.description ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {template.description}
          </p>
        ) : null}

        {groups.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/[0.12] p-5 text-center text-xs text-muted-foreground">
            Adicione perguntas para ver o preview.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {groups.map((group) => (
              <section key={group.section} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <CheckSquare className="size-3.5" />
                  {group.section}
                </div>
                {group.fields.map((field) => (
                  <PreviewField key={field.id} field={field} />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

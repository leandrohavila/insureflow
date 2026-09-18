"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Eye, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type {
  CreateQuestionnaireFieldInput,
  QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"

import {
  DEFAULT_SECTION,
  defaultQuestionKind,
  questionKindOptions,
  sectionSuggestions,
} from "./constants"
import type { FieldSettings, InsuranceQuestionKind } from "./types"
import {
  buildFieldOptions,
  getFieldSection,
  getFieldSettings,
  getQuestionKindFromField,
  normalizeSectionName,
  optionalFormValue,
  uniqueQuestionKey,
  uniqueSectionNames,
} from "./utils"

import { PreviewControl } from "./preview-control"

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

export function QuestionnaireFieldDialog({
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
                A ordem é controlada pelo arrastar e soltar no builder. Ao salvar, a chave
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


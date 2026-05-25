"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Compass,
  FileText,
  Inbox,
  Users,
} from "lucide-react"

import { SectionPanel } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import { buttonVariants } from "@/components/ui/button"
import {
  formatCnpjMask,
  formatCpfMask,
  stripDocumentDigits,
} from "@/lib/documents/document"
import {
  useLeadDuplicates,
  type Lead,
  type LeadDuplicate,
} from "@/lib/data-access/modules/leads"
import { cn } from "@/lib/utils"

import { LEAD_STATUS_LABEL } from "../lead-shared"

type LeadSourceSectionProps = {
  lead: Lead
}

function formatBrDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

/**
 * Origem do lead — captação, primeiro registro, documento e — quando aplicável
 * — duplicatas pelo mesmo documento.
 *
 * Por que separar de Visão Geral: origem é o "passado" do lead (de onde veio,
 * quando entrou, há outros iguais?). Misturar com contato polui a leitura
 * operacional. Aqui o vendedor responde "vale qualificar?" antes de "como
 * falar com ele?".
 *
 * O check de duplicatas reusa `useLeadDuplicates` (já com debounce e
 * staleTime). Como o lead já existe e o documento já está normalizado,
 * o debounce não atrapalha — a query roda imediatamente na primeira render
 * desta seção, com `excludeId` para não mostrar o próprio lead.
 */
export function LeadSourceSection({ lead }: LeadSourceSectionProps) {
  const searchParams = useSearchParams()
  const flagSuffix = searchParams.get("sheet") === "v2" ? "&sheet=v2" : ""

  const documentRawDigits = lead.document
    ? stripDocumentDigits(lead.document)
    : ""
  const hasDocument = documentRawDigits.length > 0

  const formattedDocument = useMemo(() => {
    if (!hasDocument || !lead.documentType) return null
    return lead.documentType === "cpf"
      ? formatCpfMask(documentRawDigits)
      : formatCnpjMask(documentRawDigits)
  }, [documentRawDigits, hasDocument, lead.documentType])

  // useLeadDuplicates debounce-ifica o input; passamos o documento já
  // formatado (o hook normaliza internamente). debounceMs=0 minimiza atraso
  // de uma seção que só monta sob clique do usuário.
  const duplicatesQuery = useLeadDuplicates({
    document: formattedDocument ?? "",
    excludeId: lead.id,
    enabled: hasDocument,
    debounceMs: 0,
  })

  const duplicates: LeadDuplicate[] = duplicatesQuery.data ?? []
  const documentLabel = lead.documentType
    ? lead.documentType === "cpf"
      ? "CPF"
      : "CNPJ"
    : "Documento"

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Captação" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={Compass}
            label="Origem"
            value={lead.source || "Não informada"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Entrou no funil"
            value={formatBrDate(lead.createdAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          {formattedDocument ? (
            <PropertyCell
              icon={FileText}
              label={documentLabel}
              value={
                <code className="font-mono text-[11px] tabular-nums text-foreground/80">
                  {formattedDocument}
                </code>
              }
              className="bg-[var(--crm-surface-panel)]"
              span={2}
            />
          ) : null}
        </PropertyGrid>
      </SectionPanel>

      {hasDocument ? (
        <SectionPanel
          title="Possíveis duplicatas"
          tone="default"
          description={
            duplicates.length > 0
              ? `${duplicates.length} ${
                  duplicates.length === 1 ? "registro" : "registros"
                } com o mesmo documento.`
              : "Nenhum outro lead com este documento."
          }
        >
          {duplicates.length > 0 ? (
            <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
              <div
                className={cn(
                  "flex items-start gap-2 rounded-md px-3 py-2",
                )}
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--crm-tone-warn) 8%, transparent)",
                  boxShadow:
                    "inset 0 0 0 1px color-mix(in oklch, var(--crm-tone-warn) 22%, transparent)",
                }}
              >
                <AlertTriangle
                  className="size-3.5 shrink-0 text-amber-300"
                  strokeWidth={1.75}
                />
                <p className="crm-text-meta text-foreground/80">
                  Confirme com o time se há sobreposição comercial antes de
                  qualificar este lead.
                </p>
              </div>

              <ul className="flex flex-col gap-1">
                {duplicates.map((duplicate) => (
                  <li
                    key={duplicate.id}
                    className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-white/[0.04]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Users
                        className="size-3.5 shrink-0 text-foreground/45"
                        strokeWidth={1.5}
                      />
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="crm-text-meta truncate text-foreground/90">
                          {duplicate.name}
                        </span>
                        <span className="crm-text-micro">
                          {LEAD_STATUS_LABEL[duplicate.status]}
                          {duplicate.assignedTo
                            ? ` · ${duplicate.assignedTo}`
                            : ""}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/leads?lead=${duplicate.id}${flagSuffix}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1 text-[11px]",
                      )}
                    >
                      Abrir
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5"
              style={{ borderColor: "var(--crm-stroke-faint)" }}
            >
              <Inbox
                className="size-3.5 shrink-0 text-foreground/40"
                strokeWidth={1.5}
              />
              <p className="crm-text-meta text-foreground/65">
                Documento único — sem riscos de duplicidade aparente.
              </p>
            </div>
          )}
        </SectionPanel>
      ) : (
        <SectionPanel
          title="Possíveis duplicatas"
          tone="default"
          density="compact"
        >
          <div
            className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5"
            style={{ borderColor: "var(--crm-stroke-faint)" }}
          >
            <FileText
              className="size-3.5 shrink-0 text-foreground/40"
              strokeWidth={1.5}
            />
            <p className="crm-text-meta text-foreground/65">
              Cadastre o documento do lead para checagem automática de
              duplicidade.
            </p>
          </div>
        </SectionPanel>
      )}
    </div>
  )
}

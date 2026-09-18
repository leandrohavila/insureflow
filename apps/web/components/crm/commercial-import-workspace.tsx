"use client"

import { useState } from "react"
import Link from "next/link"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  commitImport,
  downloadImportTemplate,
  previewImport,
  type ImportPreviewError,
} from "@/lib/data-access/modules/commercial-import/api"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

type Kind = "leads" | "clientes"

export function CommercialImportWorkspace({ kind }: { kind: Kind }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{
    total: number
    valid: number
    invalid: number
    errors: ImportPreviewError[]
    rows: unknown[]
    errorLogCsv: string
  } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const permission = kind === "leads" ? "leads:manage" : "clients:manage"
  const title = kind === "leads" ? "Importar leads" : "Importar clientes"

  async function onPreview() {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const data = await previewImport(kind, file)
      setPreview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na validação")
    } finally {
      setBusy(false)
    }
  }

  async function onCommit() {
    if (!preview?.rows.length) return
    setBusy(true)
    setError(null)
    try {
      const data = await commitImport(kind, preview.rows)
      setResult(
        `Criados: ${data.created} · Atualizados: ${data.updated}${
          data.policies != null ? ` · Apólices: ${data.policies}` : ""
        } · Falhas: ${data.failed}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na importação")
    } finally {
      setBusy(false)
    }
  }

  function downloadErrors() {
    if (!preview?.errorLogCsv) return
    const blob = new Blob([preview.errorLogCsv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `erros-importacao-${kind}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title={title}
        description="Valide a planilha antes de gravar. CPF/CNPJ existente atualiza o cadastro."
      >
        <Link
          href="/crm/importacoes"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Voltar
        </Link>
        <PermissionGate permission={permission}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadImportTemplate(kind)}
          >
            Baixar Modelo
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <div className="space-y-4 px-1">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setPreview(null)
            setResult(null)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission={permission}>
            <Button size="sm" disabled={!file || busy} onClick={onPreview}>
              Validar planilha
            </Button>
            <Button
              size="sm"
              disabled={!preview?.valid || busy}
              onClick={onCommit}
            >
              Importar {preview?.valid ?? 0} válidos
            </Button>
          </PermissionGate>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-400">{result}</p> : null}
        {preview ? (
          <div className="space-y-3 rounded-xl border border-white/[0.06] p-4">
            <p className="text-sm">
              Total: <strong>{preview.total}</strong> · Válidos:{" "}
              <strong>{preview.valid}</strong> · Com erro:{" "}
              <strong>{preview.invalid}</strong>
            </p>
            {preview.invalid > 0 ? (
              <Button size="sm" variant="outline" onClick={downloadErrors}>
                Baixar log de erros
              </Button>
            ) : null}
            {preview.errors.length ? (
              <ul className="max-h-56 space-y-1 overflow-auto text-xs text-muted-foreground">
                {preview.errors.slice(0, 40).map((item, index) => (
                  <li key={`${item.row}-${index}`}>
                    Linha {item.row}
                    {item.field ? ` · ${item.field}` : ""}: {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

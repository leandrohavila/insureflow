import { apiClient } from "@/lib/data-access/api-client"

export type ImportPreviewError = {
  row: number
  field?: string
  message: string
}

export type ImportPreviewResponse<T> = {
  total: number
  valid: number
  invalid: number
  errors: ImportPreviewError[]
  rows: T[]
  errorLogCsv: string
}

export type ImportCommitResponse = {
  created: number
  updated: number
  policies?: number
  failed: number
  errors: ImportPreviewError[]
}

export async function downloadImportTemplate(kind: "leads" | "clientes") {
  const response = await fetch(`/api/commercial-import/${kind}/template`)
  if (!response.ok) throw new Error("Não foi possível baixar o modelo")
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `modelo-${kind}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

export async function previewImport<T>(kind: "leads" | "clientes", file: File) {
  const form = new FormData()
  form.append("file", file)
  const response = await fetch(`/api/commercial-import/${kind}/preview`, {
    method: "POST",
    body: form,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message ?? "Falha ao validar a planilha")
  }
  return data as ImportPreviewResponse<T>
}

export async function commitImport<T>(kind: "leads" | "clientes", rows: T[]) {
  return apiClient.post<ImportCommitResponse>(
    `/api/commercial-import/${kind}/commit`,
    { rows },
  )
}

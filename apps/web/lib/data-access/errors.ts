export type ApiErrorPayload = {
  error?: string
  message?: string | string[]
  statusCode?: number
}

export class ApiClientError extends Error {
  readonly status: number
  readonly payload: ApiErrorPayload | null

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.payload = payload
  }
}

export function getErrorMessage(error: unknown, fallback = "Erro inesperado") {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return fallback
}

export function normalizeApiErrorPayload(data: unknown): ApiErrorPayload | null {
  if (!data || typeof data !== "object") return null
  return data as ApiErrorPayload
}

export function messageFromPayload(payload: ApiErrorPayload | null, fallback: string) {
  const message = payload?.error ?? payload?.message
  if (Array.isArray(message)) return message.join(", ")
  return message ?? fallback
}

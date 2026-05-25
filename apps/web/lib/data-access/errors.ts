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

const GENERIC_HTTP_MESSAGES = new Set([
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Conflict",
  "Internal Server Error",
  "Unprocessable Entity",
])

function isGenericHttpMessage(message: string) {
  return GENERIC_HTTP_MESSAGES.has(message.trim())
}

export function getErrorMessage(error: unknown, fallback = "Erro inesperado") {
  if (error instanceof ApiClientError) {
    const fromPayload = messageFromPayload(error.payload, fallback)
    if (!isGenericHttpMessage(fromPayload)) return fromPayload
    return fallback
  }
  if (error instanceof Error) {
    if (!isGenericHttpMessage(error.message)) return error.message
    return fallback
  }
  if (typeof error === "string") {
    if (!isGenericHttpMessage(error)) return error
    return fallback
  }
  return fallback
}

export function normalizeApiErrorPayload(data: unknown): ApiErrorPayload | null {
  if (!data || typeof data !== "object") return null
  return data as ApiErrorPayload
}

export function messageFromPayload(payload: ApiErrorPayload | null, fallback: string) {
  const message = payload?.message ?? payload?.error
  if (Array.isArray(message)) {
    const items = message
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item && !isGenericHttpMessage(item))
    if (items.length > 0) return items.join(", ")
    return fallback
  }
  if (typeof message === "string" && message.trim()) {
    if (isGenericHttpMessage(message)) return fallback
    return message.trim()
  }
  return fallback
}

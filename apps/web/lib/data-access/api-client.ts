import {
  ApiClientError,
  messageFromPayload,
  normalizeApiErrorPayload,
} from "@/lib/data-access/errors"
import {
  bug010LeadCreateLog,
  bug010LeadCreateTraceId,
} from "@/lib/performance/bug010-lead-create"

type ApiClientOptions = RequestInit & {
  json?: unknown
}

async function parseResponseBody(
  response: Response,
  performanceLabel?: string,
) {
  const contentType = response.headers.get("Content-Type") ?? ""
  if (response.status === 204) return null
  if (contentType.includes("application/json")) {
    if (!performanceLabel) {
      return response.json().catch(() => null)
    }

    const transferStartedAt = performance.now()
    const text = await response.text().catch(() => null)
    bug010LeadCreateLog(`${performanceLabel} transferência body`, {
      transferMs: Number((performance.now() - transferStartedAt).toFixed(2)),
      bytes: text?.length ?? 0,
    })
    if (text === null) return null

    const parseStartedAt = performance.now()
    try {
      const parsed = JSON.parse(text)
      bug010LeadCreateLog(`${performanceLabel} JSON.parse`, {
        parseMs: Number((performance.now() - parseStartedAt).toFixed(2)),
      })
      return parsed
    } catch {
      bug010LeadCreateLog(`${performanceLabel} JSON.parse erro`, {
        parseMs: Number((performance.now() - parseStartedAt).toFixed(2)),
      })
      return null
    }
  }
  return response.text().catch(() => null)
}

async function request<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { json, headers, ...init } = options
  const requestHeaders = new Headers(headers)

  if (json !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  const traceId = bug010LeadCreateTraceId()
  const performanceLabel =
    init.method === "GET" && path.startsWith("/api/leads")
      ? `Frontend GET ${path}`
      : undefined
  if (traceId && performanceLabel) {
    requestHeaders.set("X-Bug010-Trace", traceId)
  }

  const fetchStartedAt = performance.now()
  if (performanceLabel) {
    bug010LeadCreateLog(`${performanceLabel} fetch start`)
  }
  const response = await fetch(path, {
    ...init,
    headers: requestHeaders,
    body: json === undefined ? init.body : JSON.stringify(json),
    cache: init.cache ?? "no-store",
  })
  if (performanceLabel) {
    bug010LeadCreateLog(`${performanceLabel} fetch response`, {
      fetchMs: Number((performance.now() - fetchStartedAt).toFixed(2)),
      status: response.status,
    })
  }
  const data = await parseResponseBody(response, performanceLabel)

  if (!response.ok) {
    const payload = normalizeApiErrorPayload(data)
    throw new ApiClientError(
      messageFromPayload(payload, "Erro ao comunicar com o servidor"),
      response.status,
      payload,
    )
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, json?: unknown, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "POST", json }),
  patch: <T>(path: string, json?: unknown, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "PATCH", json }),
  put: <T>(path: string, json?: unknown, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "PUT", json }),
  delete: <T>(path: string, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
}

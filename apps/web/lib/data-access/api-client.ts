import {
  ApiClientError,
  messageFromPayload,
  normalizeApiErrorPayload,
} from "@/lib/data-access/errors"

type ApiClientOptions = RequestInit & {
  json?: unknown
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? ""
  if (response.status === 204) return null
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null)
  }
  return response.text().catch(() => null)
}

async function request<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const { json, headers, ...init } = options
  const requestHeaders = new Headers(headers)

  if (json !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  const response = await fetch(path, {
    ...init,
    headers: requestHeaders,
    body: json === undefined ? init.body : JSON.stringify(json),
    cache: init.cache ?? "no-store",
  })
  const data = await parseResponseBody(response)

  if (!response.ok) {
    const payload = normalizeApiErrorPayload(data)
    throw new ApiClientError(
      messageFromPayload(payload, "Erro ao comunicar com o servidor"),
      response.status,
      payload
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
  delete: <T>(path: string, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
}

import { NextResponse } from "next/server";

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend";

const SUBMISSION_QUERY_KEYS = [
  "templateId",
  "status",
  "origin",
  "mode",
  "leadId",
  "customerId",
  "dealId",
  "dateFrom",
  "dateTo",
  "page",
  "limit",
] as const;

function sanitizeSubmissionSearch(search: string) {
  const incoming = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const sanitized = new URLSearchParams();
  const dropped: string[] = [];

  incoming.forEach((value, key) => {
    if (
      !SUBMISSION_QUERY_KEYS.includes(
        key as (typeof SUBMISSION_QUERY_KEYS)[number],
      )
    ) {
      dropped.push(key);
      return;
    }
    if (value.trim() === "") return;
    sanitized.set(key, value);
  });

  const query = sanitized.toString();
  return {
    search: query ? `?${query}` : "",
    dropped,
  };
}

export async function GET(request: Request) {
  const { search: rawSearch } = new URL(request.url);
  const { search, dropped } = sanitizeSubmissionSearch(rawSearch);

  if (process.env.BUG003_DEBUG === "true") {
    console.warn("[BUG-003][bff] GET submissions", {
      rawSearch,
      forwardedSearch: search,
      dropped,
    });
  }

  const response = await backendFetch(
    `/api/v1/questionnaires/submissions${search}`,
    {},
    request,
  );

  if (process.env.BUG003_DEBUG === "true" && !response.ok) {
    const body = await response.clone().text();
    console.warn("[BUG-003][bff] GET submissions backend error", {
      status: response.status,
      body,
    });
    return proxyBackendResponse(response);
  }

  return proxyBackendResponse(response);
}

export async function POST(request: Request) {
  const body = await request.json();
  const response = await backendFetch(
    "/api/v1/questionnaires/submissions",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    request,
  );

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return proxyBackendResponse(response);
}

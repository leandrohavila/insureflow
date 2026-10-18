import { NextResponse } from "next/server";

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const response = await backendFetch(
    `/api/v1/questionnaires/template-suggestions${search}`,
    {},
    request,
  );

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return proxyBackendResponse(response);
}

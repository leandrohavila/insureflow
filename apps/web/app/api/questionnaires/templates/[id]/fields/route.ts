import { NextResponse } from "next/server";

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const response = await backendFetch(
    `/api/v1/questionnaires/templates/${id}/fields`,
  );
  return proxyBackendResponse(response);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const response = await backendFetch(
    `/api/v1/questionnaires/templates/${id}/fields`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return proxyBackendResponse(response);
}

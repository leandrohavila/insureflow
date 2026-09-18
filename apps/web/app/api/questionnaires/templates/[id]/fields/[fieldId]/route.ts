import { backendFetch, proxyBackendResponse } from "@/lib/api/backend";

type RouteContext = {
  params: Promise<{ id: string; fieldId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id, fieldId } = await context.params;
  const response = await backendFetch(
    `/api/v1/questionnaires/templates/${id}/fields/${fieldId}`,
  );
  return proxyBackendResponse(response);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, fieldId } = await context.params;
  const body = await request.json();
  const response = await backendFetch(
    `/api/v1/questionnaires/templates/${id}/fields/${fieldId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return proxyBackendResponse(response);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, fieldId } = await context.params;
  const response = await backendFetch(
    `/api/v1/questionnaires/templates/${id}/fields/${fieldId}`,
    {
      method: "DELETE",
    },
  );
  return proxyBackendResponse(response);
}

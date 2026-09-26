import { notFound, permanentRedirect } from "next/navigation";

import { CatalogNotFoundError } from "@/lib/errors";
import { normalizePropertyCode } from "@/lib/property-code";
import { getPropertyByCode } from "@/services/catalog";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ code: string }> };

export default async function PropertyCodePage({ params }: PageProps) {
  const { code } = await params;
  const digits = normalizePropertyCode(code);
  if (!digits) notFound();
  try {
    const { data } = await getPropertyByCode(digits);
    permanentRedirect(`/imoveis/${data.slug}`);
  } catch (error) {
    if (error instanceof CatalogNotFoundError) notFound();
    throw error;
  }
}

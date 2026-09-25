import { Suspense } from "react";

import { InterestClient } from "@/components/interest-client";

export const dynamic = "force-dynamic";

export default function InterestPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">Carregando...</p>}>
      <InterestClient />
    </Suspense>
  );
}

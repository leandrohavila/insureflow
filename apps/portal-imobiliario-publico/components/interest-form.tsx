"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitLead } from "@/hooks/use-submit-lead";

export function InterestForm({
  propertySlug,
  propertyId,
  propertyCode,
  propertyTitle,
  purpose,
  intent = "interesse",
}: {
  propertySlug: string;
  propertyId: string;
  propertyCode?: string | null;
  propertyTitle?: string;
  purpose?: string;
  intent?: string;
}) {
  const { submit, loading, error, result, source } = useSubmitLead();
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLocalError(null);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message =
      String(formData.get("message") ?? "").trim() ||
      (intent === "visita" ? "Gostaria de agendar uma visita." : "");

    if (!name) {
      setLocalError("Informe seu nome");
      return;
    }
    if (!email && !phone) {
      setLocalError("Informe e-mail ou telefone");
      return;
    }

    const propertyUrl = `/imoveis/${propertySlug}`;
    await submit({
      propertyId,
      propertySlug,
      name,
      email: email || undefined,
      phone: phone || undefined,
      message: message || undefined,
      source: "portal_imobiliario",
      metadata: {
        landingPage: `${propertyUrl}/interesse`,
        placement: "property",
        propertyCode: propertyCode || "",
        propertyUrl,
        purpose: purpose || "",
        intent,
        propertyTitle: propertyTitle || "",
      },
    }).catch(() => undefined);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">Interesse enviado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {source === "mock"
            ? "Modo mock: o CRM não recebeu este lead."
            : "O time comercial recebe este contato no CRM."}
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required maxLength={120} />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" maxLength={160} />
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" maxLength={40} placeholder="65999999999" />
      </div>
      <div>
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          name="message"
          maxLength={2000}
          defaultValue={intent === "visita" ? "Gostaria de agendar uma visita." : ""}
        />
      </div>
      {(localError || error) && (
        <p className="text-sm text-red-700">{localError || error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar interesse"}
      </Button>
    </form>
  );
}

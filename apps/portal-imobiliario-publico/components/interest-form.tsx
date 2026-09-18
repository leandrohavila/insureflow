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
}: {
  propertySlug: string;
  propertyId: string;
}) {
  const { submit, loading, error, result, source } = useSubmitLead();
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLocalError(null);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name) {
      setLocalError("Informe seu nome");
      return;
    }
    if (!email && !phone) {
      setLocalError("Informe e-mail ou telefone");
      return;
    }

    await submit({
      propertyId,
      propertySlug,
      name,
      email: email || undefined,
      phone: phone || undefined,
      message: message || undefined,
    }).catch(() => undefined);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">Interesse enviado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {source === "mock"
            ? "Modo mock: o CRM não recebeu este lead."
            : "O time comercial recebe este contato no CRM (PropertyLead)."}
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
        <Textarea id="message" name="message" maxLength={2000} />
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

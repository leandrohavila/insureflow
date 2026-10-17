export type PortalStat = {
  value: string;
  label: string;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

export function resolvePortalMetrics(input: {
  available: number | null;
  creci: string | null;
}): PortalStat[] {
  const availableOverride = readEnv("NEXT_PUBLIC_PORTAL_STAT_AVAILABLE");
  const clientsOverride = readEnv("NEXT_PUBLIC_PORTAL_STAT_CLIENTS");
  const volumeOverride = readEnv("NEXT_PUBLIC_PORTAL_STAT_VOLUME");
  const creciOverride = readEnv("NEXT_PUBLIC_PORTAL_STAT_CRECI");

  const availableValue =
    availableOverride ??
    (input.available != null && Number.isFinite(input.available) && input.available > 0
      ? `+${new Intl.NumberFormat("pt-BR").format(input.available)}`
      : "A publicar");

  const creciValue = input.creci?.trim() || creciOverride || "A informar";

  return [
    { value: availableValue, label: "Imóveis disponíveis" },
    { value: clientsOverride ?? "Direto", label: "Clientes atendidos" },
    { value: volumeOverride ?? "Local", label: "em negócios" },
    { value: creciValue, label: "CRECI" },
  ];
}

export type PortalRating = {
  score: string | null;
  count: string | null;
  source: string;
};

export function portalRating(): PortalRating {
  return {
    score: readEnv("NEXT_PUBLIC_PORTAL_RATING_SCORE"),
    count: readEnv("NEXT_PUBLIC_PORTAL_RATING_COUNT"),
    source: readEnv("NEXT_PUBLIC_PORTAL_RATING_SOURCE") ?? "Google",
  };
}

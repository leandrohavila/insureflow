export function normalizePropertyCode(value: string) {
  const match = value.trim().match(/^(?:cod-)?(\d{3,8})$/i);
  return match?.[1] ?? null;
}

const CODE_ONLY_FIELDS = [
  "purpose",
  "type",
  "neighborhood",
  "city",
  "priceMin",
  "priceMax",
  "q",
] as const;

/** Quando a busca traz só o código, o portal abre o imóvel. */
export function codeOnlyHref(form: HTMLFormElement) {
  const data = new FormData(form);
  const digits = normalizePropertyCode(String(data.get("code") ?? ""));
  if (!digits) return null;
  for (const key of CODE_ONLY_FIELDS) {
    if (String(data.get(key) ?? "").trim()) return null;
  }
  return `/imoveis/codigo/${digits}`;
}

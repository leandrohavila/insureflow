export class CatalogNotFoundError extends Error {
  constructor(message = "Imóvel não encontrado") {
    super(message);
    this.name = "CatalogNotFoundError";
  }
}

export class CatalogUnavailableError extends Error {
  constructor(message = "Catálogo indisponível") {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

export function isCatalogUnavailable(error: unknown) {
  if (error instanceof CatalogUnavailableError) return true;
  if (error instanceof CatalogNotFoundError) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const text = `${error.name} ${error.message}`.toLowerCase();
    return (
      text.includes("econnrefused") ||
      text.includes("fetch failed") ||
      text.includes("network") ||
      text.includes("enotfound")
    );
  }
  return false;
}

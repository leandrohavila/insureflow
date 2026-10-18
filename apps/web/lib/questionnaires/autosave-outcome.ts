export type AutosaveFailureTone = "conflict" | "error";

export function isStaleAutosaveConflict(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("status" in error)) return false;
  return (error as { status?: unknown }).status === 409;
}

/** Falha de autosave nunca é apresentada como rascunho salvo. */
export function autosaveFailurePresentation(error: unknown): {
  saved: false;
  tone: AutosaveFailureTone;
  message: string;
} {
  if (isStaleAutosaveConflict(error)) {
    return {
      saved: false,
      tone: "conflict",
      message:
        "As respostas não foram salvas. Existe uma versão mais recente neste lead.",
    };
  }

  return {
    saved: false,
    tone: "error",
    message:
      "As respostas não foram salvas. Falha ao sincronizar com o servidor.",
  };
}

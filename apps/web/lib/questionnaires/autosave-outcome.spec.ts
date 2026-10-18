import { autosaveFailurePresentation } from "./autosave-outcome";

describe("autosaveFailurePresentation", () => {
  it("não indica salvamento quando o servidor recusa uma versão antiga", () => {
    const presentation = autosaveFailurePresentation({ status: 409 });

    expect(presentation.saved).toBe(false);
    expect(presentation.tone).toBe("conflict");
    expect(presentation.message).toMatch(/não foram salvas/i);
    expect(presentation.message).not.toMatch(/rascunho salvo/i);
  });

  it("não indica salvamento quando a rede falha", () => {
    const presentation = autosaveFailurePresentation(new Error("Failed to fetch"));

    expect(presentation.saved).toBe(false);
    expect(presentation.tone).toBe("error");
    expect(presentation.message).toMatch(/não foram salvas/i);
    expect(presentation.message).not.toMatch(/rascunho salvo/i);
  });
});

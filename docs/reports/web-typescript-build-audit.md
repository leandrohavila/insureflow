# Auditoria TypeScript / Build — `apps/web`

**Data:** 2026-08-25  
**Objetivo:** `npx turbo run build --filter=web` 100% verde  
**Restrições:** sem `any`, sem `@ts-ignore`, sem assertions desnecessárias

---

## Resultado final

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit -p apps/web/tsconfig.json` | **PASS** (0 erros) |
| `npx turbo run build --filter=web` | **PASS** (`TURBO_EXIT=0`, 3 tasks, ~1m41s) |
| Rotas R1 no build | `/real-estate/*` listadas no output Next |

# BUILD GREEN

---

## Inventário inicial (typecheck)

**33 erros TS** no primeiro `tsc` (antes das correções), em dois grupos:

1. **`Button` sem prop `asChild`** (Base UI) — 7 ocorrências em 4 arquivos CRM  
2. **Módulos `@repo/forms-engine` / `@repo/forms-library` sem `dist/`** — 26 erros (TS2307 + TS7006 implícitos)

---

## Correções aplicadas

### A) TypeScript — CRM (`asChild` / agenda)

| Arquivo | Linha (antes) | Erro | Correção aplicada |
|---------|---------------|------|-------------------|
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | 69 | `TS2322`: `string \| undefined` não assignable a `string` em `updateActivity(id, …)` | Helper `parseAgendaItemId()` valida `item.id`; só chama APIs com `id: string` garantido |
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | 83 | Mesmo padrão em `reschedule` / `updateLeadFollowUp` | Mesmo helper; early return se inválido |
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | 191–215 | `TS2322`: `asChild` inexistente em `Button` | `Link` + `buttonVariants({ size: "sm", variant: "ghost" })` + `cn` |
| `apps/web/components/crm/commercial-import-hub.tsx` | 25 | `TS2322`: `asChild` | `Link` + `buttonVariants({ size: "sm" })` + `mt-4` |
| `apps/web/components/crm/commercial-import-hub.tsx` | 36 | `TS2322`: `asChild` | Idem |
| `apps/web/components/crm/commercial-import-workspace.tsx` | 86 | `TS2322`: `asChild` | `Link` + `buttonVariants({ variant: "outline", size: "sm" })` |
| `apps/web/components/crm/renewal-portfolio-workspace.tsx` | 197 | `TS2322`: `asChild` | `Link` + `buttonVariants({ size: "sm", variant: "ghost" })` |

### B) Dependências workspace — forms packages

| Arquivo | Linha | Erro | Correção aplicada |
|---------|-------|------|-------------------|
| `…/block-library-drawer.tsx` | 22 | `TS2307` Cannot find module `@repo/forms-library` | Build `@repo/forms-library` → gera `dist/index.d.ts` |
| `…/block-library-drawer.tsx` | 128, 134, 180 | `TS7006` parâmetro implícito `any` | Resolvido ao tipar o módulo (exports do package) |
| `…/builder-workspace.tsx` | 21 | `TS2307` `@repo/forms-library` | Build forms-library |
| `…/field-library-drawer.tsx` | 27 | `TS2307` `@repo/forms-library` | Build forms-library |
| `…/field-library-drawer.tsx` | 104, 119, 132, 181, 187 | `TS7006` implícito `any` | Resolvido via tipos do package |
| `…/rule-tester-dialog.tsx` | 14 | `TS2307` `@repo/forms-engine` | Build `@repo/forms-engine` |
| `…/rule-tester-dialog.tsx` | 115 | `TS7006` `item`/`index` implícitos | Resolvido via tipos do package |
| `…/rules-constants.ts` | 1 | `TS2307` `@repo/forms-engine` | Build forms-engine |
| `…/rules-editor-panel.tsx` | 21 | `TS2307` `@repo/forms-engine` | Build forms-engine |
| `…/rules-editor-panel.tsx` | 336, 460 | `TS7006` implícito `any` | Resolvido via tipos do package |
| `…/template-wizard.config.ts` | 5 | `TS2307` `@repo/forms-library` | Build forms-library |
| `…/questionnaire-templates-page.tsx` | 76, 82 | `TS2307` forms-engine / forms-library | Build ambos |
| `…/questionnaire-templates-page.tsx` | 651 | `TS7006` `field` implícito | Resolvido via tipos do package |
| `apps/web/lib/questionnaires/forms-library-adapter.ts` | 4 | `TS2307` `@repo/forms-library` | Build forms-library |
| `apps/web/lib/questionnaires/forms-library-storage.ts` | 8 | `TS2307` `@repo/forms-library` | Build forms-library |
| `apps/web/lib/questionnaires/forms-library-storage.ts` | 27, 39 | `TS7006` `id` implícito | Resolvido via tipos do package |
| `apps/web/lib/questionnaires/questionnaire-field-validation.ts` | 21 | `TS2307` `@repo/forms-engine` | Build forms-engine |
| `apps/web/lib/questionnaires/questionnaire-rules.ts` | 8 | `TS2307` `@repo/forms-engine` | Build forms-engine |

**Comando executado:**

```powershell
npx turbo run build --filter=@repo/forms-engine --filter=@repo/forms-library
```

Os packages exportam `types`/`main` a partir de `./dist/*`. Sem `dist`, o TypeScript reportava `TS2307` e cascateava `TS7006`.

> Nota: `turbo run build --filter=web` já depende de `^build` e rebuilda esses packages automaticamente no CI/Vercel. O typecheck isolado (`tsc -p apps/web`) exige `dist` presente localmente.

---

## Detalhe da correção principal (agenda)

```ts
function parseAgendaItemId(
  compositeId: string,
): { source: "activity" | "follow_up"; id: string } | null {
  // rejeita vazio, sem ":", source inválido, id vazio
  // retorna id: string (nunca undefined)
}
```

- Sem `as string`
- Sem `@ts-ignore`
- Sem `any`

Padrão de links: `Link` + `className={cn(buttonVariants(...))}` (compatível com `Button` Base UI atual).

---

## Verificação final

```text
node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json
→ exit 0, 0 errors

npx turbo run build --filter=web
→ Tasks: 3 successful, 3 total
→ TURBO_EXIT=0
→ ✓ Compiled successfully
```

---

## Arquivos alterados (código)

1. `apps/web/components/crm/commercial-agenda-workspace.tsx`
2. `apps/web/components/crm/commercial-import-hub.tsx`
3. `apps/web/components/crm/commercial-import-workspace.tsx`
4. `apps/web/components/crm/renewal-portfolio-workspace.tsx`

Artefatos gerados (build, não editados à mão):  
`packages/forms-engine/dist/**`, `packages/forms-library/dist/**`

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Status** | **BUILD GREEN** |
| **Typecheck** | 0 erros |
| **Turbo web build** | SUCCESS |
| **any / ts-ignore** | Não utilizados |

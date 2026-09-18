# HOTFIX 7.3.1 — Loop de Auto Save no Builder de Questionários

**Data:** 2026-07-14  
**Escopo:** Frontend (`apps/web`) — Builder de templates  
**Status:** Corrigido

---

## Causa raiz

Após a Sprint 7.3, o autosave de **settings do template** (regras + seções) entrava em ciclo de feedback:

1. `useEffect` observava `debouncedTemplateRules`, `saveTemplateRules` e `selectedTemplate`.
2. Cada PATCH bem-sucedido disparava `invalidateQueries` na lista de templates.
3. O refetch atualizava `selectedTemplate.settings` (nova referência).
4. O efeito de hidratação fazia `setTemplateRules(parseRulesFromTemplateSettings(...))`.
5. Mesmo com conteúdo equivalente, o debounce (800 ms) reagendava outro PATCH.
6. O ciclo repetia até **429 Too Many Requests** e `net::ERR_INSUFFICIENT_RESOURCES`.

Fatores agravantes:

- `saveTemplateRules` recriado a cada mudança de `selectedTemplate` (dependência do `useCallback`).
- Ausência de comparação profunda/hash antes do PATCH.
- `invalidateQueries` em todo autosave, forçando refetch desnecessário.

No painel de propriedades do campo, o form não era ressincronizado após save remoto, mantendo `isDirty === true` e reenviando PATCHs.

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/lib/questionnaires/template-settings-autosave.util.ts` | **Novo** — `stableStringify`, `hashSettings`, debounce 600 ms |
| `apps/web/lib/questionnaires/template-settings-autosave.util.spec.ts` | **Novo** — testes unitários de hash/comparação |
| `apps/web/lib/questionnaires/use-template-settings-autosave.ts` | **Novo** — hook com `isSaving`, `lastSavedHash`, `lastSavedVersion`, `pendingChanges` |
| `apps/web/lib/data-access/modules/questionnaires/hooks.ts` | Autosave com `autosave: true` evita `invalidateQueries`; patch cirúrgico do cache |
| `apps/web/components/questionnaires/questionnaire-templates-page.tsx` | Remove loop de regras; usa hook de autosave; debounce 600 ms |
| `apps/web/components/questionnaires/questionnaire-builder/field-properties-panel.tsx` | Guardas de hash, debounce estabilizado, sync pós-save |

---

## Fluxo antigo

```
Editar regra/seção
  → debounce 800 ms
  → updateTemplate.mutate (PATCH)
  → invalidateQueries (lista)
  → selectedTemplate.settings muda (refetch)
  → setTemplateRules(parse...)
  → saveTemplateRules recriado
  → useEffect dispara de novo
  → PATCH (loop infinito)
```

---

## Fluxo novo

```
Editar
  → debounce 600 ms
  → comparar hash(settings) com lastSavedHash
  → se igual: FIM (sem PATCH)
  → se diferente e !isSaving:
      → 1 PATCH (autosave: true)
      → 200
      → atualizar lastSavedHash / lastSavedVersion / lastSavedUpdatedAt
      → patch cache local (sem invalidate global)
      → dirty=false / pendingChanges=null
  → FIM
```

Proteções adicionais:

- Só persiste regras quando `debouncedTemplateRules === templateRules` (debounce estabilizado).
- Hidratação de regras só quando `updatedAt` muda e hash parsed difere do snapshot.
- Campos: `lastSavedHash`, `pendingChanges`, sync por `field.updatedAt` após save.

---

## Validação

| Verificação | Resultado |
|-------------|-----------|
| Lint (arquivos alterados) | OK |
| Typecheck (`npm run check-types --filter=web`) | OK |
| Build (`npm run build --filter=web`) | OK |
| Testes unitários (`template-settings-autosave.util.spec.ts`) | OK |
| Fluxo manual esperado | 1 PATCH por edição após 600 ms; sem loop |

Comportamento esperado no DevTools → Network:

- Uma única requisição `PATCH /api/questionnaires/templates/{id}` por alteração distinta.
- Status `200`/`204`, sem rajadas centenas de requests.

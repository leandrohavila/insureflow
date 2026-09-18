# Princípios UX operacional — InsureFlow

> Diretrizes para corretores e operadores comerciais. Alinhadas aos ADRs 002–004.

## 1. Nunca bloquear o corretor sem necessidade

- Cadastro e edição de lead devem fluir mesmo com alertas de duplicidade (**planejado**).
- Rascunho de questionário nunca exige todos os campos obrigatórios.
- Falha temporária de rede no autosave não fecha o formulário.

**Exceções intencionais (invariantes):**

- Converter lead já convertido
- Submeter questionário sem campos required
- Cadastrar cliente com documento já existente no tenant

---

## 2. Warning-first

- Preferir banners, badges e toasts informativos a modais bloqueantes.
- Warnings devem oferecer **ação imediata** (abrir registro existente, revisar, continuar).
- Registrar quando o usuário ignora warning (**planejado** — auditoria comercial).

**Implementado hoje:** autosave com falha silenciosa + mensagem âmbar; finalize bloqueia apenas após tentativa explícita.

---

## 3. Autosave obrigatório (questionários)

- Qualquer formulário longo de coleta comercial deve persistir automaticamente.
- Indicador visível: idle / salvando / salvo / erro.
- Cópia local como rede de segurança.

**Referência:** `use-questionnaire-draft-autosave.ts` (2s debounce).

---

## 4. Recuperação de sessão

- Ao reabrir dialog, restaurar último draft (remoto + local).
- Chave de storage namespaced por tenant implícito (leadId + templateId no path da key).
- Não sobrescrever draft remoto com local vazio.

---

## 5. Foco operacional

- Menos cliques entre lead e ação principal (questionário, converter, ligar).
- Tabelas com ações contextuais na linha (badge de questionário, converter).
- Kanban CRM para estágio; lista para busca administrativa.

**Evitar:** wizards longos para tarefas de 30 segundos.

---

## 6. Minimizar retrabalho

- Propagar `dealId` aos questionários na conversão (implementado).
- Futuro: deduplicação e merge (ADR-005).
- Futuro: contexto unificado sem abrir 4 telas.

---

## 7. Evitar perda de dados

- Optimistic UI com rollback em listas (leads/deals/customers).
- Questionários: patch de cache em vez de invalidar listas no autosave.
- Confirmação apenas em ações destrutivas irreversíveis (ex.: excluir).

**Gap:** excluir lead convertido sem confirmação de impacto — tratar em dívida técnica.

---

## 8. Feedback amigável

- Mensagens em português claro, sem códigos HTTP na UI.
- Erros de campo próximos ao input (questionário após `finalizeAttempted`).
- Toasts para sucesso de CRUD (`ActionToast`).

---

## 9. Fluxo contínuo

- Dialogs modais para criar/editar sem sair da lista.
- Sheet lateral para leitura de detalhe (questionário submetido).
- Permissões escondem ações impossíveis em vez de erro 403 após clique.

---

## Checklist para novas features

- [ ] Funciona offline ou degrada graciosamente?
- [ ] Autosave ou confirmação explícita de saída?
- [ ] Warning vs block documentado?
- [ ] Permissão refletida na UI e no API?
- [ ] Impacto no cache TanStack Query mapeado?

---

## Anti-patterns

- Modal “documento duplicado” sem saída
- Invalidar todo `queryKeys.leads` a cada keystroke
- Validação Zod duplicada sem espelho no Nest
- Depender só de `AuditLog` para histórico do corretor

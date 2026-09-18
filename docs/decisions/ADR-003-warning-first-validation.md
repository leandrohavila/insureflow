# ADR-003: Validação warning-first

**Status:** Aceito — **implementação parcial**

## Contexto

Corretoras precisam cadastrar leads rapidamente em pico de demanda (campanhas, indicações). Bloqueios rígidos por duplicidade geram shadow CRM (planilhas, WhatsApp pessoal).

Clientes (`Customer`) já bloqueiam documento duplicado com `409`.

## Decisão

**Princípio:** distinguir **invariantes duras** (bloqueio) de **alertas comerciais** (warning).

| Tipo | Exemplo | HTTP |
|------|---------|------|
| Invariante | Tenant mismatch, template inativo, lead já convertido | 4xx |
| Invariante | Documento customer duplicado | 409 |
| Warning | Lead com mesmo CPF de outro lead | 200 + `warnings[]` (**planejado**) |
| Warning | Ownership diferente do usuário atual | 200 + warning (**planejado**) |

**Já alinhado ao princípio (questionário):**

- Draft/autosave não bloqueia por required.
- Falha de sync mostra aviso âmbar, mantém edição.

**Ainda bloqueante (questionário finalize):**

- Required e formato na submissão — intencional.

## Consequências

- Produto precisa de componente UI padrão para warnings (banner + ações).
- API deve documentar schema estável de `warnings` quando implementado.
- Equipe de dados deve auditar “continuar mesmo assim” via metadata/evento.

## Tradeoffs

| Prós | Contras |
|------|---------|
| Adoção pelo corretor | Qualidade de dados depende de disciplina |
| Menos abandono do sistema | Duplicatas possíveis até merge (Fase 6) |
| Coerente com UX de corretora | Mais complexidade de testes |

**Risco:** warnings ignorados — mitigar com relatórios de duplicidade para gestores (planejado).

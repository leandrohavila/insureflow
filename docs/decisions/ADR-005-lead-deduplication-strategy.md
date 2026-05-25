# ADR-005: Estratégia de deduplicação de leads

**Status:** Aceito — **parcialmente implementado** (Fase 1: documento + `/leads/duplicates` + banner; sem merge)

## Contexto

Leads hoje não possuem `document` (CPF/CNPJ). Duplicatas são comuns em campanhas e indicações. `Customer` já deduplica por documento com bloqueio.

Corretores precisam ser alertados sem perder velocidade de cadastro.

## Decisão

1. Adicionar `document` / `documentType` normalizado no **Lead** (fase de schema futura).
2. Lookup por tenant em leads e customers com mesmo documento.
3. Resposta de create/update de lead inclui `warnings: DuplicateWarning[]` — **não bloquear** por padrão.
4. UX: banner com link para lead existente, ações “Vincular” / “Continuar mesmo assim”.
5. **Merge** de leads é operação separada, permissão elevada (`leads:merge`), com preview — Fase 6 do roadmap.
6. Customer permanece **bloqueante** em documento duplicado (invariante de cadastro master).

## Consequências

- Índice `(tenantId, document)` ou hash para performance.
- Serviço `LeadsIntelligenceService` (ou similar) isolado de CRUD básico.
- Eventos de auditoria quando usuário ignora warning (planejado).

## Tradeoffs

| Prós | Contras |
|------|---------|
| Alinhado ao trabalho real da corretora | Dados duplicados até merge |
| Reuso mental de Customer.document | Normalização CPF/CNPJ obrigatória |
| Evolução incremental | Gestores precisam de relatório de ignorados |

**Alternativa rejeitada:** bloquear create de lead em qualquer match de email/telefone (falsos positivos altos em famílias e empresas).

## Estado atual (código)

- **Implementado:** `document` / `documentType`, `GET /leads/duplicates`, banner warning-first
- **Pendente:** merge, `warnings[]` no body do POST, unicidade DB
- Ver [roadmap Fase 1](../roadmap/crm-evolution.md)

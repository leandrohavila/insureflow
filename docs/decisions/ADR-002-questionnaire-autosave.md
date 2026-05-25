# ADR-002: Autosave de questionários

**Status:** Aceito  
**Implementação:** Parcial no client; server usa PATCH/POST padrão

## Contexto

Questionários de seguros são longos; corretores interrompem no meio (ligações, WhatsApp). Perda de dados gera retrabalho e desconfiança no sistema.

## Decisão

- Autosave **no frontend** com debounce de **2 segundos**.
- Persistência dupla: **API** (`status: draft`) + **localStorage** por `leadId` + `templateId`.
- Hidratação: buscar último draft remoto (`limit: 1`); mesclar com local; respostas remotas prevalecem.
- Mutations com meta `autosave: true` para **não invalidar** listas globais (patch cirúrgico de cache).
- Validação em draft: omitir campos vazios/inválidos; **não** exigir required.
- Finalização é ação explícita com validação completa (`submitted`).

## Consequências

- UX resiliente a rede instável.
- Múltiplos drafts teóricos por lead+template (último vence na UI).
- Carga extra de writes no PostgreSQL durante preenchimento ativo.
- Sem contrato de “autosave endpoint” — mesmo controller de submissões.

## Tradeoffs

| Prós | Contras |
|------|---------|
| Rápido de entregar sem mudar API | Duplicidade local vs remoto em edge cases |
| Corretor nunca “perde tudo” | 2s debounce pode perder última tecla se fechar imediato |
| Cache estável na lista de leads | Server não conhece semântica de autosave |

**Alternativa rejeitada:** autosave apenas local até finalizar (risco ao trocar dispositivo).

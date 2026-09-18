# Release Comercial 4.4

**Wave 2** — Fila de Reativação  
**Wave 3** — Campanhas de Reativação  

| Campo | Valor |
|-------|-------|
| **Status** | Produção |
| **Data** | 18/09/2026 |
| **Resultado** | **GO** |

---

## Veredito

# GO

Waves 2 e 3 estão publicadas e operacionais em produção.

| Item | Produção |
|------|----------|
| Wave 2 — Fila `/crm/reativacoes` | GO |
| Wave 3 — Campanhas `/crm/campaigns/reactivation` | GO |
| API | https://api.corretoraavila.com.br |
| WEB | https://corretoraavila.com.br |
| Migration `20260917120000_reactivation_campaigns` | Aplicada |
| Smoke E2E autenticado (API) | PASS |
| Limpeza dos registros `Smoke 4.4` | Concluída |

Wave 1 (Perdas) permanece GO em produção (SHA `446a472`).

---

## Publicação

| Camada | Referência |
|--------|------------|
| Branch | `feature/sprint-comercial-4.4` |
| HEAD docs | `1db65c0` |
| API Railway | `ad2f65ba-1c1c-4d37-b6af-6c713df93bc3` (SHA `0ec9ad4`) |
| WEB Vercel | `dpl_3haspeDgkwWFwQtGKvTEBKYocCNN` (SHA `0578976`) |

Hotfix `0ec9ad4`: eventos `campaign_*` sem `leadId` — necessário para criar campanha. Sem mudança de regra/UX.

---

## Evidências

- Validação publicada: `docs/reports/release-commercial-4.4-production-validation.md`
- Limpeza smoke: `docs/reports/comercial-4.4-smoke-cleanup.md`

Fluxo validado: Lead → Perdido (motivo obrigatório) → Fila → Adiar → Reativar → Perdido → Campanha → Iniciar → Reativar → pipeline + `lead_reactivated_campaign`.

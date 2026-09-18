# Comercial 4.4 — Limpeza dos registros de smoke em produção

**Data:** 2026-09-18  
**Ambiente:** produção (`https://api.corretoraavila.com.br`, tenant `insureflow`)  
**Marcador exclusivo:** `Smoke 4.4`  
**Fonte auxiliar:** `smoke-comercial-4.4` (só aceita se o nome também contiver o marcador)

Nenhum registro sem `Smoke 4.4` no nome (leads, campanhas, motivos) ou no assunto (activities) foi removido. Dados reais de clientes não foram alterados.

---

## Resultado

| Entidade | Removidos | Residual `Smoke 4.4` |
|----------|-----------|----------------------|
| Leads | 3 | 0 |
| Motivos de perda | 3 | 0 |
| Activities | 21 | 0 |
| Campanhas | 3 | 0 |
| Auditorias (`audit_logs`) | 0 (nenhuma relacionada encontrada) | — |

Verificação pós-limpeza (API): busca `Smoke 4.4` em leads, campanhas, motivos e activities = vazio. GET das 3 campanhas = **404**.

`campaign_leads` e `lead_follow_ups` dos leads de smoke foram removidos por cascade ao excluir os leads (campanhas ficaram com 0 leads antes do DELETE). IDs dessas linhas filhas não foram capturados no inventário.

---

## Leads

| ID | Nome | Status no inventário |
|----|------|----------------------|
| `cmu77oi3h0007sz2qc8whdun3` | Smoke 4.4 1789751244795 | contacted |
| `cmu75uost000tss2q2goypn4y` | Smoke 4.4 1789748174206 | contacted |
| `cmu75t90n0007ss2q2y40nzvf` | Smoke 4.4 1789748106956 | lost |

---

## Motivos de perda

| ID | Nome |
|----|------|
| `cmu75t8680005ss2q5us4r5ow` | Smoke 4.4 1789748106956 |
| `cmu75uo27000rss2quf5phy5y` | Smoke 4.4 1789748174206 |
| `cmu77ohcc0005sz2qaqjney65` | Smoke 4.4 1789751244795 |

---

## Campanhas

| ID | Nome | Status no inventário |
|----|------|----------------------|
| `cmu77ot56000lsz2q4xpq2oow` | Smoke 4.4 campanha 1789751244795 | IN_PROGRESS |
| `cmu75uyod0017ss2qob6azfou` | Smoke 4.4 campanha 1789748174206 | DRAFT |
| `cmu75tkha000lss2qbs7yrtwx` | Smoke 4.4 campanha 1789748106956 | DRAFT |

---

## Activities

18 vinculadas aos leads + 3 de campanha (sem `leadId`; assunto com `Smoke 4.4`).

| ID | Lead | Kind / assunto |
|----|------|----------------|
| `cmu77oypg000usz2qkpfmlsem` | `cmu77oi3h0007sz2qc8whdun3` | lead_reactivated_campaign |
| `cmu77osqz000jsz2qignryr23` | `cmu77oi3h0007sz2qc8whdun3` | lead_lost |
| `cmu77oqph000hsz2qi7ghzdzf` | `cmu77oi3h0007sz2qc8whdun3` | lead_reactivated |
| `cmu77oqb0000fsz2qqbuaf7l8` | `cmu77oi3h0007sz2qc8whdun3` | lead_follow_up_scheduled |
| `cmu77onm6000bsz2q6cp9ir3u` | `cmu77oi3h0007sz2qc8whdun3` | lead_reactivation_postponed |
| `cmu77olb40009sz2qgl0wbl86` | `cmu77oi3h0007sz2qc8whdun3` | lead_lost |
| `cmu75v6v2001dss2qz2s6onf2` | `cmu75uost000tss2q2goypn4y` | lead_reactivated |
| `cmu75v6ew001bss2qpd2xfv0t` | `cmu75uost000tss2q2goypn4y` | lead_follow_up_scheduled |
| `cmu75uy8n0015ss2qo5lmrn9k` | `cmu75uost000tss2q2goypn4y` | lead_lost |
| `cmu75uw1l0013ss2qdq0zji6d` | `cmu75uost000tss2q2goypn4y` | lead_reactivated |
| `cmu75uvm60011ss2qht4iymt7` | `cmu75uost000tss2q2goypn4y` | lead_follow_up_scheduled |
| `cmu75ut06000xss2qx6zlxgyn` | `cmu75uost000tss2q2goypn4y` | lead_reactivation_postponed |
| `cmu75urco000vss2qwn5zxiic` | `cmu75uost000tss2q2goypn4y` | lead_lost |
| `cmu75tk41000jss2qp9fpjpxb` | `cmu75t90n0007ss2q2y40nzvf` | lead_lost |
| `cmu75ti3c000hss2qy8bp17de` | `cmu75t90n0007ss2q2y40nzvf` | lead_reactivated |
| `cmu75thoo000fss2qc64gz15d` | `cmu75t90n0007ss2q2y40nzvf` | lead_follow_up_scheduled |
| `cmu75tf1m000bss2qn4q7qzyk` | `cmu75t90n0007ss2q2y40nzvf` | lead_reactivation_postponed |
| `cmu75tcop0009ss2qm3udw81u` | `cmu75t90n0007ss2q2y40nzvf` | lead_lost |
| `cmu77ovx9000ssz2qa1r5k5lv` | — | campanha (assunto com Smoke 4.4) |
| `cmu77ouvu000qsz2qrrthdg01` | — | campanha (assunto com Smoke 4.4) |
| `cmu77otnj000nsz2qulpsy8yn` | — | campanha (assunto com Smoke 4.4) |

---

## Auditorias

- `GET /api/v1/audit-logs` (até 2000 registros recentes): **0** hits em `Smoke 4.4` ou nos IDs acima.
- SQL em `audit_logs` com `createdAt >= 2026-09-17`: **0** hits nos IDs restantes de campanha/lead/motivo.
- Módulos de lead, campanha e activity **não** gravam `AuditLog` (apenas auth / users / business-units). O rastro operacional do smoke estava nas activities, já removidas.

---

## Método e segurança

1. Inventário pela API: nome contém `Smoke 4.4`. Abort se source `smoke-comercial-4.4` sem o marcador no nome.
2. DELETE API: activities → leads → motivos de perda.
3. Campanhas não têm DELETE na API. Remoção por SQL parametrizado (`name LIKE '%Smoke 4.4%'`), após SELECT de segurança, via `railway run` no serviço `insureflow-api` / environment `production`.
4. Conferência API: busca vazia; campanhas 404.

Scripts locais temporários (não commitados): `%TEMP%\smoke44-*.cjs`.

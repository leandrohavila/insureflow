# Cores — Grupo Ávila

Extraídas da logo oficial (`mockups/ux001/assets/grupo-avila-logo.png`).

---

## Marca

| Token | Hex | OKLCH (aprox.) | Uso |
|-------|-----|----------------|-----|
| `--avila-navy-950` | `#000C24` | `oklch(0.17 0.05 260)` | Sidebar (ambos temas), login brand panel |
| `--avila-navy-900` | `#0C183C` | `oklch(0.23 0.06 264)` | Header dark, botões primários light |
| `--avila-navy-800` | `#0C2448` | `oklch(0.28 0.07 252)` | Hover nav, chips |
| `--avila-navy-700` | `#1A3A66` | `oklch(0.35 0.08 258)` | Bordas dark, gráficos secundários |
| `--avila-gold-800` | `#7F5209` | `oklch(0.48 0.12 70)` | Preço portal, texto ouro sobre marfim |
| `--avila-gold-600` | `#C09048` | `oklch(0.70 0.11 78)` | CTA portal, filete ativo sidebar |
| `--avila-gold-400` | `#DEAE5D` | `oklch(0.79 0.12 80)` | Primária dark mode, hover ouro |
| `--avila-ivory` | `#F6F1E8` | `oklch(0.96 0.015 90)` | Background light CRM, placa logo |
| `--avila-paper` | `#FFFCFA` | `oklch(0.99 0.005 90)` | Cards light |
| `--avila-ink` | `#0C183C` | — | Texto principal light |

---

## Background

| Modo | CRM canvas | Portal | Sidebar |
|------|------------|--------|---------|
| **Dark** | `--avila-navy-950` | N/A (portal light-only v1) | `--avila-navy-950` |
| **Light** | `--avila-ivory` | `--avila-ivory` | `--avila-navy-950` (fixo) |

---

## Semântica operacional

| Papel | Light | Dark | Notas |
|-------|-------|------|-------|
| **Success** | `#2F6B4F` | `#5FA882` | KPI positivo, status “Ativo” |
| **Warning** | `#C09048` | `#DEAE5D` | Ouro assume alertas médios |
| **Danger** | `#9B2C2C` | `#E07070` | Sinistros críticos, erro |
| **Info** | `#0C2448` | `#8BA3C7` | Navy, não azul InsureFlow |

---

## Primary (por produto)

| Produto | Light | Dark |
|---------|-------|------|
| CRM Corretora | `--avila-navy-900` | `--avila-gold-400` |
| CRM Imobiliário | `--avila-navy-900` | `--avila-gold-400` |
| Portal | `--avila-gold-600` | — |

---

## Regras

- Máximo **um** elemento ouro contínuo de destaque por viewport (CTA **ou** item nav ativo **ou** preço hero).  
- Não usar gradiente metálico da chave em botões.  
- Texto sobre ouro: navy-950. Texto sobre navy: marfim ou gold-400.  
- Azul `hue 252` (InsureFlow SaaS) **não** entra no tenant Ávila.

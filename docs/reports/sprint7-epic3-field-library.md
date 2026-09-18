# Sprint 7.3 — EPIC 3: Insurance Field Library + Block Library

**Data:** 2026-07-10  
**Status:** Concluído

---

## 1. Resumo

Criado o pacote `@repo/forms-library` com catálogo persistente de **campos** e **blocos** especializados para seguros (Auto, Vida, Residencial, Empresarial). O builder permite montar formulários por blocos — **Inserir bloco** insere todas as perguntas, validação (`ValidationSchemaV1`) e regras padrão (`FormRuleDefinition`) automaticamente.

---

## 2. Arquitetura

```
@repo/forms-library
├── metadata/          # tipos, categorias, produtos
├── fields/            # catálogo persistente de campos
├── blocks/            # blocos por ramo (auto, vida, residencial, empresarial)
└── utils/
    ├── instantiate.ts # materializa bloco → campos + regras
    ├── search.ts      # busca e filtros
    └── favorites.ts   # helpers de favoritos

Builder (web)
├── block-library-drawer.tsx   # Inserir bloco
├── field-library-drawer.tsx   # Inserir campo (catálogo + filtros)
└── forms-library-storage.ts   # favoritos (localStorage)
```

**Integração com motores existentes:**

| Motor | Uso na biblioteca |
|-------|-------------------|
| Validation Engine | `field.validation` com `ValidationSchemaV1` |
| Rule Engine | `block.defaultRules` + remapeamento de keys na instanciação |

---

## 3. Field Library

Cada campo exporta:

| Propriedade | Descrição |
|-------------|-----------|
| `id`, `name`, `key` | Identificadores estáveis |
| `label`, `description` | UI e documentação |
| `inputKind`, `fieldType` | Mapeamento para Prisma/API |
| `validation` | Schema v1 do Validation Engine |
| `defaultMask`, `defaultPlaceholder` | Máscaras e placeholders |
| `category`, `product`, `tags`, `icon` | Metadados de busca |
| `documentation` | Texto de ajuda para corretores |

**Total:** 40+ campos catalogados (`shared` + ramos).

---

## 4. Categorias

Dados Pessoais · Documentos · Contato · Endereço · Veículos · Condutores · Imóvel · Empresa · Financeiro · Beneficiários · Coberturas · Anexos

---

## 5. Block Library

### Auto (7 blocos)
Dados Pessoais · Veículo · Condutor Principal · Segundo Condutor · Garagem · Histórico de Sinistro · Coberturas

### Vida (6 blocos)
Segurado · Beneficiário · Renda · Saúde · Hábitos · Profissão

### Residencial (4 blocos)
Imóvel · Construção · Conteúdo · Segurança

### Empresarial (4 blocos)
Empresa · Funcionários · Faturamento · Equipamentos

**Total:** 21 blocos.

Cada bloco exporta: **Fields** (via `fieldIds`), **ValidationSchema** (por campo), **DefaultRules**, **Metadata**, **Preview** (`summary`, `fieldCount`, `highlights`).

---

## 6. Regras embutidas (exemplos)

| Bloco | Regra padrão |
|-------|--------------|
| Segundo Condutor | Mostrar/obrigar campos quando `has_second_driver = true` |
| Garagem | Mostrar `garage_type` quando `has_garage = true` |
| Histórico de Sinistro | Mostrar `claims_count` quando `had_claims = true` |
| Saúde (Vida) | Mostrar `health_details` quando `has_health_conditions = true` |

Ao inserir bloco com regras → `engineVersion: 2` ativado automaticamente e regras mergeadas em `template.settings.rules`.

---

## 7. Builder

| Feature | Implementação |
|---------|---------------|
| **Inserir bloco** | Header → `BlockLibraryDrawer` → produto → bloco → insert |
| **Inserir campo** | Drawer com catálogo `@repo/forms-library` |
| **Busca** | Texto + filtros categoria/produto/tag/tipo |
| **Favoritos** | ⭐ campo/bloco via `localStorage` |
| **Preview** | Atualiza ao concluir insert (campos criados via API) |

---

## 8. Compatibilidade

- APIs existentes inalteradas (create field/template)
- `engineVersion: 1` preservado até inserir bloco com regras
- Templates legados continuam funcionando
- Quick-add mantém `field-library.ts` para atalhos

---

## 9. Performance

- Catálogo in-memory (zero I/O)
- Busca O(n) sobre ~40 campos / 21 blocos
- Instanciação de bloco O(fields) — típico 1–6 campos por bloco
- Favoritos em localStorage (< 1ms)

---

## 10. Validação

| Check | Resultado |
|-------|-----------|
| `@repo/forms-library` tests | ✅ 6/6 |
| `@repo/forms-engine` tests | ✅ 32/32 |
| typecheck | ✅ |
| build (web + api) | ✅ |

---

## 11. Critérios de sucesso

| Critério | Status |
|----------|--------|
| Corretor monta formulário por blocos | ✅ |
| Campos com Validation Engine | ✅ |
| Blocos com regras Rule Engine | ✅ |
| Busca e favoritos | ✅ |
| Preview em tempo real após insert | ✅ |
| Infra genérica configurável | ✅ |

---

## 12. Pendências (futuro)

- [ ] Persistência tenant-scoped (`QuestionnaireFieldDefinition` / `QuestionnaireBlockDefinition` no Prisma)
- [ ] Blocos customizados pelo corretor
- [ ] Sync favoritos multi-dispositivo
- [ ] Import/export de blocos entre tenants

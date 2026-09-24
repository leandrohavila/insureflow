# Portal imobiliário público

App Next.js 15 em `apps/portal-imobiliario-publico` para validar o módulo Real Estate Inventory.

```bash
npm install
npm run dev -w portal-imobiliario-publico
```

Abre em [http://localhost:3002](http://localhost:3002).

## Fluxo de validação

1. No CRM, cadastre um imóvel na BU Ávila Imóveis (`avila-imoveis`). Ele **não** deve aparecer no portal.
2. Publique (`POST /api/v1/properties/:id/publish`).
3. Home, listagem, busca e detalhe devem exibir só publicados.
4. Envie o formulário de interesse.
5. No CRM/API, `GET /api/v1/properties/:id/leads` deve listar o `PropertyLead`.

Se a API estiver fora, o portal mostra “Não foi possível carregar os imóveis neste momento.” e não exibe catálogo fictício.

Variáveis: copie `.env.example` para `.env.local`.

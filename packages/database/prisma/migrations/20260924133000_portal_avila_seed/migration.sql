-- Seed de validação da Ávila Imóveis. Não sobrescreve configuração já salva no CRM.
-- WhatsApp e CRECI copiam chaves já gravadas na unidade ou no tenant. Se não existirem, ficam vazios.

INSERT INTO "portal_configs" (
  "id",
  "tenantId",
  "business_unit_id",
  "company_name",
  "hero_title",
  "hero_subtitle",
  "hero_image",
  "about_title",
  "about_text",
  "differentials",
  "whatsapp",
  "phone",
  "email",
  "creci",
  "address",
  "created_at",
  "updated_at"
)
SELECT
  md5('portal-config-' || bu.id),
  bu."tenantId",
  bu.id,
  'Ávila Imóveis',
  'Encontre o imóvel ideal para sua família',
  'Casas, apartamentos, terrenos e lançamentos em Uberaba/MG.',
  'https://insureflow-portal-imobiliario-publi.vercel.app/avila-hero.svg',
  'Sobre a Ávila Imóveis',
  'Texto institucional temporário para validação do portal comercial. Substitua este conteúdo pelo texto oficial no CRM.',
  '["Atendimento em Uberaba e região","Conteúdo gerenciado pelo CRM"]'::jsonb,
  NULLIF(COALESCE(t.settings->>'whatsapp', t.settings->>'phone', ''), ''),
  NULLIF(COALESCE(t.settings->>'phone', ''), ''),
  NULLIF(COALESCE(t.settings->>'email', ''), ''),
  NULLIF(COALESCE(t.settings->>'creci', ''), ''),
  NULLIF(COALESCE(t.settings->>'address', ''), ''),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "business_units" bu
JOIN "tenants" t ON t.id = bu."tenantId"
WHERE bu.slug = 'avila-imoveis'
  AND NOT EXISTS (
    SELECT 1 FROM "portal_configs" pc WHERE pc."business_unit_id" = bu.id
  );

INSERT INTO "portal_banners" (
  "id",
  "tenantId",
  "business_unit_id",
  "title",
  "subtitle",
  "image",
  "link",
  "active",
  "order",
  "created_at",
  "updated_at"
)
SELECT
  md5('portal-banner-' || bu.id),
  bu."tenantId",
  bu.id,
  'Ávila Imóveis',
  'Uberaba/MG',
  'https://insureflow-portal-imobiliario-publi.vercel.app/avila-hero.svg',
  '/imoveis',
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "business_units" bu
WHERE bu.slug = 'avila-imoveis'
  AND NOT EXISTS (
    SELECT 1 FROM "portal_banners" pb WHERE pb."business_unit_id" = bu.id
  );

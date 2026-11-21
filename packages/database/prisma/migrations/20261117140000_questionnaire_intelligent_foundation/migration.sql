-- Questionário Inteligente: versão imutável, ramo, status de preenchimento
-- e compartilhamento por hash. Aditivo: não remove colunas, tabelas nem dados.
-- Valores novos de enum no PostgreSQL não podem ser removidos com DROP VALUE;
-- as tabelas e colunas novas podem ser descartadas se a migração for revertida.

CREATE TYPE "QuestionnaireBranch" AS ENUM ('auto', 'residencial', 'empresarial');

CREATE TYPE "QuestionnaireShareStatus" AS ENUM ('active', 'revoked', 'expired');

ALTER TYPE "QuestionnaireSubmissionStatus" ADD VALUE 'pending_client';
ALTER TYPE "QuestionnaireSubmissionStatus" ADD VALUE 'in_progress';
ALTER TYPE "QuestionnaireSubmissionStatus" ADD VALUE 'completed';
ALTER TYPE "QuestionnaireSubmissionStatus" ADD VALUE 'expired';
ALTER TYPE "QuestionnaireSubmissionStatus" ADD VALUE 'cancelled';

ALTER TABLE "questionnaire_templates"
ADD COLUMN "branch" "QuestionnaireBranch",
ADD COLUMN "business_unit_id" TEXT;

ALTER TABLE "questionnaire_templates"
ADD CONSTRAINT "questionnaire_templates_business_unit_id_fkey"
FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "questionnaire_templates_tenantId_branch_idx"
ON "questionnaire_templates"("tenantId", "branch");

CREATE INDEX "questionnaire_templates_tenantId_business_unit_id_idx"
ON "questionnaire_templates"("tenantId", "business_unit_id");

UPDATE "questionnaire_templates"
SET "branch" = CASE
  WHEN "settings"->>'branch' IN ('auto', 'residencial', 'empresarial')
    THEN ("settings"->>'branch')::"QuestionnaireBranch"
  WHEN "settings"->>'wizardBranch' IN ('auto', 'residencial', 'empresarial')
    THEN ("settings"->>'wizardBranch')::"QuestionnaireBranch"
  ELSE NULL
END
WHERE "branch" IS NULL
  AND (
    "settings"->>'branch' IN ('auto', 'residencial', 'empresarial')
    OR "settings"->>'wizardBranch' IN ('auto', 'residencial', 'empresarial')
  );

CREATE TABLE "questionnaire_template_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questionnaire_template_versions_templateId_versionNumber_key"
ON "questionnaire_template_versions"("templateId", "versionNumber");

CREATE INDEX "questionnaire_template_versions_tenantId_idx"
ON "questionnaire_template_versions"("tenantId");

CREATE INDEX "questionnaire_template_versions_tenantId_templateId_idx"
ON "questionnaire_template_versions"("tenantId", "templateId");

CREATE INDEX "questionnaire_template_versions_published_by_id_idx"
ON "questionnaire_template_versions"("published_by_id");

ALTER TABLE "questionnaire_template_versions"
ADD CONSTRAINT "questionnaire_template_versions_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "questionnaire_template_versions"
ADD CONSTRAINT "questionnaire_template_versions_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "questionnaire_templates"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "questionnaire_template_versions"
ADD CONSTRAINT "questionnaire_template_versions_published_by_id_fkey"
FOREIGN KEY ("published_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "questionnaire_submissions"
ADD COLUMN "template_version_id" TEXT,
ADD COLUMN "branch" "QuestionnaireBranch",
ADD COLUMN "business_unit_id" TEXT,
ADD COLUMN "responsible_user_id" TEXT,
ADD COLUMN "started_at" TIMESTAMP(3),
ADD COLUMN "completed_at" TIMESTAMP(3);

ALTER TABLE "questionnaire_submissions"
ADD CONSTRAINT "questionnaire_submissions_template_version_id_fkey"
FOREIGN KEY ("template_version_id") REFERENCES "questionnaire_template_versions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "questionnaire_submissions"
ADD CONSTRAINT "questionnaire_submissions_business_unit_id_fkey"
FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "questionnaire_submissions"
ADD CONSTRAINT "questionnaire_submissions_responsible_user_id_fkey"
FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "questionnaire_submissions_tenantId_template_version_id_idx"
ON "questionnaire_submissions"("tenantId", "template_version_id");

CREATE INDEX "questionnaire_submissions_tenantId_branch_idx"
ON "questionnaire_submissions"("tenantId", "branch");

CREATE INDEX "questionnaire_submissions_tenantId_business_unit_id_idx"
ON "questionnaire_submissions"("tenantId", "business_unit_id");

CREATE INDEX "questionnaire_submissions_tenantId_responsible_user_id_idx"
ON "questionnaire_submissions"("tenantId", "responsible_user_id");

CREATE TABLE "questionnaire_shares" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "status" "QuestionnaireShareStatus" NOT NULL DEFAULT 'active',
    "created_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questionnaire_shares_token_hash_key"
ON "questionnaire_shares"("token_hash");

CREATE INDEX "questionnaire_shares_tenantId_idx"
ON "questionnaire_shares"("tenantId");

CREATE INDEX "questionnaire_shares_tenantId_submissionId_idx"
ON "questionnaire_shares"("tenantId", "submissionId");

CREATE INDEX "questionnaire_shares_tenantId_status_idx"
ON "questionnaire_shares"("tenantId", "status");

CREATE INDEX "questionnaire_shares_created_by_id_idx"
ON "questionnaire_shares"("created_by_id");

ALTER TABLE "questionnaire_shares"
ADD CONSTRAINT "questionnaire_shares_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "questionnaire_shares"
ADD CONSTRAINT "questionnaire_shares_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "questionnaire_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "questionnaire_shares"
ADD CONSTRAINT "questionnaire_shares_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Congela a versão atual de cada modelo e aponta as respostas existentes
-- para ela. Não altera answers, status, lead nem demais colunas de conteúdo.
INSERT INTO "questionnaire_template_versions" (
    "id",
    "tenantId",
    "templateId",
    "versionNumber",
    "definition",
    "publishedAt",
    "createdAt"
)
SELECT
    gen_random_uuid()::text,
    template."tenantId",
    template."id",
    template."version",
    jsonb_build_object(
        'schemaVersion', 1,
        'branch', template."branch",
        'sections',
        CASE template."branch"::text
            WHEN 'auto' THEN '[
                {"key":"vehicle_identification","title":"Identificação do veículo","order":0,"required":false},
                {"key":"driver","title":"Dados do condutor","order":1,"required":false},
                {"key":"usage","title":"Utilização","order":2,"required":false},
                {"key":"garage","title":"Garagem e pernoite","order":3,"required":false},
                {"key":"insurance_history","title":"Histórico de seguro e sinistros","order":4,"required":false},
                {"key":"coverages","title":"Coberturas desejadas","order":5,"required":false}
            ]'::jsonb
            WHEN 'residencial' THEN '[
                {"key":"property_identification","title":"Identificação do imóvel","order":0,"required":false},
                {"key":"risk_location","title":"Localização do risco","order":1,"required":false},
                {"key":"occupancy","title":"Tipo de ocupação","order":2,"required":false},
                {"key":"property_characteristics","title":"Características do imóvel","order":3,"required":false},
                {"key":"estimated_values","title":"Valores estimados","order":4,"required":false},
                {"key":"existing_protections","title":"Proteções existentes","order":5,"required":false},
                {"key":"coverages","title":"Coberturas desejadas","order":6,"required":false}
            ]'::jsonb
            WHEN 'empresarial' THEN '[
                {"key":"company_identification","title":"Identificação da empresa","order":0,"required":false},
                {"key":"economic_activity","title":"CNPJ e atividade econômica","order":1,"required":false},
                {"key":"risk_location","title":"Localização do risco","order":2,"required":false},
                {"key":"operation","title":"Características da operação","order":3,"required":false},
                {"key":"assets","title":"Bens e equipamentos","order":4,"required":false},
                {"key":"values_at_risk","title":"Valores em risco","order":5,"required":false},
                {"key":"existing_protections","title":"Proteções existentes","order":6,"required":false},
                {"key":"claims_history","title":"Histórico de sinistros","order":7,"required":false},
                {"key":"coverages","title":"Coberturas desejadas","order":8,"required":false}
            ]'::jsonb
            ELSE '[]'::jsonb
        END,
        'fields',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'key', field."key",
                        'label', field."label",
                        'type', field."type"::text,
                        'required', field."required",
                        'order', field."order",
                        'sectionKey', field."settings"->>'section',
                        'placeholder', field."placeholder",
                        'helpText', field."helpText",
                        'options', field."options",
                        'validation', field."validation"
                    )
                    ORDER BY field."order", field."key"
                )
                FROM "questionnaire_fields" AS field
                WHERE field."templateId" = template."id"
            ),
            '[]'::jsonb
        ),
        'legacySnapshot', true
    ),
    template."updatedAt",
    CURRENT_TIMESTAMP
FROM "questionnaire_templates" AS template
WHERE NOT EXISTS (
    SELECT 1
    FROM "questionnaire_template_versions" AS existing_version
    WHERE existing_version."templateId" = template."id"
      AND existing_version."versionNumber" = template."version"
);

UPDATE "questionnaire_submissions" AS submission
SET
    "template_version_id" = version."id",
    "branch" = COALESCE(submission."branch", template."branch")
FROM "questionnaire_template_versions" AS version
JOIN "questionnaire_templates" AS template
    ON template."id" = version."templateId"
   AND template."version" = version."versionNumber"
WHERE submission."templateId" = template."id"
  AND submission."template_version_id" IS NULL;

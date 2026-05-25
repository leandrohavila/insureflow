-- Questionnaires foundation (multi-tenant templates, fields and submissions)

CREATE TYPE "QuestionnaireTemplateStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "QuestionnaireFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'EMAIL', 'PHONE', 'CURRENCY', 'FILE');
CREATE TYPE "QuestionnaireOrigin" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'SITE', 'INTERNAL', 'PHONE', 'INDICATION');
CREATE TYPE "QuestionnaireSubmissionMode" AS ENUM ('INTERNAL', 'EXTERNAL');
CREATE TYPE "QuestionnaireSubmissionStatus" AS ENUM ('draft', 'submitted', 'reviewed', 'archived');

CREATE TABLE "questionnaire_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "QuestionnaireTemplateStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questionnaire_fields" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "QuestionnaireFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questionnaire_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mode" "QuestionnaireSubmissionMode" NOT NULL DEFAULT 'INTERNAL',
    "origin" "QuestionnaireOrigin" NOT NULL DEFAULT 'INTERNAL',
    "status" "QuestionnaireSubmissionStatus" NOT NULL DEFAULT 'draft',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB,
    "leadId" TEXT,
    "customerId" TEXT,
    "dealId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questionnaire_templates_tenantId_name_version_key" ON "questionnaire_templates"("tenantId", "name", "version");
CREATE INDEX "questionnaire_templates_tenantId_idx" ON "questionnaire_templates"("tenantId");
CREATE INDEX "questionnaire_templates_tenantId_status_idx" ON "questionnaire_templates"("tenantId", "status");
CREATE INDEX "questionnaire_templates_tenantId_createdAt_idx" ON "questionnaire_templates"("tenantId", "createdAt");

CREATE UNIQUE INDEX "questionnaire_fields_templateId_key_key" ON "questionnaire_fields"("templateId", "key");
CREATE INDEX "questionnaire_fields_tenantId_idx" ON "questionnaire_fields"("tenantId");
CREATE INDEX "questionnaire_fields_templateId_idx" ON "questionnaire_fields"("templateId");
CREATE INDEX "questionnaire_fields_tenantId_templateId_idx" ON "questionnaire_fields"("tenantId", "templateId");

CREATE INDEX "questionnaire_submissions_tenantId_idx" ON "questionnaire_submissions"("tenantId");
CREATE INDEX "questionnaire_submissions_tenantId_templateId_idx" ON "questionnaire_submissions"("tenantId", "templateId");
CREATE INDEX "questionnaire_submissions_tenantId_status_idx" ON "questionnaire_submissions"("tenantId", "status");
CREATE INDEX "questionnaire_submissions_tenantId_origin_idx" ON "questionnaire_submissions"("tenantId", "origin");
CREATE INDEX "questionnaire_submissions_tenantId_leadId_idx" ON "questionnaire_submissions"("tenantId", "leadId");
CREATE INDEX "questionnaire_submissions_tenantId_customerId_idx" ON "questionnaire_submissions"("tenantId", "customerId");
CREATE INDEX "questionnaire_submissions_tenantId_dealId_idx" ON "questionnaire_submissions"("tenantId", "dealId");
CREATE INDEX "questionnaire_submissions_tenantId_createdAt_idx" ON "questionnaire_submissions"("tenantId", "createdAt");

ALTER TABLE "questionnaire_templates" ADD CONSTRAINT "questionnaire_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_fields" ADD CONSTRAINT "questionnaire_fields_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_fields" ADD CONSTRAINT "questionnaire_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "questionnaire_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

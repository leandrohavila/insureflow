-- Continuidade operacional Lead → Deal → QuestionnaireSubmission.
--
-- Submissões criadas antes da sincronização em convertLead ficaram com
-- leadId preenchido e dealId NULL mesmo após conversão. O CRM filtra
-- respostas por dealId ao abrir "Visualizar respostas" do negócio.
--
-- Backfill idempotente: copia dealId do lead convertido para todas as
-- submissões vinculadas ao lead que ainda não possuem dealId.

UPDATE "questionnaire_submissions" AS qs
SET "dealId" = l."dealId"
FROM "leads" AS l
WHERE qs."leadId" = l.id
  AND l."dealId" IS NOT NULL
  AND qs."dealId" IS NULL;

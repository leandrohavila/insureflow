-- Sprint 5.2 — domínio de cotações (QuoteComparison + Quote + Proposal)

CREATE TYPE "QuoteWorkflowStatus" AS ENUM (
  'received',
  'in_analysis',
  'quote_created',
  'quote_sent',
  'negotiation',
  'closed_won',
  'closed_lost'
);

CREATE TYPE "QuoteLineStatus" AS ENUM (
  'draft',
  'quoted',
  'sent',
  'selected',
  'rejected',
  'expired'
);

CREATE TYPE "ProposalStatus" AS ENUM (
  'draft',
  'sent',
  'accepted',
  'rejected'
);

CREATE TABLE "quote_comparisons" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT,
  "workflowStatus" "QuoteWorkflowStatus" NOT NULL DEFAULT 'received',
  "leadId" TEXT,
  "dealId" TEXT,
  "customerId" TEXT,
  "submissionId" TEXT,
  "assignedToId" TEXT,
  "notes" TEXT,
  "selectedQuoteId" TEXT,
  "sentAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quote_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotes" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "comparisonId" TEXT NOT NULL,
  "insurer" TEXT NOT NULL,
  "product" TEXT,
  "plan" TEXT,
  "premiumValue" DECIMAL(14,2) NOT NULL,
  "franchiseValue" DECIMAL(14,2),
  "coverages" JSONB NOT NULL DEFAULT '[]',
  "assistance" TEXT,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "status" "QuoteLineStatus" NOT NULL DEFAULT 'draft',
  "observations" TEXT,
  "attachments" JSONB NOT NULL DEFAULT '[]',
  "externalSource" TEXT NOT NULL DEFAULT 'manual',
  "externalRef" TEXT,
  "isSelected" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposals" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "comparisonId" TEXT NOT NULL,
  "quoteId" TEXT,
  "status" "ProposalStatus" NOT NULL DEFAULT 'draft',
  "title" TEXT,
  "value" DECIMAL(14,2),
  "sentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quote_comparisons_selectedQuoteId_key" ON "quote_comparisons"("selectedQuoteId");
CREATE INDEX "quote_comparisons_tenantId_idx" ON "quote_comparisons"("tenantId");
CREATE INDEX "quote_comparisons_tenantId_workflowStatus_idx" ON "quote_comparisons"("tenantId", "workflowStatus");
CREATE INDEX "quote_comparisons_tenantId_leadId_idx" ON "quote_comparisons"("tenantId", "leadId");
CREATE INDEX "quote_comparisons_tenantId_dealId_idx" ON "quote_comparisons"("tenantId", "dealId");
CREATE INDEX "quote_comparisons_tenantId_customerId_idx" ON "quote_comparisons"("tenantId", "customerId");
CREATE INDEX "quote_comparisons_tenantId_submissionId_idx" ON "quote_comparisons"("tenantId", "submissionId");
CREATE INDEX "quote_comparisons_tenantId_assignedToId_idx" ON "quote_comparisons"("tenantId", "assignedToId");
CREATE INDEX "quote_comparisons_tenantId_createdAt_idx" ON "quote_comparisons"("tenantId", "createdAt");

CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX "quotes_tenantId_comparisonId_idx" ON "quotes"("tenantId", "comparisonId");
CREATE INDEX "quotes_tenantId_insurer_idx" ON "quotes"("tenantId", "insurer");
CREATE INDEX "quotes_tenantId_status_idx" ON "quotes"("tenantId", "status");

CREATE INDEX "proposals_tenantId_idx" ON "proposals"("tenantId");
CREATE INDEX "proposals_tenantId_comparisonId_idx" ON "proposals"("tenantId", "comparisonId");
CREATE INDEX "proposals_tenantId_status_idx" ON "proposals"("tenantId", "status");

ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "questionnaire_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "quote_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proposals" ADD CONSTRAINT "proposals_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "quote_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_selectedQuoteId_fkey" FOREIGN KEY ("selectedQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

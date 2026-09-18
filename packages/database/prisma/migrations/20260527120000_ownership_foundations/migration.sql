-- Sprint 2: ownership foundations (additive only)

-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('own', 'team', 'tenant', 'shared');

-- CreateEnum
CREATE TYPE "LeadSharePermission" AS ENUM ('read', 'comment');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "lead_shares" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "shared_with_user_id" TEXT NOT NULL,
    "shared_by_user_id" TEXT NOT NULL,
    "permission" "LeadSharePermission" NOT NULL DEFAULT 'read',
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_shares_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN "default_data_scope" "DataScope" NOT NULL DEFAULT 'own';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "primary_team_id" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN "owner_user_id" TEXT,
ADD COLUMN "owner_team_id" TEXT;

-- CreateIndex
CREATE INDEX "teams_tenantId_idx" ON "teams"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_tenantId_slug_key" ON "teams"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "lead_shares_tenantId_shared_with_user_id_idx" ON "lead_shares"("tenantId", "shared_with_user_id");

-- CreateIndex
CREATE INDEX "lead_shares_leadId_idx" ON "lead_shares"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_shares_leadId_shared_with_user_id_key" ON "lead_shares"("leadId", "shared_with_user_id");

-- CreateIndex
CREATE INDEX "leads_tenantId_owner_user_id_idx" ON "leads"("tenantId", "owner_user_id");

-- CreateIndex
CREATE INDEX "leads_tenantId_owner_team_id_idx" ON "leads"("tenantId", "owner_team_id");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_shares" ADD CONSTRAINT "lead_shares_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_shares" ADD CONSTRAINT "lead_shares_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_shares" ADD CONSTRAINT "lead_shares_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_primary_team_id_fkey" FOREIGN KEY ("primary_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_team_id_fkey" FOREIGN KEY ("owner_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

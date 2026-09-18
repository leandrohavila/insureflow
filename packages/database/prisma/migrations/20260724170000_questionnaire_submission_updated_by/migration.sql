-- Track the broker/user responsible for the latest questionnaire submission edit.
ALTER TABLE "questionnaire_submissions"
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "questionnaire_submissions"
ADD CONSTRAINT "questionnaire_submissions_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "questionnaire_submissions_tenantId_updated_by_id_idx"
ON "questionnaire_submissions"("tenantId", "updated_by_id");

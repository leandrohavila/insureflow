-- Vídeo institucional configurável no portal. Só metadados e URLs; o arquivo não é gravado no banco.

ALTER TABLE "portal_configs" ADD COLUMN "institutional_video" JSONB;

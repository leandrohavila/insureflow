-- Key e driver do arquivo. Imagens antigas ficam com as colunas nulas
-- e continuam sendo servidas pelo path já gravado em url.
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "storage_key" TEXT;
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "storage_driver" TEXT;

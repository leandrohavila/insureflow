-- Estado persistente dos lembretes D-60, D-30 e D-15.
-- false preserva os leads atuais: a sugestão continua disponível.
-- true significa desativado pelo corretor, distinto de atividade concluída.
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "renewal_d60_disabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "renewal_d30_disabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "renewal_d15_disabled" BOOLEAN NOT NULL DEFAULT false;

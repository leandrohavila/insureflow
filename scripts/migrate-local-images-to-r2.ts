/**
 * Copia imagens locais do módulo imobiliário para o Cloudflare R2 e
 * atualiza as URLs gravadas no banco.
 *
 * Não apaga os arquivos em disco e não exige R2_ENABLED=true.
 * Rollback: manter os arquivos locais, restaurar as URLs anteriores
 * (o script imprime o de/para) e deixar R2_ENABLED=false.
 *
 * Uso, a partir de apps/api:
 *   npm run images:migrate-r2
 *   npm run images:migrate-r2 -- --apply
 *   npm run images:migrate-r2 -- --apply --uploads /app/apps/api/uploads
 *
 * Sem --apply o script só relata o que faria.
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import {
  getR2Storage,
  readR2Config,
} from "../apps/api/src/common/storage/r2-storage.service";
import {
  mimeFromFilename,
  safeFilename,
} from "../apps/api/src/modules/properties/property-storage";

const monorepoRoot = path.resolve(__dirname, "..");
const appEnv = process.env.APP_ENV ?? "development";
for (const file of [".env", `.env.${appEnv}`, "apps/api/.env"]) {
  loadEnv({ path: path.join(monorepoRoot, file), override: false });
}

type FilePlan = {
  absolutePath: string;
  key: string;
  marker: string;
  contentType: string;
};

type UrlChange = {
  model: string;
  id: string;
  field: string;
  from: string;
  to: string;
};

type Report = {
  dryRun: boolean;
  uploadsDir: string;
  scanned: number;
  uploaded: number;
  urlsUpdated: number;
  alreadyPublic: number;
  unreferenced: number;
  skipped: number;
  failed: { file: string; error: string }[];
  changes: UrlChange[];
};

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  return process.argv[index + 1] ?? null;
}

function resolveUploadsDir() {
  const fromArg = argValue("--uploads");
  if (fromArg) return path.resolve(fromArg);
  const fromEnv = process.env.PROPERTY_UPLOADS_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  const candidates = [
    path.resolve(process.cwd(), "uploads"),
    path.resolve(monorepoRoot, "apps/api/uploads"),
  ];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0];
}

function safeSegment(name: string) {
  if (!name || name.length > 80 || !/^[A-Za-z0-9_-]+$/.test(name)) return null;
  return name;
}

async function collectFiles(uploadsDir: string) {
  const plans: FilePlan[] = [];
  const skipped: string[] = [];
  for (const scope of ["properties", "portal"] as const) {
    const scopeDir = path.join(uploadsDir, scope);
    if (!existsSync(scopeDir)) continue;
    const owners = await readdir(scopeDir, { withFileTypes: true });
    for (const owner of owners) {
      if (!owner.isDirectory() || !safeSegment(owner.name)) {
        skipped.push(path.join(scope, owner.name));
        continue;
      }
      const ownerDir = path.join(scopeDir, owner.name);
      const files = await readdir(ownerDir, { withFileTypes: true });
      for (const file of files) {
        const relative = path.join(scope, owner.name, file.name);
        if (!file.isFile()) {
          skipped.push(relative);
          continue;
        }
        const ext = path.extname(file.name).toLowerCase();
        if (!IMAGE_EXT.has(ext) || !safeFilename(file.name)) {
          skipped.push(relative);
          continue;
        }
        const filename = file.name;
        const key = `${scope}/${owner.name}/${filename}`;
        const marker =
          scope === "properties"
            ? `/api/v1/files/properties/${owner.name}/${filename}`
            : `/api/v1/files/portal/${owner.name}/${filename}`;
        plans.push({
          absolutePath: path.join(ownerDir, filename),
          key,
          marker,
          contentType: mimeFromFilename(filename),
        });
      }
    }
  }
  return { plans, skipped };
}

async function planUrlChanges(
  prisma: PrismaClient,
  plan: FilePlan,
  publicUrl: string,
) {
  const changes: UrlChange[] = [];
  let alreadyPublic = 0;

  const consider = (
    model: string,
    id: string,
    field: string,
    current: string | null,
  ) => {
    if (!current) return;
    if (current === publicUrl) {
      alreadyPublic += 1;
      return;
    }
    if (!current.includes(plan.marker)) return;
    changes.push({ model, id, field, from: current, to: publicUrl });
  };

  if (plan.key.startsWith("properties/")) {
    const rows = await prisma.propertyImage.findMany({
      where: {
        OR: [{ url: { contains: plan.marker } }, { url: publicUrl }],
      },
      select: { id: true, url: true },
    });
    for (const row of rows) consider("PropertyImage", row.id, "url", row.url);
    return { changes, alreadyPublic };
  }

  const configs = await prisma.portalConfig.findMany({
    where: {
      OR: [
        { logoUrl: { contains: plan.marker } },
        { heroImage: { contains: plan.marker } },
        { aboutImage: { contains: plan.marker } },
        { logoUrl: publicUrl },
        { heroImage: publicUrl },
        { aboutImage: publicUrl },
      ],
    },
    select: {
      id: true,
      logoUrl: true,
      heroImage: true,
      aboutImage: true,
    },
  });
  for (const row of configs) {
    consider("PortalConfig", row.id, "logoUrl", row.logoUrl);
    consider("PortalConfig", row.id, "heroImage", row.heroImage);
    consider("PortalConfig", row.id, "aboutImage", row.aboutImage);
  }

  const banners = await prisma.portalBanner.findMany({
    where: {
      OR: [{ image: { contains: plan.marker } }, { image: publicUrl }],
    },
    select: { id: true, image: true },
  });
  for (const row of banners) {
    consider("PortalBanner", row.id, "image", row.image);
  }
  return { changes, alreadyPublic };
}

async function applyUrlChange(prisma: PrismaClient, change: UrlChange) {
  if (change.model === "PropertyImage") {
    await prisma.propertyImage.update({
      where: { id: change.id },
      data: { url: change.to },
    });
    return;
  }
  if (change.model === "PortalBanner") {
    await prisma.portalBanner.update({
      where: { id: change.id },
      data: { image: change.to },
    });
    return;
  }
  const data =
    change.field === "logoUrl"
      ? { logoUrl: change.to }
      : change.field === "heroImage"
        ? { heroImage: change.to }
        : { aboutImage: change.to };
  await prisma.portalConfig.update({ where: { id: change.id }, data });
}

function assertConfig(apply: boolean) {
  const config = readR2Config();
  const missing: string[] = [];
  if (!config.publicUrl) missing.push("R2_PUBLIC_URL");
  if (apply) {
    if (!config.bucket) missing.push("R2_BUCKET");
    if (!config.endpoint) missing.push("R2_ENDPOINT");
    if (!config.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!config.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  }
  if (missing.length) {
    throw new Error(`Configuração R2 incompleta: ${missing.join(", ")}`);
  }
  return config;
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log(
      "Uso: npm run images:migrate-r2 -- [--apply] [--uploads <dir>]",
    );
    return;
  }
  const apply = process.argv.includes("--apply");
  const config = assertConfig(apply);
  const uploadsDir = resolveUploadsDir();
  const report: Report = {
    dryRun: !apply,
    uploadsDir,
    scanned: 0,
    uploaded: 0,
    urlsUpdated: 0,
    alreadyPublic: 0,
    unreferenced: 0,
    skipped: 0,
    failed: [],
    changes: [],
  };

  if (!existsSync(uploadsDir)) {
    console.log(JSON.stringify(report, null, 2));
    console.log(`Nenhuma pasta de uploads em ${uploadsDir}`);
    return;
  }

  const { plans, skipped } = await collectFiles(uploadsDir);
  report.scanned = plans.length;
  report.skipped = skipped.length;
  const storage = getR2Storage();
  const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
  if (!prisma) {
    console.log(JSON.stringify(report, null, 2));
    throw new Error("DATABASE_URL ausente — não é possível atualizar URLs");
  }

  try {
    for (const plan of plans) {
      const publicUrl = storage.buildPublicUrl(plan.key);
      try {
        const planned = await planUrlChanges(prisma, plan, publicUrl);
        report.alreadyPublic += planned.alreadyPublic;
        report.changes.push(...planned.changes);
        if (planned.changes.length === 0 && planned.alreadyPublic === 0) {
          report.unreferenced += 1;
        }
        if (!apply) continue;
        const body = await readFile(plan.absolutePath);
        await storage.uploadFile(body, plan.key, plan.contentType);
        report.uploaded += 1;
        for (const change of planned.changes) {
          await applyUrlChange(prisma, change);
          report.urlsUpdated += 1;
        }
      } catch (error) {
        report.failed.push({
          file: plan.key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(JSON.stringify(report, null, 2));
  console.log(
    apply
      ? `Migração concluída. Uploads: ${report.uploaded}. URLs: ${report.urlsUpdated}. Falhas: ${report.failed.length}. Arquivos locais preservados.`
      : `Dry-run. Arquivos: ${report.scanned}. URLs a atualizar: ${report.changes.length}. Rode com --apply para enviar ao bucket ${config.bucket || "(defina R2_BUCKET)"}.`,
  );
  if (report.failed.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

-- Backfill ACL imobiliária no papel admin.
-- Produção pode ter sido seedada antes de properties:view existir no catálogo.

INSERT INTO "permissions" ("id", "key", "description", "createdAt")
SELECT 'perm_properties_view', 'properties:view', 'Ver inventário imobiliário', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "key" = 'properties:view');

INSERT INTO "permissions" ("id", "key", "description", "createdAt")
SELECT 'perm_properties_manage', 'properties:manage', 'Gerenciar inventário imobiliário e publicação', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "key" = 'properties:manage');

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."slug" IN ('admin', 'super_admin')
  AND p."key" IN ('properties:view', 'properties:manage')
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permissions" rp
    WHERE rp."roleId" = r."id"
      AND rp."permissionId" = p."id"
  );

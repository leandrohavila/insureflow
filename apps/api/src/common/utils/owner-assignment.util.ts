import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type UserDisplaySource = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

/** Rótulo legível de responsável a partir do usuário dono (fonte canônica). */
export function resolveAssignedToLabel(
  user: UserDisplaySource | null | undefined,
): string | undefined {
  if (!user) return undefined;
  return (
    user.name?.trim() || user.email?.trim() || user.id?.trim() || undefined
  );
}

/** Responsável exibido: ownerUser primeiro, assignedTo legado como fallback. */
export function resolveResponsibleLabel(
  ownerUser: UserDisplaySource | null | undefined,
  assignedToFallback?: string | null,
): string | null {
  return (
    resolveAssignedToLabel(ownerUser) ?? assignedToFallback?.trim() ?? null
  );
}

export async function resolveAssignedToLabelForUserId(
  prisma: PrismaService,
  tenantId: string,
  userId: string,
): Promise<string | undefined> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, name: true, email: true },
  });
  return resolveAssignedToLabel(user);
}

/** Resolve ownerUserId a partir de assignedTo legado (id, e-mail ou nome). */
export async function resolveOwnerUserIdFromAssignedTo(
  prisma: PrismaService,
  tenantId: string,
  assignedTo: string,
): Promise<string | null> {
  const trimmed = assignedTo.trim();
  if (!trimmed) return null;

  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      OR: [
        { id: trimmed },
        { email: trimmed.toLowerCase() },
        { name: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });

  return user?.id ?? null;
}

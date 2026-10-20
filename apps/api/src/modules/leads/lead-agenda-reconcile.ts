export type AgendaActivityRow = {
  id: string;
  status: string;
  operationalEventKind: string | null;
  occurredAt: Date;
  description?: string | null;
  type?: string | null;
  outcome?: string | null;
  dealId?: string | null;
  customerId?: string | null;
  policyId?: string | null;
};

export type AgendaCreateData = {
  tenantId: string;
  leadId: string;
  performedById: string;
  type: string;
  status: 'pending';
  subject: string;
  description: string | null;
  occurredAt: Date;
  nextFollowUpAt: Date;
  operationalEventKind: string;
};

export type AgendaWrite =
  | {
      op: 'update';
      id: string;
      occurredAt: Date;
      nextFollowUpAt: Date;
      description?: string | null;
      type?: string;
    }
  | { op: 'delete'; id: string }
  | { op: 'cancel'; id: string }
  | { op: 'create'; data: AgendaCreateData };

/**
 * `desired === undefined` não altera o tipo.
 * `null` retira só pendências daquele tipo exato.
 * `cancel` preserva a linha; `delete` apaga.
 * `Date` atualiza a pendência existente ou cria uma, sem mexer em concluídas ou canceladas.
 */
export function planExactKindAgenda(input: {
  existing: readonly AgendaActivityRow[];
  kind: string;
  desired: Date | null | undefined;
  create?: Omit<
    AgendaCreateData,
    'occurredAt' | 'nextFollowUpAt' | 'operationalEventKind'
  >;
  description?: string | null;
  type?: string;
  retirePending?: 'delete' | 'cancel';
}): AgendaWrite[] {
  if (input.desired === undefined) return [];
  const retire = input.retirePending ?? 'delete';
  const retireWrite = (id: string): AgendaWrite =>
    retire === 'cancel' ? { op: 'cancel', id } : { op: 'delete', id };
  const sameKind = input.existing.filter(
    (row) => row.operationalEventKind === input.kind,
  );
  const pending = sameKind.filter((row) => row.status === 'pending');
  if (input.desired === null) {
    return pending.map((row) => retireWrite(row.id));
  }
  const desired = input.desired;
  if (Number.isNaN(desired.getTime())) return [];
  const [keeper, ...extras] = pending;
  const writes: AgendaWrite[] = extras.map((row) => retireWrite(row.id));
  if (!keeper) {
    if (!input.create) return writes;
    writes.push({
      op: 'create',
      data: {
        ...input.create,
        description:
          input.description !== undefined
            ? input.description
            : input.create.description,
        type: input.type ?? input.create.type,
        occurredAt: desired,
        nextFollowUpAt: desired,
        operationalEventKind: input.kind,
      },
    });
    return writes;
  }
  const sameInstant = keeper.occurredAt.getTime() === desired.getTime();
  const descriptionChanges =
    input.description !== undefined &&
    input.description !== (keeper.description ?? null);
  const typeChanges = input.type !== undefined && input.type !== keeper.type;
  if (!sameInstant || descriptionChanges || typeChanges) {
    writes.push({
      op: 'update',
      id: keeper.id,
      occurredAt: desired,
      nextFollowUpAt: desired,
      ...(descriptionChanges ? { description: input.description } : {}),
      ...(typeChanges ? { type: input.type } : {}),
    });
  }
  return writes;
}

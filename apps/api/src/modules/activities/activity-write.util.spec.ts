import { BadRequestException, NotFoundException } from '@nestjs/common';

import {
  assertActivityPerformer,
  assertActivityRelations,
  syncLeadLastContactFromActivities,
  type PrismaClientLike,
} from './activity-write.util';
describe('activity-write.util', () => {
  const tenantId = 'tenant-1';

  function createClient(
    overrides: {
      lead?: { id: string } | null;
      deal?: { id: string } | null;
      customer?: { id: string } | null;
      policy?: { id: string } | null;
      user?: { id: string } | null;
      maxOccurredAt?: Date | null;
    } = {},
  ) {
    const leadUpdate = jest.fn(() => ({}));
    const client = {
      lead: {
        findFirst: jest.fn(() => overrides.lead ?? null),
        update: leadUpdate,
      },
      deal: {
        findFirst: jest.fn(() => overrides.deal ?? null),
      },
      customer: {
        findFirst: jest.fn(() => overrides.customer ?? null),
      },
      policy: {
        findFirst: jest.fn(() => overrides.policy ?? null),
      },
      user: {
        findFirst: jest.fn(() => overrides.user ?? null),
      },
      activity: {
        aggregate: jest.fn(() => ({
          _max: { occurredAt: overrides.maxOccurredAt ?? null },
        })),
      },
    } as unknown as PrismaClientLike & {
      lead: { update: jest.Mock };
    };

    return { client, leadUpdate };
  }

  it('exige ao menos um vínculo de entidade', async () => {
    const { client } = createClient();
    await expect(
      assertActivityRelations(client, tenantId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida performer no tenant', async () => {
    const { client } = createClient({ user: null });
    await expect(
      assertActivityPerformer(client, tenantId, 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sincroniza lastContactAt a partir das atividades', async () => {
    const occurredAt = new Date('2026-01-15T12:00:00.000Z');
    const { client, leadUpdate } = createClient({ maxOccurredAt: occurredAt });

    await syncLeadLastContactFromActivities(client, tenantId, 'lead-1');

    expect(leadUpdate).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { lastContactAt: occurredAt },
    });
  });
});

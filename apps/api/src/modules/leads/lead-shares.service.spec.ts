import { ConflictException, NotFoundException } from '@nestjs/common';

import { OwnershipService } from '../access/ownership.service';
import { LeadSharesService } from './lead-shares.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

type ShareFindArgs = {
  where: {
    id?: string;
    leadId?: string;
    sharedWithUserId?: string;
  };
};

describe('LeadSharesService', () => {
  const actor = {
    userId: 'user-owner',
    roles: ['comercial'],
    permissions: ['leads:share', 'leads:view'],
  };

  function createService(options?: {
    targetUserExists?: boolean;
    existingShare?: boolean;
  }) {
    const leadShareUpdate = jest.fn().mockResolvedValue(undefined);
    const leadShare = {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockImplementation((args: ShareFindArgs) => {
        const { where } = args;
        if (where.id === 'share-1') {
          return Promise.resolve({ id: 'share-1' });
        }
        if (where.leadId && where.sharedWithUserId && options?.existingShare) {
          return Promise.resolve({ id: 'existing' });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue({
        id: 'share-1',
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        sharedWithUserId: 'user-partner',
        sharedByUserId: actor.userId,
        permission: 'read',
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        sharedWithUser: {
          id: 'user-partner',
          name: 'Parceiro',
          email: 'p@x.com',
          initials: 'PX',
        },
        sharedByUser: {
          id: actor.userId,
          name: 'Owner',
          email: 'o@x.com',
          initials: 'OW',
        },
      }),
      update: leadShareUpdate,
    };

    const prisma = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({ id: 'lead-1' }),
      },
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue(
            options?.targetUserExists === false ? null : { id: 'user-partner' },
          ),
      },
      leadShare,
    } as unknown as PrismaService;

    const ownership = {
      getEnforcementMode: jest.fn().mockResolvedValue('off'),
      resolveContext: jest.fn(),
      assertCanAccessLead: jest.fn(),
      logLeadAccessShadowDenied: jest.fn(),
    } as unknown as OwnershipService;

    return {
      service: new LeadSharesService(prisma, ownership),
      leadShareUpdate,
    };
  }

  it('creates share when lead and target user exist', async () => {
    const { service } = createService();

    const result = await service.createShare(
      'tenant-1',
      'lead-1',
      { sharedWithUserId: 'user-partner' },
      actor,
    );

    expect(result.sharedWithUserId).toBe('user-partner');
    expect(result.permission).toBe('read');
  });

  it('rejects duplicate active share', async () => {
    const { service } = createService({ existingShare: true });

    await expect(
      service.createShare(
        'tenant-1',
        'lead-1',
        { sharedWithUserId: 'user-partner' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects share when target user is missing', async () => {
    const { service } = createService({ targetUserExists: false });

    await expect(
      service.createShare(
        'tenant-1',
        'lead-1',
        { sharedWithUserId: 'missing' },
        actor,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('revokes share by id', async () => {
    const { service, leadShareUpdate } = createService();

    const result = await service.revokeShare(
      'tenant-1',
      'lead-1',
      'share-1',
      actor,
    );

    expect(result).toEqual({ revoked: true, id: 'share-1' });
    expect(leadShareUpdate).toHaveBeenCalled();
  });
});

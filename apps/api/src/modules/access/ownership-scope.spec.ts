import type { DataScope } from '@prisma/client';

import {
  resolveEffectiveDataScope,
  scopeForRoleSlug,
} from './data-scope.util';
import { OwnershipService } from './ownership.service';
import type { AccessContext } from './ownership.types';

function ctx(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    tenantId: 'tenant-1',
    userId: 'user-1',
    roles: ['comercial'],
    permissions: ['leads:view'],
    dataScope: 'own',
    teamIds: [],
    ...overrides,
  };
}

describe('data-scope.util', () => {
  it('resolveEffectiveDataScope picks widest scope', () => {
    expect(resolveEffectiveDataScope(['own', 'team'])).toBe('team');
    expect(resolveEffectiveDataScope(['shared', 'tenant'])).toBe('tenant');
    expect(resolveEffectiveDataScope([])).toBe('own');
  });

  it('scopeForRoleSlug uses DB value when present', () => {
    expect(scopeForRoleSlug('comercial', 'team')).toBe('team');
    expect(scopeForRoleSlug('parceiro')).toBe('shared');
    expect(scopeForRoleSlug('unknown-role')).toBe('own');
  });
});

describe('OwnershipService.buildLeadAccessWhere', () => {
  const service = new OwnershipService(null as never, null as never);

  const cases: Array<{ scope: DataScope; teamIds: string[]; expected: object }> =
    [
      { scope: 'tenant', teamIds: [], expected: {} },
      { scope: 'own', teamIds: [], expected: { ownerUserId: 'user-1' } },
      {
        scope: 'team',
        teamIds: ['team-a'],
        expected: { ownerTeamId: { in: ['team-a'] } },
      },
      {
        scope: 'team',
        teamIds: [],
        expected: { ownerTeamId: { in: [] } },
      },
      {
        scope: 'shared',
        teamIds: [],
        expected: {
          shares: {
            some: {
              sharedWithUserId: 'user-1',
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
            },
          },
        },
      },
    ];

  it.each(cases)(
    'scope=$scope teamIds=$teamIds',
    ({ scope, teamIds, expected }) => {
      const where = service.buildLeadAccessWhere(
        ctx({ dataScope: scope, teamIds }),
      );
      expect(where).toEqual(expected);
    },
  );
});

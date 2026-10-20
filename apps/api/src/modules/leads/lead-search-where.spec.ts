import { LeadsService } from './leads.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { OwnershipService } from '../access/ownership.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';

type LeadRow = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  document: string | null;
  status: string;
  assignedTo: string | null;
  createdAt: Date;
};

type ContainsFilter = { contains?: string; mode?: string };

function includesText(value: string | null, filter?: ContainsFilter) {
  if (!filter?.contains) return false;
  return (value ?? '').toLowerCase().includes(filter.contains.toLowerCase());
}

function matchesClause(lead: LeadRow, clause: Record<string, unknown>) {
  if ('name' in clause) {
    return includesText(lead.name, clause.name as ContainsFilter);
  }
  if ('email' in clause) {
    return includesText(lead.email, clause.email as ContainsFilter);
  }
  if ('phone' in clause) {
    return includesText(lead.phone, clause.phone as ContainsFilter);
  }
  if ('company' in clause) {
    return includesText(lead.company, clause.company as ContainsFilter);
  }
  if ('source' in clause && !('OR' in clause)) {
    return includesText(lead.source, clause.source as ContainsFilter);
  }
  if ('assignedTo' in clause) {
    return includesText(lead.assignedTo, clause.assignedTo as ContainsFilter);
  }
  if ('document' in clause) {
    const needle = (clause.document as ContainsFilter).contains ?? '';
    if (!needle) return lead.document != null;
    return (lead.document ?? '').includes(needle);
  }
  const ids = (clause.id as { in?: string[] } | undefined)?.in;
  if (ids) return ids.includes(lead.id);
  return false;
}

function matchesWhere(lead: LeadRow, where: Record<string, unknown>) {
  if (where.tenantId && lead.tenantId !== where.tenantId) return false;
  if (where.status && lead.status !== where.status) return false;
  if (where.source && !('OR' in where)) {
    if (!includesText(lead.source, where.source)) return false;
  }
  if (where.createdAt) {
    const gte = (where.createdAt as { gte?: Date }).gte;
    if (gte && lead.createdAt < gte) return false;
  }
  const or = where.OR as Array<Record<string, unknown>> | undefined;
  if (or?.length && !or.some((clause) => matchesClause(lead, clause))) {
    return false;
  }
  const and = where.AND as Array<Record<string, unknown>> | undefined;
  if (and) {
    for (const part of and) {
      const sourceOr = part.OR as Array<Record<string, unknown>> | undefined;
      if (
        sourceOr &&
        !sourceOr.some((clause) =>
          includesText(lead.source, clause.source as ContainsFilter),
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

function documentNeedles(where: { OR?: Array<Record<string, unknown>> }) {
  return (where.OR ?? [])
    .map((clause) => (clause.document as ContainsFilter | undefined)?.contains)
    .filter((value): value is string => value !== undefined);
}

describe('LeadsService.findLeads search', () => {
  const tenantId = 'tenant-1';
  const now = new Date();
  const catalog: LeadRow[] = [
    {
      id: 'bruna',
      tenantId,
      name: 'BRUNA LOPES COELHO',
      email: null,
      phone: '11988887777',
      company: null,
      source: 'indicação',
      document: '52998224725',
      status: 'contacted',
      assignedTo: null,
      createdAt: now,
    },
    {
      id: 'teste',
      tenantId,
      name: 'TESTE AVILA 2',
      email: 'teste@avila.com',
      phone: '11911112222',
      company: 'Avila',
      source: 'site',
      document: '11144477735',
      status: 'new',
      assignedTo: 'Outro',
      createdAt: now,
    },
    {
      id: 'matheus',
      tenantId,
      name: 'Matheus Gabriel Silveira',
      email: null,
      phone: null,
      company: null,
      source: null,
      document: '39053344705',
      status: 'contacted',
      assignedTo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 'phone-only',
      tenantId,
      name: 'Contato Telefone',
      email: null,
      phone: '(11) 98888-7777',
      company: null,
      source: null,
      document: null,
      status: 'new',
      assignedTo: null,
      createdAt: now,
    },
    {
      id: 'phone-doc',
      tenantId,
      name: 'Documento do telefone',
      email: null,
      phone: null,
      company: null,
      source: null,
      document: '11988887777',
      status: 'new',
      assignedTo: null,
      createdAt: now,
    },
    {
      id: 'bruna-2',
      tenantId,
      name: 'BRUNA 2 LOPES',
      email: null,
      phone: null,
      company: null,
      source: null,
      document: '39053344705',
      status: 'new',
      assignedTo: null,
      createdAt: now,
    },
  ];

  function createService() {
    const findMany = jest.fn(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(
        catalog
          .filter((lead) => matchesWhere(lead, where))
          .map((lead) => ({
            ...lead,
            updatedAt: lead.createdAt,
            lastContactAt: null,
            dealId: null,
            ownerUser: null,
            businessUnit: null,
            businessUnits: [],
            interestCategories: [],
          })),
      ),
    );
    const count = jest.fn(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(
        catalog.filter((lead) => matchesWhere(lead, where)).length,
      ),
    );
    const prisma = {
      lead: { findMany, count },
      activity: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    } as unknown as PrismaService;

    const service = new LeadsService(
      prisma,
      {} as OwnershipService,
      {} as ActivityEngineService,
      {} as BusinessUnitsService,
      { findOne: jest.fn() } as never,
      { findOne: jest.fn() } as never,
    );

    return { service, findMany };
  }

  function searchedWhere(
    findMany: jest.Mock,
  ): { OR?: Array<Record<string, unknown>> } & Record<string, unknown> {
    const listCall = findMany.mock.calls.find(
      (call) => call[0]?.take !== undefined,
    );
    return listCall?.[0].where;
  }

  it('não inclui outros nomes ao buscar somente letras', async () => {
    const { service, findMany } = createService();

    const result = await service.findLeads(tenantId, { search: 'BRUNA LOPES' });
    const where = searchedWhere(findMany);

    expect(documentNeedles(where)).toEqual([]);
    expect(JSON.stringify(where)).not.toContain('contains":""');
    expect(result.data.map((lead) => lead.name)).toEqual([
      'BRUNA LOPES COELHO',
    ]);
  });

  it('pesquisa o documento pelos dígitos do CPF', async () => {
    const { service, findMany } = createService();

    const result = await service.findLeads(tenantId, {
      search: '529.982.247-25',
    });
    const where = searchedWhere(findMany);

    expect(documentNeedles(where)).toEqual(['52998224725']);
    expect(result.data.map((lead) => lead.id)).toEqual(['bruna']);
  });

  it('mantém a pesquisa de telefone pelos dígitos', async () => {
    const { service, findMany } = createService();

    const result = await service.findLeads(tenantId, {
      search: '(11) 98888-7777',
    });
    const where = searchedWhere(findMany);

    expect(documentNeedles(where)).toEqual(['11988887777']);
    expect(result.data.map((lead) => lead.id).sort()).toEqual([
      'phone-doc',
      'phone-only',
    ]);
  });

  it('não usa documento vazio quando o termo mistura letras e um número', async () => {
    const { service, findMany } = createService();

    const result = await service.findLeads(tenantId, { search: 'BRUNA 2' });
    const where = searchedWhere(findMany);

    expect(documentNeedles(where)).toEqual([]);
    expect(result.data.map((lead) => lead.name)).toEqual(['BRUNA 2 LOPES']);
  });

  it('combina status, origem e período com a busca textual', async () => {
    const { service, findMany } = createService();

    const result = await service.findLeads(tenantId, {
      search: 'BRUNA LOPES',
      status: 'contacted',
      source: 'indicação',
      createdWithinDays: 7,
    });
    const where = searchedWhere(findMany);

    expect(where.status).toBe('contacted');
    expect(where.createdAt).toEqual(
      expect.objectContaining({ gte: expect.any(Date) }),
    );
    expect(where.AND).toEqual([
      {
        OR: [{ source: { contains: 'indicação', mode: 'insensitive' } }],
      },
    ]);
    expect(documentNeedles(where)).toEqual([]);
    expect(result.data.map((lead) => lead.id)).toEqual(['bruna']);
  });
});

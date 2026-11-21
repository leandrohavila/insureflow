import { LeadsService } from './leads.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { OwnershipService } from '../access/ownership.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';
import type { BusinessUnitAccessService } from '../access/business-unit-access.service';

type LeadRow = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  document: string | null;
  assignedTo: string | null;
  status: string;
  ownerUserId: string | null;
  ownerName: string | null;
  businessUnitId: string | null;
  linkedBusinessUnitIds: string[];
  createdAt: Date;
};

type Where = Record<string, unknown>;
type ContainsFilter = { contains?: string; mode?: string };

const TEXT_FIELDS = [
  'name',
  'email',
  'phone',
  'company',
  'source',
  'assignedTo',
  'document',
] as const;

function containsText(value: string | null, filter: ContainsFilter) {
  const needle = filter.contains ?? '';
  const haystack = value ?? '';
  return filter.mode === 'insensitive'
    ? haystack.toLowerCase().includes(needle.toLowerCase())
    : haystack.includes(needle);
}

function matchesWhere(lead: LeadRow, where: Where): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    switch (key) {
      case 'AND':
        return (value as Where[]).every((part) => matchesWhere(lead, part));
      case 'OR':
        return (value as Where[]).some((part) => matchesWhere(lead, part));
      case 'tenantId':
      case 'status':
      case 'ownerUserId':
        return lead[key] === value;
      case 'id':
        return ((value as { in: string[] }).in ?? []).includes(lead.id);
      case 'businessUnitId':
        return ((value as { in: string[] }).in ?? []).includes(
          lead.businessUnitId ?? '',
        );
      case 'businessUnits': {
        const ids =
          (value as { some: { businessUnitId: { in: string[] } } }).some
            .businessUnitId.in ?? [];
        return lead.linkedBusinessUnitIds.some((id) => ids.includes(id));
      }
      case 'ownerUser': {
        const owner = value as Record<string, ContainsFilter>;
        if (owner.name) return containsText(lead.ownerName, owner.name);
        return false;
      }
      case 'createdAt':
        return lead.createdAt >= (value as { gte: Date }).gte;
      default:
        if ((TEXT_FIELDS as readonly string[]).includes(key)) {
          return containsText(
            lead[key as (typeof TEXT_FIELDS)[number]],
            value as ContainsFilter,
          );
        }
        throw new Error(`Cláusula não suportada pelo teste: ${key}`);
    }
  });
}

const tenantId = 'tenant-1';
const now = new Date();

function lead(overrides: Partial<LeadRow> & Pick<LeadRow, 'id' | 'name'>) {
  return {
    tenantId,
    email: null,
    phone: null,
    company: null,
    source: null,
    document: null,
    assignedTo: null,
    status: 'new',
    ownerUserId: null,
    ownerName: null,
    businessUnitId: 'bu-seguros',
    linkedBusinessUnitIds: [],
    createdAt: now,
    ...overrides,
  } satisfies LeadRow;
}

const catalog: LeadRow[] = [
  lead({
    id: 'crm0064',
    name: 'CRM0064 Lead 094544',
    company: 'Ávila Homolog',
    source: 'carteira',
    status: 'new',
    ownerUserId: 'user-admin',
  }),
  lead({
    id: 'homolog-name',
    name: 'Cliente Homologação',
    email: 'cliente@exemplo.com',
    phone: '11955554444',
    status: 'contacted',
    ownerUserId: 'user-2',
  }),
  lead({
    id: 'homolog-imob',
    name: 'Homolog Imobiliário',
    status: 'new',
    businessUnitId: 'bu-imob',
  }),
  lead({
    id: 'other',
    name: 'Carlos Souza',
    email: 'carlos@empresa.com',
    phone: '(11) 97777-6666',
    company: 'Outra Empresa',
    source: 'site',
    ownerUserId: 'user-admin',
  }),
  lead({
    id: 'other-2',
    name: 'Marina Prado',
    email: 'marina.prado@exemplo.com',
    status: 'contacted',
    ownerUserId: 'user-2',
  }),
  tenantLeak(),
];

function tenantLeak(): LeadRow {
  return lead({
    id: 'other-tenant',
    tenantId: 'tenant-2',
    name: 'Homolog de outro tenant',
    company: 'Ávila Homolog',
  });
}

function createService() {
  const findMany = jest.fn(
    ({ where, skip, take }: { where: Where; skip?: number; take?: number }) => {
      const rows = catalog.filter((row) => matchesWhere(row, where));
      const page =
        take === undefined ? rows : rows.slice(skip ?? 0, (skip ?? 0) + take);
      return Promise.resolve(
        page.map((row) => ({
          ...row,
          updatedAt: row.createdAt,
          lastContactAt: null,
          dealId: null,
          ownerUser: null,
          businessUnit: null,
          businessUnits: [],
          interestCategories: [],
        })),
      );
    },
  );
  const count = jest.fn(({ where }: { where: Where }) =>
    Promise.resolve(catalog.filter((row) => matchesWhere(row, where)).length),
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
  const ownership = {
    getEnforcementMode: jest.fn().mockResolvedValue('off'),
  } as unknown as OwnershipService;
  const buAccess = {
    leadWhere: jest.fn((_actor: unknown, requested?: string | null) =>
      Promise.resolve(
        requested
          ? {
              OR: [
                { businessUnitId: { in: [requested] } },
                {
                  businessUnits: {
                    some: { businessUnitId: { in: [requested] } },
                  },
                },
              ],
            }
          : undefined,
      ),
    ),
  } as unknown as BusinessUnitAccessService;

  const service = new LeadsService(
    prisma,
    ownership,
    {} as ActivityEngineService,
    {} as BusinessUnitsService,
    { findOne: jest.fn() } as never,
    { findOne: jest.fn() } as never,
    buAccess,
  );
  return { service, findMany };
}

const actor = {
  userId: 'user-admin',
  tenantId,
  roles: ['admin'],
  permissions: [],
  currentBusinessUnitId: null,
};

function ids(result: { data: Array<{ id: string }> }) {
  return result.data.map((row) => row.id).sort();
}

describe('LeadsService.findLeads — busca combinada com filtros', () => {
  it('"homolog" retorna apenas leads com o termo em algum campo pesquisado', async () => {
    const { service } = createService();

    const result = await service.findLeads(
      tenantId,
      { search: 'homolog' },
      actor,
    );

    expect(ids(result)).toEqual(['crm0064', 'homolog-imob', 'homolog-name']);
    expect(result.meta.total).toBe(3);
  });

  it('CRM0064 casa com "homolog" pelo campo empresa (company)', async () => {
    const { service } = createService();

    const byCompany = await service.findLeads(
      tenantId,
      { search: 'Ávila Homolog' },
      actor,
    );
    const byName = await service.findLeads(
      tenantId,
      { search: 'CRM0064' },
      actor,
    );

    expect(ids(byCompany)).toEqual(['crm0064']);
    expect(ids(byName)).toEqual(['crm0064']);
  });

  it('busca por telefone e por e-mail', async () => {
    const { service } = createService();

    const byPhone = await service.findLeads(
      tenantId,
      { search: '97777-6666' },
      actor,
    );
    const byEmail = await service.findLeads(
      tenantId,
      { search: 'marina.prado@' },
      actor,
    );

    expect(ids(byPhone)).toEqual(['other']);
    expect(ids(byEmail)).toEqual(['other-2']);
  });

  it('combina a busca com status sem anular nenhum dos dois', async () => {
    const { service } = createService();

    const result = await service.findLeads(
      tenantId,
      { search: 'homolog', status: 'contacted' },
      actor,
    );

    expect(ids(result)).toEqual(['homolog-name']);
  });

  it('combina a busca com "meus leads" (responsável)', async () => {
    const { service } = createService();

    const result = await service.findLeads(
      tenantId,
      { search: 'homolog', mine: true },
      actor,
    );

    expect(ids(result)).toEqual(['crm0064']);
  });

  it('combina a busca com origem e empresa (unidade)', async () => {
    const { service } = createService();

    const bySource = await service.findLeads(
      tenantId,
      { search: 'homolog', source: 'carteira' },
      actor,
    );
    const byUnit = await service.findLeads(
      tenantId,
      { search: 'homolog', businessUnitId: 'bu-imob' },
      actor,
    );

    expect(ids(bySource)).toEqual(['crm0064']);
    expect(ids(byUnit)).toEqual(['homolog-imob']);
  });

  it('sem busca volta a listar todos os leads do tenant', async () => {
    const { service } = createService();

    const result = await service.findLeads(tenantId, { search: '  ' }, actor);

    expect(result.meta.total).toBe(5);
    expect(ids(result)).not.toContain('other-tenant');
  });

  it('pagina mantendo a busca e o total filtrado', async () => {
    const { service, findMany } = createService();

    const first = await service.findLeads(
      tenantId,
      { search: 'homolog', page: 1, limit: 2 },
      actor,
    );
    const second = await service.findLeads(
      tenantId,
      { search: 'homolog', page: 2, limit: 2 },
      actor,
    );

    expect(first.meta.total).toBe(3);
    expect(second.meta.total).toBe(3);
    expect(first.data).toHaveLength(2);
    expect(second.data).toHaveLength(1);
    expect(new Set([...ids(first), ...ids(second)])).toEqual(
      new Set(['crm0064', 'homolog-imob', 'homolog-name']),
    );
    const listCalls = findMany.mock.calls.filter(
      (call) => call[0]?.take !== undefined,
    );
    expect(listCalls.map((call) => call[0].skip)).toEqual([0, 2]);
  });
});

import { LeadsService } from './leads.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('LeadsService.convertLead questionnaire continuity', () => {
  it('mantém o lead e preenche dealId nas respostas', async () => {
    const updatedAt = new Date('2026-08-02T12:00:00.000Z');
    const leadRow = {
      id: 'lead-auto',
      tenantId: 'tenant-1',
      name: 'Marina Lima',
      email: 'marina@example.com',
      phone: '11911112222',
      company: null,
      source: 'indicacao',
      documentType: null,
      document: null,
      status: 'qualified',
      notes: null,
      assignedTo: 'Marina Lima',
      ownerUserId: 'user-owner',
      ownerTeamId: null,
      lastContactAt: updatedAt,
      lastInteractionAt: null,
      businessUnitId: 'bu-insurance',
      interestCategories: ['AUTO_INSURANCE'],
      lostReason: null,
      lossReasonId: null,
      lostAt: null,
      reactivationEnabled: true,
      reactivationDays: null,
      reactivationAttempts: 0,
      nextReactivationAt: null,
      lastReactivatedAt: null,
      dealId: null,
      opportunityType: null,
      currentInsurer: null,
      currentPolicyNumber: null,
      policyExpiresAt: null,
      createdAt: updatedAt,
      updatedAt,
      ownerUser: { id: 'user-owner', name: 'Marina Lima', initials: 'ML' },
      businessUnit: {
        id: 'bu-insurance',
        name: 'Corretora',
        slug: 'corretora',
        type: 'INSURANCE',
        isActive: true,
      },
      businessUnits: [],
    };

    const submissionUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tx = {
      deal: {
        aggregate: jest.fn().mockResolvedValue({ _max: { pipelineOrder: 0 } }),
        create: jest.fn().mockResolvedValue({
          id: 'deal-1',
          title: 'Lead: Marina Lima',
          value: { toNumber: () => 0 },
        }),
      },
      businessUnitPipeline: {
        findUnique: jest.fn().mockResolvedValue({ id: 'pipeline-1' }),
      },
      dealStageHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      lead: {
        update: jest.fn().mockResolvedValue({
          ...leadRow,
          status: 'converted',
          dealId: 'deal-1',
        }),
      },
      questionnaireSubmission: { updateMany: submissionUpdateMany },
    };

    const prisma = {
      lead: { findFirst: jest.fn().mockResolvedValue(leadRow) },
      activity: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;

    const service = new LeadsService(
      prisma,
      { getEnforcementMode: jest.fn().mockResolvedValue('off') } as never,
      {
        linkLeadActivitiesToDeal: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockResolvedValue(undefined),
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.convertLead(
      'tenant-1',
      'lead-auto',
      {},
      {
        userId: 'user-owner',
        tenantId: 'tenant-1',
        roles: ['comercial'],
        permissions: ['leads:manage', 'crm:manage'],
      },
    );

    expect(result.lead.id).toBe('lead-auto');
    expect(result.lead.dealId).toBe('deal-1');
    expect(result.deal.id).toBe('deal-1');
    expect(submissionUpdateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', leadId: 'lead-auto' },
      data: { dealId: 'deal-1' },
    });
  });
});

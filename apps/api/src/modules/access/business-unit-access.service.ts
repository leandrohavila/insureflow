import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  andWhere,
  canManageBusinessUnits,
  canViewAllBusinessUnits,
  directBusinessUnitWhere,
  leadOrCustomerBusinessUnitWhere,
  relatedLeadCustomerDealWhere,
  resolveScopedBusinessUnitIds,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class BusinessUnitAccessService {
  constructor(private readonly prisma: PrismaService) {}

  fromUser(user: JwtAccessPayload): BusinessUnitActor {
    return {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    };
  }

  async membershipIds(userId: string, tenantId: string) {
    const rows = await this.prisma.userBusinessUnit.findMany({
      where: {
        userId,
        businessUnit: { tenantId, isActive: true },
      },
      select: { businessUnitId: true },
    });
    return rows.map((row) => row.businessUnitId);
  }

  async resolveIds(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ) {
    const membershipIds = await this.membershipIds(actor.userId, actor.tenantId);
    return resolveScopedBusinessUnitIds({
      canViewAll: canViewAllBusinessUnits(actor),
      membershipIds,
      currentBusinessUnitId: actor.currentBusinessUnitId,
      requestedBusinessUnitId,
    });
  }

  /**
   * Acesso a um registro pontual: membership / view-all.
   * O seletor do header filtra listas, não esconde o lead aberto pela visão
   * Imobiliário (ou o contrário).
   */
  async resolveRecordIds(actor: BusinessUnitActor) {
    const membershipIds = await this.membershipIds(actor.userId, actor.tenantId);
    return resolveScopedBusinessUnitIds({
      canViewAll: canViewAllBusinessUnits(actor),
      membershipIds,
      currentBusinessUnitId: null,
    });
  }

  async leadWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.LeadWhereInput | undefined> {
    return leadOrCustomerBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.LeadWhereInput | undefined;
  }

  async customerWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.CustomerWhereInput | undefined> {
    return leadOrCustomerBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.CustomerWhereInput | undefined;
  }

  async dealWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.DealWhereInput | undefined> {
    return directBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.DealWhereInput | undefined;
  }

  async propertyWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.PropertyWhereInput | undefined> {
    return directBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.PropertyWhereInput | undefined;
  }

  async followUpWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.LeadFollowUpWhereInput | undefined> {
    return directBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.LeadFollowUpWhereInput | undefined;
  }

  async renewalWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.PolicyRenewalWhereInput | undefined> {
    return directBusinessUnitWhere(
      await this.resolveIds(actor, requestedBusinessUnitId),
    ) as Prisma.PolicyRenewalWhereInput | undefined;
  }

  async quoteComparisonWhere(
    actor: BusinessUnitActor,
  ): Promise<Prisma.QuoteComparisonWhereInput | undefined> {
    return relatedLeadCustomerDealWhere(
      await this.resolveIds(actor),
    ) as Prisma.QuoteComparisonWhereInput | undefined;
  }

  async proposalWhere(
    actor: BusinessUnitActor,
  ): Promise<Prisma.ProposalWhereInput | undefined> {
    const ids = await this.resolveIds(actor);
    if (ids === null) return undefined;
    if (ids.length === 0) return { id: { in: [] } };
    return {
      comparison: relatedLeadCustomerDealWhere(
        ids,
      ) as Prisma.QuoteComparisonWhereInput,
    };
  }

  async activityWhere(
    actor: BusinessUnitActor,
  ): Promise<Prisma.ActivityWhereInput | undefined> {
    return relatedLeadCustomerDealWhere(
      await this.resolveIds(actor),
    ) as Prisma.ActivityWhereInput | undefined;
  }

  async communicationWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.CommunicationLogWhereInput | undefined> {
    const ids = await this.resolveIds(actor, requestedBusinessUnitId);
    const related = leadOrCustomerBusinessUnitWhere(ids);
    if (!related) return undefined;
    if ('id' in related) {
      return { id: { in: [] } };
    }
    return {
      OR: [{ lead: related }, { customer: related }],
    };
  }

  async opportunityWhere(
    actor: BusinessUnitActor,
    requestedBusinessUnitId?: string | null,
  ): Promise<Prisma.OpportunityWhereInput | undefined> {
    const ids = await this.resolveIds(actor, requestedBusinessUnitId);
    if (ids === null) return undefined;
    if (ids.length === 0) return { id: { in: [] } };
    const related = leadOrCustomerBusinessUnitWhere(ids);
    return {
      OR: [
        { businessUnitId: { in: ids } },
        {
          customer:
            related && !('id' in related)
              ? (related as Prisma.CustomerWhereInput)
              : { id: { in: [] } },
        },
      ],
    };
  }

  async crossSellWhere(
    actor: BusinessUnitActor,
  ): Promise<Prisma.CrossSellOpportunityWhereInput | undefined> {
    const ids = await this.resolveIds(actor);
    if (ids === null) return undefined;
    if (ids.length === 0) return { id: { in: [] } };
    return {
      customer: leadOrCustomerBusinessUnitWhere(ids) as Prisma.CustomerWhereInput,
    };
  }

  describe(actor: BusinessUnitActor) {
    return {
      canViewAll: canViewAllBusinessUnits(actor),
      canManage: canManageBusinessUnits(actor),
    };
  }

  async assertLeadVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor
      ? (leadOrCustomerBusinessUnitWhere(
          await this.resolveRecordIds(actor),
        ) as Prisma.LeadWhereInput | undefined)
      : undefined;
    await this.assertExists(
      this.prisma.lead.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Lead não encontrado',
    );
  }

  async assertCustomerVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor
      ? (leadOrCustomerBusinessUnitWhere(
          await this.resolveRecordIds(actor),
        ) as Prisma.CustomerWhereInput | undefined)
      : undefined;
    await this.assertExists(
      this.prisma.customer.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Cliente não encontrado',
    );
  }

  async assertDealVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.dealWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.deal.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Negócio não encontrado',
    );
  }

  async assertFollowUpVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.followUpWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.leadFollowUp.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Follow-up não encontrado',
    );
  }

  async assertRenewalVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.renewalWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.policyRenewal.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Renovação não encontrada',
    );
  }

  async assertCommunicationVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.communicationWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.communicationLog.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Comunicação original não encontrada',
    );
  }

  async assertCrossSellVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.crossSellWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.crossSellOpportunity.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Oportunidade de cross-sell não encontrada',
    );
  }

  async assertOpportunityVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.opportunityWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.opportunity.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Oportunidade não encontrada',
    );
  }

  async assertQuoteComparisonVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.quoteComparisonWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.quoteComparison.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Comparativo de cotações não encontrado',
    );
  }

  async assertProposalVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.proposalWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.proposal.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Proposta não encontrada',
    );
  }

  async assertActivityVisible(
    actor: BusinessUnitActor | undefined,
    tenantId: string,
    id: string,
  ) {
    const extra = actor ? await this.activityWhere(actor) : undefined;
    await this.assertExists(
      this.prisma.activity.findFirst({
        where: andWhere({ id, tenantId }, extra),
        select: { id: true },
      }),
      'Atividade não encontrada',
    );
  }

  private async assertExists(
    lookup: Promise<{ id: string } | null>,
    message: string,
  ) {
    const found = await lookup;
    if (!found) {
      throw new NotFoundException(message);
    }
  }
}

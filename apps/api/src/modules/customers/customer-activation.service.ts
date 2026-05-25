import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  DEFAULT_RENEWAL_PIPELINE,
  type CustomerLifecycleStage,
} from '../../common/utils/customer-lifecycle.util';
import {
  inferDocumentTypeFromDigits,
  stripDocumentDigits,
} from '../../common/utils/document.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type DealWithLead = Prisma.DealGetPayload<{
  include: {
    convertedLead: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        company: true;
        document: true;
        documentType: true;
        assignedTo: true;
      };
    };
  };
}>;

type ActivationResult = {
  customerId: string;
  created: boolean;
  linked: {
    submissions: number;
    activities: number;
  };
};

@Injectable()
export class CustomerActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activateFromWonDeal(
    tenantId: string,
    dealId: string,
    performedById: string,
  ): Promise<ActivationResult | null> {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      include: {
        convertedLead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            document: true,
            documentType: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!deal || deal.status !== 'won') return null;
    if (deal.customerId) {
      return {
        customerId: deal.customerId,
        created: false,
        linked: { submissions: 0, activities: 0 },
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findExistingCustomer(tx, tenantId, deal);
      const identity = this.resolveCustomerIdentity(deal);
      const now = new Date();

      let customerId: string;
      let created = false;

      if (existing) {
        customerId = existing.id;
        await tx.customer.update({
          where: { id: existing.id },
          data: {
            lifecycleStage: this.mergeLifecycleStage(
              existing.lifecycleStage,
              'onboarding',
            ),
            ...(identity.companyName
              ? { companyName: identity.companyName }
              : {}),
            renewalStatus: existing.renewalStatus ?? 'pending',
            renewalPipeline:
              existing.renewalPipeline ?? DEFAULT_RENEWAL_PIPELINE,
          },
        });
      } else {
        const customer = await tx.customer.create({
          data: {
            tenantId,
            type: identity.type,
            name: identity.name,
            document: identity.document,
            email: identity.email,
            phone: identity.phone,
            status: 'active',
            lifecycleStage: 'won',
            sourceDealId: deal.id,
            companyName: identity.companyName,
            renewalStatus: 'pending',
            renewalPipeline: DEFAULT_RENEWAL_PIPELINE,
          },
        });
        customerId = customer.id;
        created = true;
      }

      await tx.deal.update({
        where: { id: deal.id },
        data: {
          customerId,
          wonAt: deal.wonAt ?? now,
          ...(deal.stage !== 'fechado' ? { stage: 'fechado' } : {}),
        },
      });

      const submissionOr: Prisma.QuestionnaireSubmissionWhereInput[] = [
        { dealId: deal.id },
      ];
      if (deal.convertedLead?.id) {
        submissionOr.push({ leadId: deal.convertedLead.id });
      }

      const submissions = await tx.questionnaireSubmission.updateMany({
        where: {
          tenantId,
          OR: submissionOr,
        },
        data: { customerId },
      });

      const activityOr: Prisma.ActivityWhereInput[] = [{ dealId: deal.id }];
      if (deal.convertedLead?.id) {
        activityOr.push({ leadId: deal.convertedLead.id });
      }

      const activities = await tx.activity.updateMany({
        where: {
          tenantId,
          OR: activityOr,
          customerId: null,
        },
        data: { customerId },
      });

      await tx.activity.create({
        data: {
          tenantId,
          type: 'note',
          status: 'completed',
          subject: `Negócio ganho — ${deal.title}`,
          description:
            'Cliente ativado na carteira operacional a partir do negócio.',
          operationalEventKind: 'deal_won',
          occurredAt: now,
          dealId: deal.id,
          customerId,
          leadId: deal.convertedLead?.id ?? null,
          performedById,
        },
      });

      return {
        customerId,
        created,
        linked: {
          submissions: submissions.count,
          activities: activities.count,
        },
      };
    });
  }

  private mergeLifecycleStage(
    current: string,
    next: CustomerLifecycleStage,
  ): CustomerLifecycleStage {
    const order = [
      'won',
      'onboarding',
      'awaiting_policy',
      'policy_issued',
      'active_customer',
      'inactive_customer',
      'lost_customer',
    ] as const;
    const currentIdx = order.indexOf(
      (current as CustomerLifecycleStage) ?? 'won',
    );
    const nextIdx = order.indexOf(next);
    if (currentIdx < 0) return next;
    return order[Math.max(currentIdx, nextIdx)] ?? next;
  }

  private resolveCustomerIdentity(deal: DealWithLead) {
    const lead = deal.convertedLead;
    const name =
      lead?.name?.trim() ||
      deal.title?.trim() ||
      deal.company?.trim() ||
      'Cliente sem nome';
    const email = lead?.email?.trim() || null;
    const phone = lead?.phone?.trim() || null;
    const companyName = deal.company?.trim() || lead?.company?.trim() || null;

    const documentDigits = stripDocumentDigits(lead?.document ?? '');
    if (documentDigits.length === 11 || documentDigits.length === 14) {
      const inferred = inferDocumentTypeFromDigits(documentDigits);
      return {
        type: inferred === 'cnpj' ? 'PJ' : 'PF',
        name,
        document: documentDigits,
        email,
        phone,
        companyName: inferred === 'cnpj' ? (companyName ?? name) : companyName,
      };
    }

    if (email) {
      return {
        type: 'PF' as const,
        name,
        document: `email:${email.toLowerCase()}`,
        email,
        phone,
        companyName,
      };
    }

    const phoneDigits = stripDocumentDigits(phone ?? '');
    if (phoneDigits.length >= 10) {
      return {
        type: 'PF' as const,
        name,
        document: `phone:${phoneDigits}`,
        email,
        phone,
        companyName,
      };
    }

    return {
      type: 'PF' as const,
      name,
      document: `deal:${deal.id}`,
      email,
      phone,
      companyName,
    };
  }

  private async findExistingCustomer(
    tx: Prisma.TransactionClient,
    tenantId: string,
    deal: DealWithLead,
  ) {
    const lead = deal.convertedLead;
    const documentDigits = stripDocumentDigits(lead?.document ?? '');

    if (documentDigits.length === 11 || documentDigits.length === 14) {
      const byDocument = await tx.customer.findFirst({
        where: { tenantId, document: documentDigits },
      });
      if (byDocument) return byDocument;
    }

    const email = lead?.email?.trim().toLowerCase();
    if (email) {
      const byEmail = await tx.customer.findFirst({
        where: { tenantId, email: { equals: email, mode: 'insensitive' } },
      });
      if (byEmail) return byEmail;
    }

    const phoneDigits = stripDocumentDigits(lead?.phone ?? '');
    if (phoneDigits.length >= 10) {
      const byPhone = await tx.customer.findFirst({
        where: { tenantId, phone: { contains: phoneDigits.slice(-8) } },
      });
      if (byPhone) return byPhone;
    }

    if (deal.customerId) {
      return tx.customer.findFirst({
        where: { id: deal.customerId, tenantId },
      });
    }

    return null;
  }
}

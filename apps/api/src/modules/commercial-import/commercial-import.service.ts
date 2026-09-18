import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { resolveOwnerUserIdFromAssignedTo } from '../../common/utils/owner-assignment.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { OwnershipService } from '../access/ownership.service';
import {
  CUSTOMER_IMPORT_COLUMNS,
  LEAD_IMPORT_COLUMNS,
} from './commercial-import.columns';
import {
  composeImportNotes,
  parseCustomerRow,
  parseLeadRow,
  type ImportRowError,
  type ParsedCustomerImportRow,
  type ParsedLeadImportRow,
} from './commercial-import.mapping';
import {
  buildXlsxTemplate,
  errorLogCsv,
  parseXlsxRows,
} from './commercial-import.xlsx';

type ImportActor = BusinessUnitActor & { userId: string };

@Injectable()
export class CommercialImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly buAccess: BusinessUnitAccessService,
  ) {}

  template(kind: 'leads' | 'clientes') {
    const columns = kind === 'leads' ? LEAD_IMPORT_COLUMNS : CUSTOMER_IMPORT_COLUMNS;
    const name = kind === 'leads' ? 'Leads' : 'Clientes';
    return buildXlsxTemplate(`Modelo ${name}`, columns);
  }

  async previewLeads(buffer: Buffer) {
    const { rows } = await parseXlsxRows(buffer);
    const valid: ParsedLeadImportRow[] = [];
    const errors: ImportRowError[] = [];
    rows.forEach((raw, index) => {
      const parsed = parseLeadRow(index + 2, raw);
      if (parsed.ok) valid.push(parsed.data);
      else errors.push(...parsed.errors);
    });
    return {
      total: rows.length,
      valid: valid.length,
      invalid: errors.length,
      errors,
      rows: valid,
      errorLogCsv: errorLogCsv(errors),
    };
  }

  async previewCustomers(buffer: Buffer) {
    const { rows } = await parseXlsxRows(buffer);
    const valid: ParsedCustomerImportRow[] = [];
    const errors: ImportRowError[] = [];
    rows.forEach((raw, index) => {
      const parsed = parseCustomerRow(index + 2, raw);
      if (parsed.ok) valid.push(parsed.data);
      else errors.push(...parsed.errors);
    });
    return {
      total: rows.length,
      valid: valid.length,
      invalid: errors.length,
      errors,
      rows: valid,
      errorLogCsv: errorLogCsv(errors),
    };
  }

  async commitLeads(tenantId: string, rows: ParsedLeadImportRow[], actor: ImportActor) {
    let created = 0;
    let updated = 0;
    const errors: ImportRowError[] = [];
    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    const ctx =
      enforcement === 'on'
        ? await this.ownership.resolveContext(tenantId, {
            userId: actor.userId,
            tenantId,
            roles: actor.roles,
            permissions: actor.permissions,
          })
        : null;

    for (const row of rows) {
      try {
        const ownerUserId =
          (row.ownerLabel
            ? await resolveOwnerUserIdFromAssignedTo(
                this.prisma,
                tenantId,
                row.ownerLabel,
              )
            : null) ?? actor.userId;
        const businessUnitId = await this.resolveBusinessUnitId(
          tenantId,
          row.businessUnitLabel,
          actor.currentBusinessUnitId,
        );
        const notes = composeImportNotes(row.notes, [
          ['Cidade', row.city],
          ['UF', row.uf],
          ['WhatsApp', row.whatsapp],
          ['Seguradora atual', row.currentInsurer],
          ['Data renovação', row.coverageDueAt?.slice(0, 10)],
          ['Prêmio atual', row.premiumAtual != null ? String(row.premiumAtual) : undefined],
        ]);
        const phone = row.phone || row.whatsapp || null;
        const existing = row.document
          ? await this.prisma.lead.findFirst({
              where: { tenantId, document: row.document },
              select: { id: true, ownerUserId: true, ownerTeamId: true },
            })
          : null;

        if (existing) {
          if (ctx) {
            await this.ownership.assertCanAccessLead(ctx, existing.id);
          }
          await this.prisma.lead.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              email: row.email ?? undefined,
              phone,
              company: row.company ?? undefined,
              source: row.source ?? undefined,
              notes: notes || undefined,
              assignedTo: row.ownerLabel ?? undefined,
              ownerUserId,
              businessUnitId,
              interestCategories: row.interestCategories,
            },
          });
          updated += 1;
        } else {
          await this.prisma.lead.create({
            data: {
              tenantId,
              name: row.name,
              email: row.email,
              phone,
              company: row.company,
              source: row.source ?? 'importacao',
              status: 'new',
              notes: notes || null,
              assignedTo: row.ownerLabel,
              ownerUserId,
              document: row.document,
              documentType: row.documentType,
              businessUnitId,
              interestCategories: row.interestCategories,
              lastInteractionAt: new Date(),
            },
          });
          created += 1;
        }
      } catch (error) {
        errors.push({
          row: row.row,
          message: error instanceof Error ? error.message : 'Falha ao importar lead',
        });
      }
    }

    return { created, updated, failed: errors.length, errors };
  }

  async commitCustomers(
    tenantId: string,
    rows: ParsedCustomerImportRow[],
    actor: ImportActor,
  ) {
    let created = 0;
    let updated = 0;
    let policies = 0;
    const errors: ImportRowError[] = [];

    for (const row of rows) {
      try {
        const ownerUserId =
          (row.ownerLabel
            ? await resolveOwnerUserIdFromAssignedTo(
                this.prisma,
                tenantId,
                row.ownerLabel,
              )
            : null) ?? actor.userId;
        const businessUnitId = await this.resolveBusinessUnitId(
          tenantId,
          row.businessUnitLabel,
          actor.currentBusinessUnitId,
        );
        const phone = row.phone || row.whatsapp || null;
        const type = row.documentType === 'cnpj' ? 'PJ' : 'PF';
        const interestCategories = row.product
          ? [row.product]
          : [];

        const existing = await this.prisma.customer.findUnique({
          where: { tenantId_document: { tenantId, document: row.document } },
          select: { id: true, businessUnitId: true },
        });

        let customerId: string;
        if (existing) {
          await this.buAccess.assertCustomerVisible(actor, tenantId, existing.id);
          await this.prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              email: row.email ?? undefined,
              phone,
              companyName: row.company ?? undefined,
              ownerUserId,
              businessUnitId,
              renewalDate: row.endDate ? new Date(row.endDate) : undefined,
              renewalStatus: row.endDate ? 'RENEWAL_PENDING' : undefined,
            },
          });
          customerId = existing.id;
          updated += 1;
        } else {
          const createdCustomer = await this.prisma.customer.create({
            data: {
              tenantId,
              type,
              name: row.name,
              document: row.document,
              email: row.email,
              phone,
              status: 'active',
              lifecycleStage: 'won',
              companyName: row.company,
              ownerUserId,
              businessUnitId,
              interestCategories:
                interestCategories.length > 0 ? interestCategories : [],
              renewalDate: row.endDate ? new Date(row.endDate) : null,
              renewalStatus: row.endDate ? 'RENEWAL_PENDING' : null,
            },
          });
          customerId = createdCustomer.id;
          created += 1;
        }

        if (row.policyNumber && row.insurer && row.product && row.endDate) {
          await this.upsertPolicyAndRenewal({
            tenantId,
            customerId,
            ownerUserId,
            businessUnitId,
            row,
          });
          policies += 1;
        }
      } catch (error) {
        errors.push({
          row: row.row,
          message:
            error instanceof Error ? error.message : 'Falha ao importar cliente',
        });
      }
    }

    return { created, updated, policies, failed: errors.length, errors };
  }

  private async upsertPolicyAndRenewal(params: {
    tenantId: string;
    customerId: string;
    ownerUserId: string;
    businessUnitId: string | null;
    row: ParsedCustomerImportRow;
  }) {
    const { tenantId, customerId, ownerUserId, businessUnitId, row } = params;
    const startDate = row.startDate ? new Date(row.startDate) : new Date();
    const endDate = new Date(row.endDate!);
    const policy = await this.prisma.policy.upsert({
      where: {
        tenantId_policyNumber: { tenantId, policyNumber: row.policyNumber! },
      },
      create: {
        tenantId,
        customerId,
        insurer: row.insurer!,
        policyNumber: row.policyNumber!,
        productLine: row.product!,
        premiumValue: new Prisma.Decimal(row.premium ?? 0),
        effectiveFrom: startDate,
        effectiveTo: endDate,
        status: 'active',
        renewalStatus: 'pending',
        brokerUserId: ownerUserId,
      },
      update: {
        customerId,
        insurer: row.insurer!,
        productLine: row.product!,
        premiumValue: new Prisma.Decimal(row.premium ?? 0),
        effectiveFrom: startDate,
        effectiveTo: endDate,
        status: 'active',
        brokerUserId: ownerUserId,
      },
    });

    const existingRenewal = await this.prisma.policyRenewal.findFirst({
      where: {
        tenantId,
        OR: [{ policyId: policy.id }, { policyNumber: policy.policyNumber }],
        status: { notIn: ['LOST', 'RENEWED'] },
      },
    });
    if (existingRenewal) {
      await this.prisma.policyRenewal.update({
        where: { id: existingRenewal.id },
        data: {
          customerId,
          policyId: policy.id,
          insurer: policy.insurer,
          product: policy.productLine,
          startDate,
          endDate,
          renewalDate: endDate,
          assignedUserId: ownerUserId,
          businessUnitId,
        },
      });
      return;
    }

    await this.prisma.policyRenewal.create({
      data: {
        tenantId,
        customerId,
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        insurer: policy.insurer,
        product: policy.productLine,
        startDate,
        endDate,
        renewalDate: endDate,
        status: 'RENEWAL_PENDING',
        assignedUserId: ownerUserId,
        businessUnitId,
      },
    });
  }

  private async resolveBusinessUnitId(
    tenantId: string,
    label?: string,
    currentBusinessUnitId?: string | null,
  ) {
    if (label) {
      const unit = await this.prisma.businessUnit.findFirst({
        where: {
          tenantId,
          OR: [
            { id: label },
            { slug: label },
            { name: { equals: label, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (!unit) {
        throw new BadRequestException(`Business Unit não encontrada: ${label}`);
      }
      return unit.id;
    }
    if (currentBusinessUnitId) return currentBusinessUnitId;
    const fallback = await this.prisma.businessUnit.findFirst({
      where: { tenantId, type: 'INSURANCE', isActive: true },
      select: { id: true },
    });
    return fallback?.id ?? null;
  }
}

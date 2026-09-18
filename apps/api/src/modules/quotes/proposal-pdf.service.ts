import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';

type ProposalPdfContext = {
  tenantId: string;
  proposalId: string;
  pdfVersion: number;
  title: string;
  value: number | null;
  status: string;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  clientName: string;
  clientDocument: string | null;
  dealTitle: string | null;
  insurer: string | null;
  plan: string | null;
  premiumValue: number | null;
  franchiseValue: number | null;
  coverages: string[];
  assistance: string | null;
};

@Injectable()
export class ProposalPdfService {
  private readonly storageRoot = path.join(
    process.cwd(),
    'storage',
    'proposals',
  );

  async generateAndStore(context: ProposalPdfContext): Promise<{
    storageKey: string;
    absolutePath: string;
  }> {
    const buffer = await this.buildPdfBuffer(context);
    const storageKey = `${context.tenantId}/${context.proposalId}-v${context.pdfVersion}.pdf`;
    const absolutePath = path.join(this.storageRoot, storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    return { storageKey, absolutePath };
  }

  async readStoredPdf(storageKey: string): Promise<Buffer> {
    const absolutePath = path.join(this.storageRoot, storageKey);
    return readFile(absolutePath);
  }

  private buildPdfBuffer(context: ProposalPdfContext): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currency = (value: number | null) =>
        value != null
          ? value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })
          : '—';

      doc
        .fontSize(20)
        .fillColor('#0f172a')
        .text('Proposta Comercial de Seguros', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor('#64748b')
        .text('InsureFlow', { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(14).fillColor('#0f172a').text(context.title);
      doc.moveDown(0.75);

      this.sectionTitle(doc, 'Dados do cliente');
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Nome: ${context.clientName}`);
      if (context.clientDocument) {
        doc.text(`Documento: ${context.clientDocument}`);
      }
      if (context.dealTitle) {
        doc.text(`Negócio: ${context.dealTitle}`);
      }
      doc.moveDown(1);

      if (context.insurer) {
        this.sectionTitle(doc, 'Seguro proposto');
        doc.fontSize(10).fillColor('#334155');
        doc.text(`Seguradora: ${context.insurer}`);
        if (context.plan) doc.text(`Plano: ${context.plan}`);
        doc.text(`Prêmio: ${currency(context.premiumValue)}`);
        if (context.franchiseValue != null) {
          doc.text(`Franquia: ${currency(context.franchiseValue)}`);
        }
        if (context.assistance) {
          doc.text(`Assistência: ${context.assistance}`);
        }
        if (context.coverages.length > 0) {
          doc.moveDown(0.5);
          doc.text('Coberturas:');
          context.coverages.forEach((coverage) => {
            doc.text(`  • ${coverage}`);
          });
        }
        doc.moveDown(1);
      }

      this.sectionTitle(doc, 'Resumo financeiro');
      doc.fontSize(10).fillColor('#334155');
      doc.text(
        `Valor da proposta: ${currency(context.value ?? context.premiumValue)}`,
      );
      doc.text(`Status: ${context.status}`);
      if (context.expiresAt) {
        doc.text(
          `Validade: ${new Date(context.expiresAt).toLocaleDateString('pt-BR')}`,
        );
      }
      doc.moveDown(1);

      if (context.notes?.trim()) {
        this.sectionTitle(doc, 'Observações');
        doc.fontSize(10).fillColor('#334155').text(context.notes.trim());
        doc.moveDown(1);
      }

      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text(
          `Proposta ${context.proposalId} · Emitida em ${new Date(context.createdAt).toLocaleString('pt-BR')}`,
          50,
          doc.page.height - 50,
          { align: 'center' },
        );

      doc.end();
    });
  }

  private sectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
    doc.fontSize(11).fillColor('#1e40af').text(title.toUpperCase());
    doc.moveDown(0.35);
  }
}

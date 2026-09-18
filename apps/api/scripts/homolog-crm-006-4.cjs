const ExcelJS = require('exceljs');

const API = process.env.API_URL || 'http://localhost:4000';

function cpfDigit(base, factor) {
  let sum = 0;
  for (let i = 0; i < base.length; i += 1) {
    sum += Number(base[i]) * (factor - i);
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

function makeCpf(seed) {
  const base = String(seed).padStart(9, '0').slice(-9);
  const d1 = cpfDigit(base, 10);
  const d2 = cpfDigit(`${base}${d1}`, 11);
  return `${base}${d1}${d2}`;
}

async function login() {
  const response = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: 'insureflow',
      email: 'admin@insureflow.com',
      password: 'Admin@2026!',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`login ${response.status} ${JSON.stringify(data)}`);
  return data.accessToken;
}

async function workbookBuffer(headers, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Dados');
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function postFile(token, path, buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path} ${response.status} ${JSON.stringify(data)}`);
  return data;
}

async function api(token, method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${path} ${response.status} ${text}`);
  return data;
}

async function main() {
  const token = await login();
  const stamp = Date.now().toString().slice(-6);
  const leadCpf = makeCpf(`390533${stamp}`.replace(/\D/g, '').slice(0, 9));
  const customerCpf = makeCpf(`529982${stamp}`.replace(/\D/g, '').slice(0, 9));
  const evidence = { leadCpf, customerCpf, stamp };

  const leadHeaders = [
    'Nome', 'Telefone', 'WhatsApp', 'Email', 'CPF/CNPJ', 'Empresa', 'Cidade', 'UF',
    'Origem', 'Produto Interesse', 'Seguradora Atual', 'Data Vencimento', 'Observação',
    'Responsável', 'Business Unit',
  ];
  const leadBuf = await workbookBuffer(leadHeaders, [[
    `CRM0064 Lead ${stamp}`,
    '11970001001',
    '11970001001',
    `crm0064.lead.${stamp}@avila.test`,
    leadCpf,
    'Ávila Homolog',
    'Santos',
    'SP',
    'carteira',
    'Seguro Auto',
    'Porto Seguro',
    '10/09/2026',
    'Homologação CRM-006.4',
    'admin@insureflow.com',
    'corretora-avila',
  ]]);

  const leadPreview = await postFile(
    token,
    '/api/v1/commercial-import/leads/preview',
    leadBuf,
    'leads.xlsx',
  );
  evidence.leadPreview = {
    total: leadPreview.total,
    valid: leadPreview.valid,
    invalid: leadPreview.invalid,
  };
  const leadCommit = await api(token, 'POST', '/api/v1/commercial-import/leads/commit', {
    rows: leadPreview.rows,
  });
  evidence.leadCommit = leadCommit;

  const customerHeaders = [
    'Nome', 'Telefone', 'WhatsApp', 'Email', 'CPF/CNPJ', 'Empresa', 'Cidade', 'UF',
    'Produto Contratado', 'Seguradora Atual', 'Número Apólice', 'Data Início', 'Data Vencimento',
    'Prêmio Anual', 'Corretor Responsável', 'Business Unit', 'Observação',
  ];
  const customerBuf = await workbookBuffer(customerHeaders, [[
    `CRM0064 Cliente ${stamp}`,
    '11970001002',
    '11970001002',
    `crm0064.cliente.${stamp}@avila.test`,
    customerCpf,
    'Ávila Homolog PJ',
    'Santos',
    'SP',
    'Seguro Auto',
    'Porto Seguro',
    `CRM0064-${stamp}`,
    '21/08/2025',
    '10/09/2026',
    '4800',
    'admin@insureflow.com',
    'corretora-avila',
    'Carteira de renovação homologação',
  ]]);

  const customerPreview = await postFile(
    token,
    '/api/v1/commercial-import/clientes/preview',
    customerBuf,
    'clientes.xlsx',
  );
  evidence.customerPreview = {
    total: customerPreview.total,
    valid: customerPreview.valid,
    invalid: customerPreview.invalid,
  };
  const customerCommit = await api(
    token,
    'POST',
    '/api/v1/commercial-import/clientes/commit',
    { rows: customerPreview.rows },
  );
  evidence.customerCommit = customerCommit;

  const portfolio = await api(
    token,
    'GET',
    '/api/v1/policy-renewals?dueInDays=30&limit=50',
  );
  const created = (portfolio.data ?? []).find(
    (row) => row.policyNumber === `CRM0064-${stamp}`,
  );
  evidence.portfolioHit = created
    ? {
        id: created.id,
        customerId: created.customerId,
        daysUntil: created.daysUntil,
        status: created.status,
      }
    : null;

  if (created) {
    evidence.activity = await api(
      token,
      'POST',
      `/api/v1/policy-renewals/${created.id}/activity`,
    );
    evidence.deal = await api(
      token,
      'POST',
      `/api/v1/policy-renewals/${created.id}/deal`,
    );
    evidence.customer360 = await api(
      token,
      'GET',
      `/api/v1/customers/${created.customerId}/360`,
    );
    evidence.customer360Summary = {
      customer: evidence.customer360.customer?.name,
      policies: evidence.customer360.policies?.length,
      renewals: evidence.customer360.renewals?.length,
      agendaUpcoming: evidence.customer360.agenda?.upcoming?.length,
      agendaCompleted: evidence.customer360.agenda?.completed?.length,
      totalInsured: evidence.customer360.renewalBook?.totalInsured,
      generatedRevenue: evidence.customer360.renewalBook?.generatedRevenue,
    };
    delete evidence.customer360;
    delete evidence.activity;
    evidence.dealId = evidence.deal?.dealId ?? evidence.deal?.deal?.id;
    delete evidence.deal;
  }

  const agenda = await api(token, 'GET', '/api/v1/commercial-agenda?window=next30');
  evidence.agendaMetrics = agenda.metrics;
  evidence.agendaCount = agenda.data?.length;

  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const API = process.env.API_URL || 'http://localhost:4000';
const WEB = process.env.WEB_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '../../../docs/templates/importacao');
const EVIDENCE = path.resolve(
  __dirname,
  '../../../docs/reports/avila-production-readiness.evidence.json',
);

const LEAD_HEADERS = [
  'Nome',
  'CPF/CNPJ',
  'Telefone',
  'WhatsApp',
  'Email',
  'Cidade',
  'UF',
  'Origem',
  'Produto Interesse',
  'Data Renovação',
  'Seguradora Atual',
  'Prêmio Atual',
  'Observações',
  'Responsável',
  'Business Unit',
];

const CUSTOMER_HEADERS = [
  'Nome',
  'CPF/CNPJ',
  'Telefone',
  'WhatsApp',
  'Email',
  'Cidade',
  'UF',
  'Produto',
  'Seguradora',
  'Número Apólice',
  'Vigência Inicial',
  'Vigência Final',
  'Prêmio',
  'Responsável',
  'Business Unit',
  'Observações',
];

const USERS = {
  admin: { email: 'admin@insureflow.com', password: 'Admin@2026!' },
  gerencia: { email: 'gerencia@insureflow.com', password: 'Gerencia@2026!' },
  comercial: { email: 'comercial@insureflow.com', password: 'Comercial@2026!' },
  parceiro: { email: 'parceiro@insureflow.com', password: 'Parceiro@2026!' },
};

function addDays(days) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

function isoDays(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function cpfDigit(base, factor) {
  let sum = 0;
  for (let i = 0; i < base.length; i += 1) sum += Number(base[i]) * (factor - i);
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

function makeCpf(seed) {
  const base = String(seed).replace(/\D/g, '').padStart(9, '0').slice(-9);
  const d1 = cpfDigit(base, 10);
  const d2 = cpfDigit(`${base}${d1}`, 11);
  return `${base}${d1}${d2}`;
}

async function workbookBuffer(headers, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Importacao');
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  headers.forEach((_, i) => {
    sheet.getColumn(i + 1).width = 22;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function writeOfficialTemplates() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const leadExample = [
    'Maria Santos (exemplo)',
    '390.533.447-05',
    '13999990001',
    '13999990001',
    'maria.exemplo@avila.test',
    'Santos',
    'SP',
    'indicação',
    'Seguro Auto',
    addDays(30),
    'Porto Seguro',
    '4800',
    'Linha de exemplo — apagar antes de importar',
    'admin@insureflow.com',
    'corretora-avila',
  ];
  const customerExample = [
    'João Pereira (exemplo)',
    '390.533.447-05',
    '13999990002',
    '13999990002',
    'joao.exemplo@avila.test',
    'Santos',
    'SP',
    'Seguro Auto',
    'Porto Seguro',
    'PS-EXEMPLO-0001',
    '21/08/2025',
    addDays(30),
    '4800',
    'admin@insureflow.com',
    'corretora-avila',
    'Linha de exemplo — apagar antes de importar',
  ];
  const leadBuf = await workbookBuffer(LEAD_HEADERS, [leadExample]);
  const customerBuf = await workbookBuffer(CUSTOMER_HEADERS, [customerExample]);
  fs.writeFileSync(path.join(OUT_DIR, 'LEADS.xlsx'), leadBuf);
  fs.writeFileSync(path.join(OUT_DIR, 'CLIENTES.xlsx'), customerBuf);
  return { leadBuf, customerBuf };
}

async function login(email, password) {
  const response = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantSlug: 'insureflow', email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`login ${email} ${response.status}`);
  return { token: data.accessToken, user: data.user ?? data };
}

async function api(token, method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: response.status, data };
}

async function postFile(token, path, buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return { status: response.status, data: await response.json() };
}

async function readXlsxHeaders(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const headers = [];
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? '').trim();
  });
  return headers;
}

async function main() {
  const evidence = { ranAt: new Date().toISOString(), api: API, web: WEB };

  evidence.health = {
    api: (await fetch(`${API}/api/v1/health`).then((r) => r.json().catch(() => ({ status: r.status })))),
    db: (await fetch(`${API}/api/v1/health/db`).then((r) => r.json().catch(() => ({ status: r.status })))),
    redis: (await fetch(`${API}/api/v1/health/redis`).then((r) => r.json().catch(() => ({ status: r.status })))),
  };
  try {
    const web = await fetch(WEB, { redirect: 'manual' });
    evidence.health.web = { status: web.status, location: web.headers.get('location') };
  } catch (error) {
    evidence.health.web = { error: String(error.message || error) };
  }

  const templates = await writeOfficialTemplates();
  evidence.officialFiles = {
    leads: path.join(OUT_DIR, 'LEADS.xlsx'),
    clientes: path.join(OUT_DIR, 'CLIENTES.xlsx'),
    leadHeaders: LEAD_HEADERS,
    customerHeaders: CUSTOMER_HEADERS,
  };

  const admin = await login(USERS.admin.email, USERS.admin.password);
  const templateRes = await fetch(`${API}/api/v1/commercial-import/leads/template`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const templateBuf = Buffer.from(await templateRes.arrayBuffer());
  evidence.apiLeadTemplateHeaders = await readXlsxHeaders(templateBuf);
  const customerTemplateRes = await fetch(
    `${API}/api/v1/commercial-import/clientes/template`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  );
  evidence.apiCustomerTemplateHeaders = await readXlsxHeaders(
    Buffer.from(await customerTemplateRes.arrayBuffer()),
  );
  evidence.templateMatch = {
    leads:
      JSON.stringify(evidence.apiLeadTemplateHeaders) === JSON.stringify(LEAD_HEADERS),
    clientes:
      JSON.stringify(evidence.apiCustomerTemplateHeaders) ===
      JSON.stringify(CUSTOMER_HEADERS),
  };

  const stamp = Date.now().toString().slice(-6);
  const leadCpf = makeCpf(`711844${stamp}`);
  const customerBase = makeCpf(`528224${stamp}`);

  const invalidLead = await workbookBuffer(LEAD_HEADERS, [
    ['', '123', '', '', '', '', '', '', '', '32/13/2026', '', 'abc', '', '', ''],
  ]);
  evidence.invalidLeadPreview = await postFile(
    admin.token,
    '/api/v1/commercial-import/leads/preview',
    invalidLead,
    'invalid-leads.xlsx',
  );

  const leadRow = [
    `AVILA Lead ${stamp}`,
    leadCpf,
    '13988880001',
    '13988880099',
    `avila.lead.${stamp}@avila.test`,
    'Santos',
    'SP',
    'carteira',
    'Seguro Auto',
    addDays(45),
    'Porto Seguro',
    '3200',
    'Auditoria produção',
    'comercial@insureflow.com',
    'corretora-avila',
  ];
  const leadFile = await workbookBuffer(LEAD_HEADERS, [leadRow]);
  evidence.leadPreview = await postFile(
    admin.token,
    '/api/v1/commercial-import/leads/preview',
    leadFile,
    'LEADS.xlsx',
  );
  evidence.leadCommit1 = await api(admin.token, 'POST', '/api/v1/commercial-import/leads/commit', {
    rows: evidence.leadPreview.data.rows,
  });
  leadRow[0] = `AVILA Lead ${stamp} ATUALIZADO`;
  const leadFile2 = await workbookBuffer(LEAD_HEADERS, [leadRow]);
  const preview2 = await postFile(
    admin.token,
    '/api/v1/commercial-import/leads/preview',
    leadFile2,
    'LEADS.xlsx',
  );
  evidence.leadCommit2 = await api(admin.token, 'POST', '/api/v1/commercial-import/leads/commit', {
    rows: preview2.data.rows,
  });
  const leadLookup = await api(
    admin.token,
    'GET',
    `/api/v1/leads?search=${leadCpf}&limit=20`,
  );
  const importedLead = (leadLookup.data?.data ?? leadLookup.data ?? []).find?.(
    (row) => row.document === leadCpf || row.name?.includes(stamp),
  ) ?? (Array.isArray(leadLookup.data?.data) ? leadLookup.data.data[0] : null);
  evidence.leadAfterUpsert = importedLead
    ? {
        id: importedLead.id,
        name: importedLead.name,
        notes: importedLead.notes,
        phone: importedLead.phone,
        ownerUserId: importedLead.ownerUserId,
      }
    : { lookupStatus: leadLookup.status, keys: Object.keys(leadLookup.data || {}) };

  const buckets = [
    { key: 'd60', days: 60, name: `AVILA Ren 60d ${stamp}` },
    { key: 'd30', days: 30, name: `AVILA Ren 30d ${stamp}` },
    { key: 'd15', days: 15, name: `AVILA Ren 15d ${stamp}` },
    { key: 'overdue', days: -10, name: `AVILA Ren vencida ${stamp}` },
  ];
  const customerRows = buckets.map((bucket, index) => {
    const cpf = makeCpf(`619${stamp}${index}`);
    bucket.cpf = cpf;
    return [
      bucket.name,
      cpf,
      `1397777000${index}`,
      `1397777111${index}`,
      `avila.ren.${stamp}.${index}@avila.test`,
      'Santos',
      'SP',
      'Seguro Auto',
      'Porto Seguro',
      `AVILA-${stamp}-${bucket.key}`,
      '21/08/2025',
      addDays(bucket.days),
      String(3500 + index * 100),
      'comercial@insureflow.com',
      'corretora-avila',
      `Massa ${bucket.key}`,
    ];
  });
  const customerFile = await workbookBuffer(CUSTOMER_HEADERS, customerRows);
  evidence.customerPreview = await postFile(
    admin.token,
    '/api/v1/commercial-import/clientes/preview',
    customerFile,
    'CLIENTES.xlsx',
  );
  evidence.customerCommit = await api(
    admin.token,
    'POST',
    '/api/v1/commercial-import/clientes/commit',
    { rows: evidence.customerPreview.data.rows },
  );
  evidence.customerCommit2 = await api(
    admin.token,
    'POST',
    '/api/v1/commercial-import/clientes/commit',
    { rows: evidence.customerPreview.data.rows },
  );

  const portfolioAll = await api(admin.token, 'GET', '/api/v1/policy-renewals?limit=100');
  const avilaRenewals = (portfolioAll.data?.data ?? []).filter((row) =>
    String(row.policyNumber || '').startsWith(`AVILA-${stamp}`),
  );
  evidence.portfolio = {
    totalReturned: portfolioAll.data?.data?.length,
    avila: avilaRenewals.map((row) => ({
      id: row.id,
      policyNumber: row.policyNumber,
      daysUntil: row.daysUntil,
      status: row.status,
      customerId: row.customerId,
      customer: row.customer?.name,
    })),
  };
  evidence.filters = {};
  for (const days of [30, 60, 90]) {
    const res = await api(admin.token, 'GET', `/api/v1/policy-renewals?dueInDays=${days}&limit=100`);
    const hit = (res.data?.data ?? []).filter((row) =>
      String(row.policyNumber || '').startsWith(`AVILA-${stamp}`),
    );
    evidence.filters[`due${days}`] = {
      status: res.status,
      avilaCount: hit.length,
      numbers: hit.map((row) => row.policyNumber),
      daysUntil: hit.map((row) => row.daysUntil),
    };
  }
  const overdueFilter = await api(
    admin.token,
    'GET',
    `/api/v1/policy-renewals?from=2026-01-01&to=2026-08-20&limit=100`,
  );
  evidence.filters.customOverdue = {
    status: overdueFilter.status,
    avila: (overdueFilter.data?.data ?? [])
      .filter((row) => String(row.policyNumber || '').startsWith(`AVILA-${stamp}`))
      .map((row) => ({ n: row.policyNumber, daysUntil: row.daysUntil })),
  };

  const sample30 = avilaRenewals.find((row) => row.policyNumber.endsWith('d30'));
  const sample15 = avilaRenewals.find((row) => row.policyNumber.endsWith('d15'));
  if (sample30) {
    const dealRes = await api(
      admin.token,
      'POST',
      `/api/v1/policy-renewals/${sample30.id}/deal`,
    );
    const dealId = dealRes.data?.dealId ?? dealRes.data?.deal?.id;
    let deal = null;
    if (dealId) {
      deal = await api(admin.token, 'GET', `/api/v1/crm/deals/${dealId}`);
    }
    evidence.renewalDeal = {
      status: dealRes.status,
      dealId,
      sourceType: deal.data?.sourceType ?? dealRes.data?.deal?.sourceType,
      dealStatus: deal.status,
    };
    evidence.activityFromRenewal = await api(
      admin.token,
      'POST',
      `/api/v1/policy-renewals/${sample30.id}/activity`,
    );
  }

  const customerId = sample15?.customerId || avilaRenewals[0]?.customerId;
  if (customerId) {
    const windows = [
      { label: 'overdue', days: -2 },
      { label: 'today', days: 0 },
      { label: 'next7', days: 7 },
      { label: 'next30', days: 28 },
    ];
    evidence.createdActivities = [];
    for (const item of windows) {
      const at = isoDays(item.days);
      const created = await api(admin.token, 'POST', '/api/v1/activities', {
        type: 'follow_up',
        status: 'pending',
        subject: `AVILA agenda ${item.label} ${stamp}`,
        occurredAt: at,
        nextFollowUpAt: at,
        customerId,
      });
      evidence.createdActivities.push({
        label: item.label,
        status: created.status,
        id: created.data?.id,
      });
    }
    evidence.customer360 = await api(admin.token, 'GET', `/api/v1/customers/${customerId}/360`);
    const payload = evidence.customer360.data || {};
    evidence.customer360Summary = {
      http: evidence.customer360.status,
      name: payload.customer?.name,
      tabsPresent: {
        customer: Boolean(payload.customer),
        timeline: Array.isArray(payload.timeline),
        agenda: Boolean(payload.agenda),
        renewals: Array.isArray(payload.renewals),
        deals: Array.isArray(payload.deals),
        finance: Boolean(payload.finance),
        renewalBook: Boolean(payload.renewalBook),
      },
      timeline: payload.timeline?.length,
      agendaUpcoming: payload.agenda?.upcoming?.length,
      agendaCompleted: payload.agenda?.completed?.length,
      renewals: payload.renewals?.length,
      deals: payload.deals?.length,
      totalInsured: payload.renewalBook?.totalInsured,
      generatedRevenue: payload.finance?.generatedRevenue,
    };
  }

  evidence.agenda = {};
  for (const window of ['today', 'overdue', 'next7', 'next30']) {
    const res = await api(admin.token, 'GET', `/api/v1/commercial-agenda?window=${window}`);
    const avilaItems = (res.data?.data ?? []).filter((row) =>
      String(row.customerName || '').includes(`AVILA Ren`),
    );
    evidence.agenda[window] = {
      status: res.status,
      count: res.data?.data?.length,
      metrics: res.data?.metrics,
      avilaHits: avilaItems.length,
    };
  }

  evidence.ownership = {};
  for (const [role, creds] of Object.entries(USERS)) {
    const session = await login(creds.email, creds.password);
    const leads = await api(session.token, 'GET', '/api/v1/leads?limit=100');
    const customers = await api(session.token, 'GET', '/api/v1/customers?limit=100');
    const renewals = await api(session.token, 'GET', '/api/v1/policy-renewals?limit=100');
    const agenda = await api(session.token, 'GET', '/api/v1/commercial-agenda?window=next30');
    const importLead = await api(session.token, 'POST', '/api/v1/commercial-import/leads/commit', {
      rows: [],
    });
    const importCustomer = await api(
      session.token,
      'POST',
      '/api/v1/commercial-import/clientes/commit',
      { rows: [] },
    );
    let patchLead = { status: null };
    let deleteLead = { status: null };
    const createLead = await api(session.token, 'POST', '/api/v1/leads', {
      name: `AVILA probe ${role} ${stamp}`,
      phone: '11900000000',
    });
    evidence.ownershipCreate = evidence.ownershipCreate || {};
    const createdId = createLead.data?.id;
    if (createdId) {
      patchLead = await api(session.token, 'PATCH', `/api/v1/leads/${createdId}`, {
        notes: `audit ${role}`,
      });
      deleteLead = await api(session.token, 'DELETE', `/api/v1/leads/${createdId}`);
    } else {
      patchLead = { status: createLead.status };
      deleteLead = { status: createLead.status };
    }
    let customer360 = { status: null };
    if (customerId) {
      customer360 = await api(session.token, 'GET', `/api/v1/customers/${customerId}/360`);
    }
    evidence.ownership[role] = {
      leadsHttp: leads.status,
      leadsTotal: leads.data?.meta?.total ?? leads.data?.data?.length ?? null,
      customersHttp: customers.status,
      customersTotal: customers.data?.meta?.total ?? customers.data?.data?.length ?? null,
      renewalsHttp: renewals.status,
      renewalsTotal: renewals.data?.meta?.total ?? renewals.data?.data?.length ?? null,
      agendaHttp: agenda.status,
      agendaCount: agenda.data?.data?.length ?? null,
      importLeads: importLead.status,
      importClientes: importCustomer.status,
      patchLead: patchLead.status,
      deleteLead: deleteLead.status,
      createLead: createLead.status,
      customer360: customer360.status,
    };
  }

  try {
    const page = await fetch(`${WEB}/crm/importacoes`, { redirect: 'manual' });
    evidence.frontend = {
      importacoes: page.status,
      location: page.headers.get('location'),
    };
    const agendaPage = await fetch(`${WEB}/crm/agenda`, { redirect: 'manual' });
    evidence.frontend.agenda = agendaPage.status;
    const carteira = await fetch(`${WEB}/crm/renovacoes-carteira`, { redirect: 'manual' });
    evidence.frontend.carteira = carteira.status;
    const c360 = customerId
      ? await fetch(`${WEB}/crm/customer-360/${customerId}`, { redirect: 'manual' })
      : null;
    evidence.frontend.customer360 = c360?.status ?? null;
  } catch (error) {
    evidence.frontend = { error: String(error.message || error) };
  }

  fs.writeFileSync(EVIDENCE, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({
    files: evidence.officialFiles,
    templateMatch: evidence.templateMatch,
    health: evidence.health,
    leadCommit: evidence.leadCommit1?.data,
    leadUpsert: evidence.leadCommit2?.data,
    customerCommit: evidence.customerCommit?.data,
    customerUpsert: evidence.customerCommit2?.data,
    portfolio: evidence.portfolio,
    filters: evidence.filters,
    renewalDeal: evidence.renewalDeal,
    agenda: evidence.agenda,
    customer360: evidence.customer360Summary,
    ownership: evidence.ownership,
    frontend: evidence.frontend,
    evidencePath: EVIDENCE,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

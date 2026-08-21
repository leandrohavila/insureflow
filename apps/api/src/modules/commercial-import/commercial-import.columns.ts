export const LEAD_IMPORT_COLUMNS = [
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
] as const;

export const CUSTOMER_IMPORT_COLUMNS = [
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
] as const;

export type LeadImportColumn = (typeof LEAD_IMPORT_COLUMNS)[number];
export type CustomerImportColumn = (typeof CUSTOMER_IMPORT_COLUMNS)[number];

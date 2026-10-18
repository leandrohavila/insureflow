import { selectExistingCustomer } from './customer-match.util';

describe('selectExistingCustomer', () => {
  const ana = {
    id: 'customer-ana',
    phone: '(11) 98888-7777',
    email: 'ana@example.com',
    document: '52998224725',
  };
  const bruno = {
    id: 'customer-bruno',
    phone: '(21) 98888-7777',
    email: 'bruno@example.com',
    document: '39053344705',
  };

  it('une pelo documento completo', () => {
    const selected = selectExistingCustomer({
      documentDigits: '52998224725',
      email: 'outra@example.com',
      phoneDigits: '21988887777',
      byDocument: ana,
      byEmail: [bruno],
      byPhone: [bruno],
    });

    expect(selected?.id).toBe('customer-ana');
  });

  it('não usa e-mail nem telefone quando o documento não encontra ninguém', () => {
    const selected = selectExistingCustomer({
      documentDigits: '52998224725',
      email: 'ana@example.com',
      phoneDigits: '11988887777',
      byDocument: null,
      byEmail: [ana],
      byPhone: [ana],
    });

    expect(selected).toBeNull();
  });

  it('une por e-mail apenas quando há um único cadastro', () => {
    const selected = selectExistingCustomer({
      documentDigits: '',
      email: 'ana@example.com',
      phoneDigits: '11988887777',
      byDocument: null,
      byEmail: [ana],
      byPhone: [bruno],
    });

    expect(selected?.id).toBe('customer-ana');
  });

  it('não une quando o e-mail aparece em mais de um cadastro', () => {
    const selected = selectExistingCustomer({
      documentDigits: '',
      email: 'ana@example.com',
      phoneDigits: '11988887777',
      byDocument: null,
      byEmail: [ana, bruno],
      byPhone: [ana],
    });

    expect(selected).toBeNull();
  });

  it('não une pessoas só porque os últimos oito dígitos do telefone coincidem', () => {
    const selected = selectExistingCustomer({
      documentDigits: '',
      email: null,
      phoneDigits: '11988887777',
      byDocument: null,
      byEmail: [],
      byPhone: [ana, bruno],
    });

    expect(selected?.id).toBe('customer-ana');
  });

  it('não une quando o telefone completo aparece em mais de um cadastro', () => {
    const selected = selectExistingCustomer({
      documentDigits: '',
      email: null,
      phoneDigits: '11988887777',
      byDocument: null,
      byEmail: [],
      byPhone: [ana, { ...bruno, phone: '11988887777' }],
    });

    expect(selected).toBeNull();
  });

  it('ignora um sufixo curto de telefone', () => {
    const selected = selectExistingCustomer({
      documentDigits: '',
      email: null,
      phoneDigits: '88887777',
      byDocument: null,
      byEmail: [],
      byPhone: [ana, bruno],
    });

    expect(selected).toBeNull();
  });
});

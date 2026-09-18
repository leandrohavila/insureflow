import { renderMessageTemplate } from './message-template-render.util';

describe('renderMessageTemplate', () => {
  it('substitui variáveis conhecidas', () => {
    const rendered = renderMessageTemplate(
      'Olá {{nome}}. Falamos sobre {{interesse}} na {{empresa}} com {{corretor}}.',
      {
        nome: 'João da Silva',
        interesse: 'Seguro Auto',
        empresa: 'Corretora Ávila',
        corretor: 'Ana Costa',
      },
    );

    expect(rendered).toBe(
      'Olá João da Silva. Falamos sobre Seguro Auto na Corretora Ávila com Ana Costa.',
    );
  });

  it('usa fallbacks quando variáveis estão vazias', () => {
    expect(renderMessageTemplate('Oi {{nome}}', {})).toBe('Oi cliente');
  });

  it('substitui produto e vencimento', () => {
    expect(
      renderMessageTemplate('{{produto}} vence em {{vencimento}}', {
        produto: 'Seguro Auto',
        vencimento: '04/09/2026',
      }),
    ).toBe('Seguro Auto vence em 04/09/2026');
  });
});

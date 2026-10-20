import { matchQuestionnaireTemplates } from './questionnaire-template-match.util';

describe('matchQuestionnaireTemplates', () => {
  const auto = {
    id: 'tpl-auto',
    settings: { wizardBranch: 'auto' },
  };
  const vida = {
    id: 'tpl-vida',
    settings: { wizardBranch: 'vida' },
  };
  const residencial = {
    id: 'tpl-res',
    settings: { wizardBranch: 'residencial' },
  };
  const compra = {
    id: 'tpl-compra',
    settings: {
      wizardBranch: 'property_buy',
      interestCategories: ['PROPERTY_BUY'],
    },
  };

  it('sugere o questionário de auto para lead de seguro auto', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['AUTO_INSURANCE'],
      businessUnitType: 'INSURANCE',
      templates: [auto, vida, residencial, compra],
    });

    expect(result).toEqual({
      match: 'unique',
      suggestedTemplateId: 'tpl-auto',
      templateIds: ['tpl-auto'],
    });
  });

  it('sugere o questionário imobiliário de compra quando o template existe', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['PROPERTY_BUY'],
      businessUnitType: 'REAL_ESTATE',
      templates: [auto, residencial, compra],
    });

    expect(result).toEqual({
      match: 'unique',
      suggestedTemplateId: 'tpl-compra',
      templateIds: ['tpl-compra'],
    });
  });

  it('não associa o seguro residencial a um lead de compra de imóvel', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['PROPERTY_BUY'],
      businessUnitType: 'REAL_ESTATE',
      templates: [auto, residencial],
    });

    expect(result.match).toBe('none');
    expect(result.suggestedTemplateId).toBeNull();
    expect(result.templateIds).toEqual([]);
    expect(result.reason).toBe('no_template');
  });

  it('não escolhe sozinho quando há dois templates do mesmo produto', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['AUTO_INSURANCE'],
      businessUnitType: 'INSURANCE',
      templates: [
        auto,
        { id: 'tpl-auto-2', settings: { catalogProduct: 'auto' } },
      ],
    });

    expect(result.match).toBe('ambiguous');
    expect(result.suggestedTemplateId).toBeNull();
    expect(result.templateIds).toEqual(['tpl-auto', 'tpl-auto-2']);
  });

  it('usa a unidade para ignorar interesse de outro negócio', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['AUTO_INSURANCE', 'PROPERTY_BUY'],
      businessUnitType: 'REAL_ESTATE',
      templates: [auto, compra],
    });

    expect(result).toEqual({
      match: 'unique',
      suggestedTemplateId: 'tpl-compra',
      templateIds: ['tpl-compra'],
    });
  });

  it('não sugere template por um único campo isolado', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['AUTO_INSURANCE'],
      businessUnitType: 'INSURANCE',
      templates: [
        {
          id: 'tpl-fields',
          settings: {},
          fieldKeys: ['shared.full_name', 'auto.plate'],
        },
        vida,
      ],
    });
    expect(result.match).toBe('none');
    expect(result.suggestedTemplateId).toBeNull();
    expect(result.reason).toBe('no_template');
  });

  it('reconhece o produto quando há mais de um campo específico', () => {
    const result = matchQuestionnaireTemplates({
      interests: ['AUTO_INSURANCE'],
      businessUnitType: 'INSURANCE',
      templates: [
        {
          id: 'tpl-fields',
          settings: {},
          fieldKeys: ['shared.full_name', 'auto.plate', 'auto.model'],
        },
        vida,
      ],
    });
    expect(result.match).toBe('unique');
    expect(result.suggestedTemplateId).toBe('tpl-fields');
  });

  it('explica a ausência de produto no lead sem escolher template incompatível', () => {
    const result = matchQuestionnaireTemplates({
      interests: [],
      businessUnitType: 'INSURANCE',
      templates: [auto],
    });
    expect(result).toMatchObject({
      match: 'none',
      suggestedTemplateId: null,
      reason: 'missing_interest',
    });
  });
});

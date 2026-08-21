import {
  decodeActivityEventMetadata,
  encodeActivityEventMetadata,
} from './activity-event-metadata.util';

describe('activity-event-metadata.util', () => {
  it('codifica e decodifica metadados extensíveis', () => {
    const encoded = encodeActivityEventMetadata({
      submissionId: 'sub-1',
      templateId: 'tpl-1',
    });

    expect(encoded).toBeTruthy();
    expect(decodeActivityEventMetadata(encoded)).toEqual({
      submissionId: 'sub-1',
      templateId: 'tpl-1',
    });
  });

  it('ignora outcome legado sem versão', () => {
    expect(decodeActivityEventMetadata('Resultado humano')).toBeNull();
  });

  it('retorna null para metadados vazios', () => {
    expect(encodeActivityEventMetadata(undefined)).toBeNull();
    expect(encodeActivityEventMetadata({})).toBeNull();
  });
});

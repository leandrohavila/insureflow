import 'reflect-metadata';

import { PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';
import { QuestionnairesController } from './questionnaires.controller';

function handlerMetadata(methodName: string) {
  const handler = Object.getOwnPropertyDescriptor(
    QuestionnairesController.prototype,
    methodName,
  )?.value as ((...args: unknown[]) => unknown) | undefined;
  if (!handler) return undefined;
  return Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[] | undefined;
}

describe('permissões do questionário inteligente', () => {
  it('exige gestão para publicar, compartilhar e revisar', () => {
    expect(handlerMetadata('publishTemplateVersion')).toEqual([
      'questionnaires:manage',
    ]);
    expect(handlerMetadata('createShare')).toEqual(['questionnaires:manage']);
    expect(handlerMetadata('reviseSubmission')).toEqual([
      'questionnaires:manage',
    ]);
    expect(handlerMetadata('revokeShare')).toEqual(['questionnaires:manage']);
    expect(handlerMetadata('ensureIntelligentForm')).toEqual([
      'questionnaires:manage',
    ]);
  });

  it('exige leitura para consultar versões e compartilhamentos', () => {
    expect(handlerMetadata('listTemplateVersions')).toEqual([
      'questionnaires:view',
    ]);
    expect(handlerMetadata('listShares')).toEqual(['questionnaires:view']);
    expect(handlerMetadata('findSubmissions')).toEqual(['questionnaires:view']);
  });
});

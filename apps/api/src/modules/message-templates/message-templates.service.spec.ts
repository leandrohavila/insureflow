import { MessageTemplatesService } from './message-templates.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';

describe('MessageTemplatesService', () => {
  it('cria template de reativação', async () => {
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 'tpl-1', ...data }),
    );
    const prisma = {
      messageTemplate: { create },
    } as unknown as PrismaService;
    const businessUnits = {
      assertIds: jest.fn(),
    } as unknown as BusinessUnitsService;

    const service = new MessageTemplatesService(prisma, businessUnits);
    const result = await service.create('tenant-1', {
      name: 'Retorno',
      channel: 'WHATSAPP',
      content: 'Olá {{nome}}',
    });

    expect(result.kind).toBe('reactivation');
    expect(create).toHaveBeenCalled();
  });
});

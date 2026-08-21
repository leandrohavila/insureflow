import {
  PERMISSIONS_KEY,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';
import { CrmController } from '../crm/crm.controller';
import { LeadsController } from './leads.controller';

function handlerMetadata(
  prototype: object,
  methodName: string,
): string[] | undefined {
  const handler = Object.getOwnPropertyDescriptor(prototype, methodName)
    ?.value as ((...args: unknown[]) => unknown) | undefined;
  if (!handler) return undefined;
  return Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[] | undefined;
}

describe('CRM permission metadata', () => {
  it('requires crm:view for findDeal', () => {
    expect(handlerMetadata(CrmController.prototype, 'findDeal')).toContain(
      'crm:view',
    );
  });

  it('requires leads:share for createLeadShare', () => {
    expect(
      handlerMetadata(LeadsController.prototype, 'createLeadShare'),
    ).toContain('leads:share');
  });

  it('requires leads:view for listLeadShares', () => {
    expect(
      handlerMetadata(LeadsController.prototype, 'listLeadShares'),
    ).toContain('leads:view');
  });
});

describe('RequirePermissions decorator', () => {
  it('stores permission metadata on handler', () => {
    class Demo {
      @RequirePermissions('crm:view')
      handler() {}
    }

    expect(handlerMetadata(Demo.prototype, 'handler')).toEqual(['crm:view']);
  });
});

import {
  betweenPipelineOrders,
  nextPipelineOrder,
  PIPELINE_ORDER_STEP,
} from './pipeline-order.util';

describe('pipeline-order.util', () => {
  it('appends with fixed step', () => {
    expect(nextPipelineOrder(null)).toBe(PIPELINE_ORDER_STEP);
    expect(nextPipelineOrder(3000)).toBe(4000);
  });

  it('computes midpoint for insertion', () => {
    expect(betweenPipelineOrders(1000, 3000)).toBe(2000);
  });
});

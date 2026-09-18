export const PIPELINE_ORDER_STEP = 1000;

/** Próximo valor de ordem no estágio (append). */
export function nextPipelineOrder(maxExisting: number | null | undefined) {
  return (maxExisting ?? 0) + PIPELINE_ORDER_STEP;
}

/** Ordem intermediária entre dois vizinhos (fractional indexing). */
export function betweenPipelineOrders(before: number, after: number) {
  return (before + after) / 2;
}

/** Logs temporários do contrato Deal (ativar com DEAL_CONTRACT_DEBUG=1). */
export function isDealContractDebug(): boolean {
  return process.env.DEAL_CONTRACT_DEBUG === '1';
}

/** Auditoria de runtime (DTO + ValidationPipe + controller). */
export function isRuntimeAudit(): boolean {
  return (
    process.env.RUNTIME_AUDIT === '1' || process.env.DEAL_CONTRACT_DEBUG === '1'
  );
}

export function logDealContract(
  layer: string,
  payload: Record<string, unknown>,
): void {
  if (!isDealContractDebug()) return;

  console.debug(`[deal-contract][${layer}]`, JSON.stringify(payload));
}

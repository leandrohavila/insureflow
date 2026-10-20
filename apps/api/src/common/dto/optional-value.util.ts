/** Converte null/undefined/string vazia em undefined para @IsOptional(). */
export function optionalEmptyValue({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

/** Mantém null para limpar uma data já gravada. String vazia também vira null. */
export function nullableEmptyDate({ value }: { value: unknown }) {
  if (value === '' || value === null) return null;
  return value;
}

/** Mantém null para limpar texto já gravado. String vazia também vira null. */
export function nullableEmptyText({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  return value;
}
